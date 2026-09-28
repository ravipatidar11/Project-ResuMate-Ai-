import re
import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

# Action verbs and quantifiable templates for intelligent offline generation
ACTION_VERBS = [
    "Spearheaded", "Architected", "Engineered", "Optimized", "Implemented", "Orchestrated",
    "Streamlined", "Accelerated", "Delivered", "Automated", "Standardized", "Pioneered",
    "Revamped", "Designed", "Formulated", "Supervised", "Transformed", "Facilitated"
]

ROLE_TEMPLATES = {
    "software engineer": {
        "summary": "Results-oriented Software Engineer with proven expertise in building high-performance, fault-tolerant distributed systems and modern web applications. Skilled in clean architecture, microservices, and CI/CD pipelines with a steadfast focus on scalability and developer productivity.",
        "skills": ["Python", "FastAPI", "React", "TypeScript", "Docker", "PostgreSQL", "System Design", "Git", "REST APIs", "CI/CD"],
        "bullets": [
            "Architected and deployed distributed backend microservices handling 25,000+ daily requests with 99.95% service availability.",
            "Refactored mission-critical database queries and added Redis caching, decreasing median API response times by 42%.",
            "Instituted automated end-to-end and unit testing pipelines in GitHub Actions, increasing test coverage from 60% to 92%.",
            "Spearheaded the migration of legacy monolith architecture to Docker containers, trimming deployment cycle duration by 65%."
        ]
    },
    "frontend developer": {
        "summary": "Creative and user-centric Frontend Developer with extensive experience crafting responsive, accessible, and pixel-perfect web interfaces. Adept in React, Tailwind CSS, performance optimization, and seamless RESTful integration.",
        "skills": ["React", "JavaScript", "TypeScript", "Tailwind CSS", "HTML5", "CSS3", "Redux", "Webpack/Vite", "Responsive Design", "Jest"],
        "bullets": [
            "Developed responsive user interfaces across 15+ web modules using React and Tailwind CSS, increasing user engagement by 28%.",
            "Implemented lazy loading, code-splitting, and memoization techniques to achieve a 95+ Google Lighthouse performance score.",
            "Collaborated with UX/UI designers and backend engineers to translate Figma wireframes into reusable, accessible design systems.",
            "Integrated real-time state management and web sockets, reducing client-side sync latency by 50%."
        ]
    },
    "full stack developer": {
        "summary": "Versatile Full-Stack Developer proficient in end-to-end application lifecycle management, from modern frontend UIs to robust server architectures and relational/NoSQL databases. Dedicated to shipping scalable and secure software.",
        "skills": ["React", "Node.js", "Python", "FastAPI", "PostgreSQL", "Docker", "Git", "Tailwind CSS", "AWS", "REST APIs"],
        "bullets": [
            "Built and scaled full-stack web applications from ideation to production, supporting 10,000+ active monthly users.",
            "Designed and implemented secure RESTful endpoints with JWT authentication and strict input validation schemas.",
            "Established CI/CD deployment pipelines using Docker and cloud hosting, ensuring seamless zero-downtime releases.",
            "Optimized frontend bundle sizes and database query indices, achieving a 38% decrease in overall end-to-end latency."
        ]
    },
    "data scientist": {
        "summary": "Analytical Data Scientist with strong foundational skills in statistical modeling, machine learning algorithms, and predictive analytics. Passionate about uncovering actionable business insights from large-scale structured and unstructured datasets.",
        "skills": ["Python", "Pandas", "NumPy", "Scikit-Learn", "TensorFlow", "SQL", "Data Visualization", "Tableau", "Git", "Statistical Analysis"],
        "bullets": [
            "Formulated and trained predictive machine learning classification models yielding an 89% F1-score on customer churn analytics.",
            "Engineered ETL pipelines processing 2M+ records daily with automated data validation checks.",
            "Visualized multi-dimensional data patterns and key business metrics using interactive dashboards for executive stakeholders.",
            "Conducted statistical A/B tests to optimize user conversion funnels, driving a 14% improvement in trial conversions."
        ]
    }
}

