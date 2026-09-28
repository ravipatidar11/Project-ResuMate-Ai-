"""Offline resume-writing helpers based on user-provided text and role keywords."""

import re
from typing import Any, Dict, List, Optional


ROLE_SKILLS = {
    "software engineer": ["Python", "Java", "SQL", "Git", "REST API", "Docker", "Testing"],
    "frontend developer": ["JavaScript", "TypeScript", "React", "HTML", "CSS", "Accessibility", "Testing"],
    "full stack developer": ["JavaScript", "React", "Python", "SQL", "REST API", "Docker", "Git"],
    "data scientist": ["Python", "SQL", "Statistics", "Machine Learning", "Pandas", "Data Visualization"],
    "project manager": ["Project Management", "Agile", "Communication", "Leadership", "Planning"],
    "product manager": ["Product Management", "Product Strategy", "Analytics", "Communication", "Roadmapping"],
    "marketing": ["Content Marketing", "SEO", "Analytics", "Communication", "Campaign Management"],
    "accountant": ["Accounting", "Financial Analysis", "Excel", "Auditing", "Attention to Detail"],
    "business analyst": ["SQL", "Excel", "Requirements Analysis", "Data Visualization", "Communication"],
    "ux designer": ["Figma", "User Research", "Prototyping", "Accessibility", "Usability Testing"],
    "cybersecurity analyst": ["Network Security", "Linux", "Incident Response", "Risk Management", "Python"],
    "sales representative": ["CRM", "Negotiation", "Communication", "Account Management", "Sales"],
    "human resources": ["Recruitment", "Employee Relations", "Communication", "HR Management", "Training"],
    "teacher": ["Curriculum Development", "Communication", "Classroom Management", "Assessment", "Training"],
    "nurse": ["Patient Care", "Clinical Documentation", "Communication", "Time Management", "Healthcare"],
}
ROLE_ALIASES = {
    "software engineer": ("software", "backend", "back end", "api developer", "java developer", "python developer"),
    "frontend developer": ("frontend", "front end", "ui developer", "react developer", "web developer"),
    "full stack developer": ("full stack", "fullstack"),
    "data scientist": ("data scientist", "data science", "data analyst", "machine learning"),
    "project manager": ("project manager", "program manager", "delivery manager"),
    "product manager": ("product manager", "product owner"),
    "marketing": ("marketing", "seo", "content marketer", "digital marketer"),
    "accountant": ("accountant", "accounting", "finance analyst"),
    "business analyst": ("business analyst", "business intelligence"),
    "ux designer": ("ux designer", "ui designer", "product designer"),
    "cybersecurity analyst": ("cybersecurity", "security analyst", "information security"),
    "sales representative": ("sales", "account executive", "business development"),
    "human resources": ("human resources", "hr manager", "recruiter", "talent acquisition"),
    "teacher": ("teacher", "educator", "instructor"),
    "nurse": ("nurse", "nursing", "clinical nurse"),
}


class AIService:
    """Provide predictable resume suggestions without a remote model connection."""

    @staticmethod
    def get_engine_status() -> Dict[str, Any]:
        """Report the built-in analysis engine without contacting external services."""
        return {
            "available": True,
            "engine": "Built-in Resume Analysis Rules",
            "message": "Resume analysis and writing suggestions use built-in rules and need no external model service.",
        }

    @classmethod
    async def generate_summary(
        cls,
        role: str,
        experience_level: str = "Mid-level",
        key_skills: Optional[List[str]] = None,
        recent_experience: str = "",
    ) -> Dict[str, Any]:
        role = (role or "Professional").strip()
        skills = list(dict.fromkeys(skill.strip() for skill in (key_skills or []) if skill.strip()))[:6]
        first_sentence = f"{experience_level or 'Professional'} {role}"
        if skills:
            first_sentence += f" with experience in {', '.join(skills)}"
        first_sentence += "."
        parts = [first_sentence]
        if recent_experience and recent_experience.strip():
            parts.append(f"Recent experience includes {recent_experience.strip().rstrip('.')}.")
        parts.append("Add a verified achievement and measurable result that show your impact.")
        return {
            "success": True,
            "result": " ".join(parts),
            "model_used": "Built-in Resume Writing Rules",
            "suggestions": ["Replace or edit every placeholder-style prompt with details you can verify."],
        }

    @classmethod
    async def improve_summary(cls, current_summary: str, target_role: str = "") -> Dict[str, Any]:
        summary = (current_summary or "").strip()
        if not summary:
            return await cls.generate_summary(target_role or "Professional")
        summary = re.sub(r"^(?:I am|I'm|I have been|I have|My goal is to be)\s+", "", summary, flags=re.IGNORECASE)
        summary = re.sub(r"\s+", " ", summary).strip()
        if summary and summary[0].islower():
            summary = summary[0].upper() + summary[1:]
        suggestions = ["Review this cleaned-up version and keep only statements that accurately describe your experience."]
        if target_role and target_role.lower() not in summary.lower():
            suggestions.append(f"Consider naming '{target_role}' if that is the role you are targeting.")
        if not re.search(r"\d", summary):
            suggestions.append("Add a verified number or outcome if you have one; do not estimate or invent metrics.")
        return {"success": True, "result": summary, "model_used": "Built-in Resume Writing Rules", "suggestions": suggestions}

    @classmethod
    async def improve_experience(cls, role: str, company: str, bullets: List[str]) -> Dict[str, Any]:
        replacements = (
            (r"^responsible for\s+", "Managed "),
            (r"^worked on\s+", "Contributed to "),
            (r"^helped (?:with|to)\s+", "Supported "),
            (r"^assisted (?:with|in)\s+", "Supported "),
            (r"^involved in\s+", "Contributed to "),
            (r"^handled\s+", "Managed "),
        )
        improved = []
        for raw in bullets or []:
            bullet = (raw or "").strip().lstrip("-*• ").strip()
            if not bullet:
                continue
            for pattern, replacement in replacements:
                if re.match(pattern, bullet, re.IGNORECASE):
                    bullet = re.sub(pattern, replacement, bullet, count=1, flags=re.IGNORECASE)
                    break
            if bullet and bullet[0].islower():
                bullet = bullet[0].upper() + bullet[1:]
            if bullet and bullet[-1] not in ".!?":
                bullet += "."
            improved.append(bullet)
        return {
            "success": True,
            "result": improved,
            "model_used": "Built-in Resume Writing Rules",
            "suggestions": ["Add verified scope or outcomes to relevant bullets; no metrics have been invented."],
        }

    @classmethod
    async def generate_project_description(cls, title: str, technologies: List[str], overview: Optional[str] = "") -> Dict[str, Any]:
        title = (title or "Project").strip()
        tech = list(dict.fromkeys(value.strip() for value in (technologies or []) if value.strip()))[:8]
        overview = (overview or "").strip()
        bullets = []
        if overview:
            bullets.append(f"{overview.rstrip('.')} as part of {title}.")
        if tech:
            bullets.append(f"Used {', '.join(tech)} to build or support {title}; specify the parts you personally delivered.")
        if not bullets:
            bullets.append(f"Describe the problem solved, your contribution, and verified outcome for {title}.")
        return {
            "success": True,
            "result": bullets,
            "model_used": "Built-in Resume Writing Rules",
            "suggestions": ["Add only features and results that are accurate for this project."],
        }

    @classmethod
    async def generate_bullets(cls, role: str, industry: str = "Tech", keywords: Optional[List[str]] = None, count: int = 4) -> Dict[str, Any]:
        role = (role or "target role").strip()
        keywords = list(dict.fromkeys(word.strip() for word in (keywords or []) if word.strip()))[:5]
        focus = f" using {', '.join(keywords)}" if keywords else ""
        templates = [
            f"For a {role}, describe how you delivered [specific responsibility or project]{focus} and the verified result.",
            f"Improved [process, product, or service] by [verified amount] through [your specific action]{focus}.",
            f"Collaborated with [team or stakeholders] to complete [specific goal] for [customer or business need].",
            f"Applied [verified skill or tool] to resolve [specific challenge], resulting in [measurable outcome if known].",
        ]
        return {
            "success": True,
            "result": templates[:max(1, min(count, len(templates)))],
            "model_used": "Built-in Resume Writing Rules",
            "suggestions": ["Replace bracketed prompts with your own verified details before adding a bullet to your resume."],
        }

    @classmethod
    async def improve_skills_section(cls, current_skills: Any, target_role: str = "") -> Dict[str, Any]:
        role = re.sub(r"[^a-z0-9]+", " ", (target_role or "").strip().lower())
        role_skills = next((values for role_name, values in ROLE_SKILLS.items() if any(alias in role for alias in ROLE_ALIASES.get(role_name, (role_name,)))), [])
        current = []
        if isinstance(current_skills, dict):
            for values in current_skills.values():
                current.extend(values if isinstance(values, list) else [])
        elif isinstance(current_skills, list):
            current = current_skills
        existing = {str(value).lower() for value in current}
        suggestions = [value for value in role_skills if value.lower() not in existing]
        return {
            "success": True,
            "result": {
                "suggested_additions": suggestions[:10],
                "recommended_structure": {"Technical Skills": ["Languages", "Frameworks", "Databases"], "Tools & Platforms": ["Tools you have used"], "Soft Skills": ["Strengths supported by experience"]},
            },
            "model_used": "Built-in Resume Writing Rules",
            "suggestions": ["These are role-based examples, not verified skills. Add only skills you actually have."],
        }