class AIService:
    @staticmethod
    async def check_ollama_status() -> Dict[str, Any]:
        """Check if local Ollama instance is available and which models are installed."""
        try:
            # Cloud-hosted Ollama may be reached through a sleeping Render instance
            # and a home-computer tunnel, so allow time for that path to wake up.
            async with httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=8.0)) as client:
                res = await client.get(
                    f"{settings.OLLAMA_BASE_URL}/api/tags",
                    headers={"Authorization": f"Bearer {settings.OLLAMA_API_KEY}"} if settings.OLLAMA_API_KEY else None,
                )
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", []) if m.get("name")]
                    configured_model_found = any(
                        name == settings.OLLAMA_MODEL or name.startswith(f"{settings.OLLAMA_MODEL}:")
                        for name in models if name
                    )
                    return {
                        "available": configured_model_found,
                        "url": settings.OLLAMA_BASE_URL,
                        "active_model": settings.OLLAMA_MODEL,
                        "installed_models": models,
                        "message": (
                            f"Ollama is ready with {settings.OLLAMA_MODEL}."
                            if configured_model_found
                            else f"Ollama is running, but '{settings.OLLAMA_MODEL}' is missing. Run 'ollama pull {settings.OLLAMA_MODEL}'."
                        )
                    }
                logger.warning("Ollama status probe returned HTTP %s", res.status_code)
                return {
                    "available": False,
                    "url": settings.OLLAMA_BASE_URL,
                    "active_model": settings.OLLAMA_MODEL,
                    "installed_models": [],
                    "message": (
                        f"Ollama proxy returned HTTP {res.status_code}. Check that Render OLLAMA_API_KEY "
                        "matches the Worker BACKEND_API_KEY, and that the Worker upstream token and tunnel are active."
                    ),
                }
        except httpx.TimeoutException:
            return {
                "available": False,
                "url": settings.OLLAMA_BASE_URL,
                "active_model": settings.OLLAMA_MODEL,
                "installed_models": [],
                "message": "Timed out contacting Ollama. Check that the PC, Ollama, authenticated gateway, and Cloudflare tunnel are running.",
            }
        except httpx.HTTPError as exc:
            logger.warning("Ollama status probe failed: %s", exc.__class__.__name__)
            return {
                "available": False,
                "url": settings.OLLAMA_BASE_URL,
                "active_model": settings.OLLAMA_MODEL,
                "installed_models": [],
                "message": "Could not reach the Ollama proxy. Check its Worker URL and active Cloudflare tunnel.",
            }

        return {
            "available": False,
            "url": settings.OLLAMA_BASE_URL,
            "active_model": settings.OLLAMA_MODEL,
            "installed_models": [],
            "message": f"Ollama is unavailable. Start the Ollama service and run 'ollama pull {settings.OLLAMA_MODEL}'. AI resume analysis requires the local model and will not return a fallback score."
        }

    @classmethod
    async def query_ollama(cls, prompt: str, system_prompt: str = "") -> Optional[str]:
        """Attempt to query local Ollama LLM."""
        try:
            payload = {
                "model": settings.OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.4
                }
            }
            if system_prompt:
                payload["system"] = system_prompt

            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json=payload,
                    headers={"Authorization": f"Bearer {settings.OLLAMA_API_KEY}"} if settings.OLLAMA_API_KEY else None,
                )
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", "").strip()
        except Exception as e:
            logger.warning(f"Ollama call failed or timed out: {e}")
        return None

    @classmethod
    async def generate_summary(
        cls,
        role: str,
        experience_level: str = "Mid-level",
        key_skills: List[str] = None,
        recent_experience: str = ""
    ) -> Dict[str, Any]:
        """Generate an impactful professional resume summary."""
        key_skills = key_skills or []
        skills_str = ", ".join(key_skills) if key_skills else "modern software engineering and problem-solving"
        
        # 1. Try Ollama local LLM
        prompt = (
            f"Generate a professional, high-impact 3-4 sentence resume summary for a {experience_level} {role or 'Professional'}.\n"
            f"Key skills: {skills_str}.\n"
            f"Recent background: {recent_experience or 'demonstrated excellence delivering reliable solutions'}.\n"
            f"Keep it ATS-friendly, concise, avoiding first-person pronouns ('I', 'me'). Return ONLY the summary text."
        )
        ollama_res = await cls.query_ollama(prompt, "You are an expert executive resume writer and ATS optimization specialist.")
        if ollama_res:
            return {
                "success": True,
                "result": ollama_res,
                "model_used": f"Ollama ({settings.OLLAMA_MODEL})",
                "is_local_llm": True,
                "suggestions": [
                    "Ensure your years of experience in the summary match your work history.",
                    "Highlight 2-3 specific technologies relevant to your target job."
                ]
            }

        # 2. Intelligent Built-in Fallback
        role_lower = role.lower()
        matched_template = None
        for k in ROLE_TEMPLATES:
            if k in role_lower:
                matched_template = ROLE_TEMPLATES[k]
                break

        if matched_template:
            base_summary = matched_template["summary"]
            if key_skills:
                base_summary += f" Core competencies include {', '.join(key_skills[:5])}."
        else:
            base_summary = (
                f"Results-driven and adaptable {experience_level} {role or 'Professional'} with a proven track record "
                f"of designing, building, and optimizing scalable solutions. Demonstrates strong analytical proficiency, "
                f"cross-functional collaboration, and technical expertise in {skills_str}. Committed to delivering "
                f"measurable business impact and continuous operational improvement."
            )

        return {
            "success": True,
            "result": base_summary,
            "model_used": "Built-in Free Intelligent NLP Engine",
            "is_local_llm": False,
            "suggestions": [
                "Tailor keywords to match the exact requirements of your target job description.",
                "Quantify notable accomplishments wherever applicable."
            ]
        }

    @classmethod
    async def improve_summary(cls, current_summary: str, target_role: str = "") -> Dict[str, Any]:
        """Improve and polish an existing summary with stronger verbs and ATS keywords."""
        if not current_summary.strip():
            return await cls.generate_summary(role=target_role or "Professional")

        prompt = (
            f"Enhance and rewrite this resume summary for ATS compatibility, active voice, and professional impact:\n"
            f"'{current_summary}'\n"
            f"Target role: {target_role or 'General'}.\n"
            f"Rules: Eliminate fluff/buzzwords, keep it 3-4 punchy sentences, remove 'I/me'. Return ONLY the revised summary."
        )
        ollama_res = await cls.query_ollama(prompt)
        if ollama_res:
            return {
                "success": True,
                "result": ollama_res,
                "model_used": f"Ollama ({settings.OLLAMA_MODEL})",
                "is_local_llm": True
            }

        # Heuristic enhancement
        revised = current_summary.strip()
        # Remove weak starters
        revised = re.sub(r'^(I am a|I have|Looking for a job as a|A hard working)\s*', '', revised, flags=re.IGNORECASE)
        revised = revised[0].upper() + revised[1:] if revised else ""
        if not revised.endswith('.'):
            revised += '.'
        
        enhanced = (
            f"Accomplished {target_role or 'professional'} with a proven record of driving operational excellence. "
            f"{revised} Proven ability to identify bottlenecks, execute technical solutions, and partner with stakeholders to meet strategic milestones."
        )

        return {
            "success": True,
            "result": enhanced,
            "model_used": "Built-in Free Intelligent NLP Engine",
            "is_local_llm": False
        }

    @classmethod
    async def improve_experience(
        cls,
        role: str,
        company: str,
        bullets: List[str]
    ) -> Dict[str, Any]:
        """Rewrite and enhance experience bullet points with metric-driven XYZ formulas."""
        prompt = (
            f"Enhance these resume bullets for role '{role}' at '{company}'.\n"
            f"Format using Google's X-Y-Z formula (Accomplished [X] as measured by [Y], by doing [Z]).\n"
            f"Use strong action verbs, quantify impact where reasonable, and ensure ATS readability.\n"
            f"Input bullets:\n" + "\n".join(f"- {b}" for b in bullets) + "\n"
            f"Output ONLY the revised bullets as a bulleted list starting with '- '."
        )
        ollama_res = await cls.query_ollama(prompt)
        if ollama_res:
            lines = [line.lstrip('-*• ').strip() for line in ollama_res.splitlines() if line.strip()]
            return {
                "success": True,
                "result": lines,
                "model_used": f"Ollama ({settings.OLLAMA_MODEL})",
                "is_local_llm": True
            }

        # Heuristic improvement
        improved = []
        action_idx = 0
        for b in bullets:
            b_clean = b.strip()
            if not b_clean:
                continue
            # Remove passive verbs
            b_clean = re.sub(r'^(Responsible for|Handled|Worked on|Assisted in|Helped with)\s*', '', b_clean, flags=re.IGNORECASE)
            verb = ACTION_VERBS[action_idx % len(ACTION_VERBS)]
            action_idx += 1
            
            # If bullet lacks quantifiable metrics, suggest realistic metrics
            if not any(char in b_clean for char in ["%", "$", "+", "k", "M"]):
                b_clean = f"{verb} {b_clean[0].lower() + b_clean[1:] if b_clean else ''}, driving a 25% increase in team throughput and system reliability."
            else:
                b_clean = f"{verb} {b_clean[0].lower() + b_clean[1:] if b_clean else ''}."
            improved.append(b_clean)

        if not improved:
            role_key = next((k for k in ROLE_TEMPLATES if k in role.lower()), "software engineer")
            improved = ROLE_TEMPLATES[role_key]["bullets"]

        return {
            "success": True,
            "result": improved,
            "model_used": "Built-in Free Intelligent NLP Engine",
            "is_local_llm": False
        }

    @classmethod
    async def generate_project_description(
        cls,
        title: str,
        technologies: List[str],
        overview: Optional[str] = ""
    ) -> Dict[str, Any]:
        """Generate high-impact project bullets highlighting architecture, stack, and outcomes."""
        tech_str = ", ".join(technologies) if technologies else "Modern Web Technologies"
        prompt = (
            f"Generate 3 crisp, professional resume bullet points for a project titled '{title}'.\n"
            f"Tech stack: {tech_str}.\n"
            f"Overview: {overview or 'End-to-end full-stack software application'}.\n"
            f"Highlight architecture, problem solved, and key features. Return ONLY a bulleted list starting with '- '."
        )
        ollama_res = await cls.query_ollama(prompt)
        if ollama_res:
            lines = [line.lstrip('-*• ').strip() for line in ollama_res.splitlines() if line.strip()]
            return {
                "success": True,
                "result": lines,
                "model_used": f"Ollama ({settings.OLLAMA_MODEL})",
                "is_local_llm": True
            }

        bullets = [
            f"Architected and deployed {title} utilizing {tech_str}, delivering a responsive, secure, and user-centric experience.",
            f"Implemented automated state management and RESTful APIs, optimizing data fetching efficiency by 40%.",
            f"Integrated comprehensive test coverage and CI/CD pipelines, ensuring reliable build and zero-downtime deployment."
        ]
        return {
            "success": True,
            "result": bullets,
            "model_used": "Built-in Free Intelligent NLP Engine",
            "is_local_llm": False
        }

    @classmethod
    async def generate_bullets(
        cls,
        role: str,
        industry: str = "Tech",
        keywords: List[str] = None,
        count: int = 4
    ) -> Dict[str, Any]:
        """Generate role-tailored bullet points on demand."""
        keywords = keywords or []
        kw_str = ", ".join(keywords) if keywords else "scalability, performance, collaboration"
        prompt = (
            f"Generate {count} strong resume bullet points for a '{role}' in {industry}.\n"
            f"Incorporate these keywords: {kw_str}.\n"
            f"Use strong action verbs and quantifiable metrics. Return ONLY bullets starting with '- '."
        )
        ollama_res = await cls.query_ollama(prompt)
        if ollama_res:
            lines = [line.lstrip('-*• ').strip() for line in ollama_res.splitlines() if line.strip()]
            return {
                "success": True,
                "result": lines,
                "model_used": f"Ollama ({settings.OLLAMA_MODEL})",
                "is_local_llm": True
            }

        role_key = next((k for k in ROLE_TEMPLATES if k in role.lower()), "software engineer")
        return {
            "success": True,
            "result": ROLE_TEMPLATES[role_key]["bullets"][:count],
            "model_used": "Built-in Free Intelligent NLP Engine",
            "is_local_llm": False
        }

    @classmethod
    async def improve_skills_section(
        cls,
        current_skills: Any,
        target_role: str = ""
    ) -> Dict[str, Any]:
        """Suggest trending, high-impact skills tailored to candidate's target role."""
        role_key = next((k for k in ROLE_TEMPLATES if k in target_role.lower()), "software engineer")
        suggested = ROLE_TEMPLATES[role_key]["skills"]

        existing_flat = []
        if isinstance(current_skills, dict):
            for k, v in current_skills.items():
                if isinstance(v, list):
                    existing_flat.extend([str(x).lower() for x in v])
        elif isinstance(current_skills, list):
            existing_flat = [str(x).lower() for x in current_skills]

        missing_suggestions = [s for s in suggested if s.lower() not in existing_flat]

        return {
            "success": True,
            "result": {
                "suggested_additions": missing_suggestions or ["Docker", "Kubernetes", "CI/CD", "TypeScript", "GraphQL"],
                "recommended_structure": {
                    "Technical Skills": ["Languages", "Frameworks", "Databases"],
                    "Tools & DevOps": ["Git", "Docker", "Cloud (AWS/GCP)", "CI/CD"],
                    "Soft Skills": ["Cross-functional Teamwork", "Technical Leadership", "Agile/Scrum"]
                }
            },
            "model_used": "Built-in Free Intelligent NLP Engine",
            "is_local_llm": False
        }
