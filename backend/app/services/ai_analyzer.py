"""Deterministic resume and job-description analysis; no model or external API required."""

import re
from typing import Any, Dict, List, Optional

from fastapi import HTTPException

from app.services.parser_service import ParserService, SOFT_SKILLS, TECH_SKILLS


ACTION_VERBS = {
    "achieved", "analyzed", "automated", "built", "created", "delivered", "designed",
    "developed", "directed", "drove", "engineered", "established", "executed", "improved",
    "implemented", "increased", "launched", "led", "managed", "mentored", "migrated",
    "optimized", "organized", "planned", "reduced", "redesigned", "resolved", "scaled",
    "simplified", "streamlined", "supported", "trained", "transformed", "upgraded",
}

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

SCORE_LABELS = {
    "summary": "Summary", "skills": "Skills", "experience": "Experience",
    "internships": "Internships", "projects": "Projects", "education": "Education",
    "certifications": "Certifications", "achievements": "Achievements", "structure": "Structure",
    "clarity": "Clarity", "ats": "ATS", "impact": "Impact", "relevance": "Relevance",
    "action_verbs": "Action Verbs", "quantified_achievements": "Quantified Achievements",
    "technical_depth": "Technical Depth", "professionalism": "Professionalism",
}


class AIAnalyzer:
    """Use transparent rules and recognized resume keywords for review suggestions."""

    @staticmethod
    def _is_usable_job_match(job_match: Any) -> bool:
        """Accept substantive matches, including a real zero score, and reject placeholders."""
        if not isinstance(job_match, dict):
            return False
        substantive = False
        for key in ("important_skills", "overlapping_skills", "missing_skills", "recommended_changes"):
            values = job_match.get(key)
            if isinstance(values, list) and any(str(value).strip().lower() not in {"", "...", "n/a", "none"} for value in values):
                substantive = True
                break
        explanation = str(job_match.get("explanation") or "").strip()
        if explanation and explanation.lower() not in {"...", "n/a", "none"}:
            substantive = True
        return substantive

    @staticmethod
    def _strings(value: Any) -> List[str]:
        if value is None:
            return []
        if isinstance(value, str):
            return [value.strip()] if value.strip() else []
        if isinstance(value, dict):
            result: List[str] = []
            for nested in value.values():
                result.extend(AIAnalyzer._strings(nested))
            return result
        if isinstance(value, (list, tuple, set)):
            result = []
            for nested in value:
                result.extend(AIAnalyzer._strings(nested))
            return result
        return []

    @staticmethod
    def _get(data: Dict[str, Any], *names: str) -> Any:
        for name in names:
            value = data.get(name)
            if value not in (None, "", [], {}):
                return value
        return None

    @classmethod
    def _resume_text(cls, data: Dict[str, Any]) -> str:
        parts: List[str] = []
        for key in ("personal_info", "target_role", "summary", "skills", "experience", "internships", "projects", "education", "certifications", "achievements", "languages", "interests"):
            parts.extend(cls._strings(data.get(key)))
        return " ".join(parts)

    @staticmethod
    def _matches(text: str, candidates: List[str]) -> List[str]:
        lowered = text.lower()
        found = []
        for item in candidates:
            term = str(item).strip()
            if term and re.search(r"(?<![a-z0-9])" + re.escape(term.lower()) + r"(?![a-z0-9])", lowered):
                found.append(term)
        return list(dict.fromkeys(found))

    @staticmethod
    def _score(value: float) -> int:
        return max(0, min(100, round(value)))

    @classmethod
    def _score_item(cls, score: float, explanation: str) -> Dict[str, Any]:
        return {"score": cls._score(score), "explanation": explanation}

    @staticmethod
    def _entries(value: Any) -> List[Any]:
        if isinstance(value, list):
            return value
        if isinstance(value, dict):
            return [value]
        return []

    @staticmethod
    def _starts_with_action(bullet: str) -> bool:
        match = re.match(r"[A-Za-z]+", bullet.strip().lstrip("-*• "))
        return bool(match and match.group(0).lower() in ACTION_VERBS)

    @classmethod
    def _job_match(cls, resume_text: str, resume_data: Dict[str, Any], job_description: str, target_role: str) -> Optional[Dict[str, Any]]:
        requirements = cls._matches(job_description, TECH_SKILLS + SOFT_SKILLS)
        if not requirements:
            return None

        resume_skills = cls._matches(resume_text, requirements)
        gaps = [skill for skill in requirements if skill not in resume_skills]
        skill_score = 100 * len(resume_skills) / len(requirements)
        projects = cls._entries(resume_data.get("projects"))
        project_text = " ".join(cls._strings(projects))
        project_hits = cls._matches(project_text, requirements)
        experiences = cls._entries(resume_data.get("experience")) + cls._entries(resume_data.get("internships"))
        education = cls._entries(resume_data.get("education"))
        title_in_resume = bool(target_role and target_role.lower() in resume_text.lower())
        experience_score = 78 if experiences else 30
        project_score = 85 if project_hits else (55 if projects else 30)
        education_score = 82 if education else 35
        scores = {
            "technical_skills": cls._score_item(skill_score, f"{len(resume_skills)} of {len(requirements)} recognized job skills were found in the resume."),
            "experience": cls._score_item(experience_score, "Work experience or internship entries are present." if experiences else "No work experience or internship entries were found."),
            "projects": cls._score_item(project_score, f"Projects mention {len(project_hits)} recognized job skills." if project_hits else ("Projects are listed, but no recognized job skills were found in their text." if projects else "No projects are listed.")),
            "education": cls._score_item(education_score, "Education is listed in the resume." if education else "No education entry was found."),
            "keyword_relevance": cls._score_item(skill_score, "This estimate uses recognized keyword overlap; it does not assess semantic equivalence."),
        }
        overall = cls._score(
            scores["technical_skills"]["score"] * 0.45
            + scores["experience"]["score"] * 0.20
            + scores["projects"]["score"] * 0.15
            + scores["education"]["score"] * 0.10
            + scores["keyword_relevance"]["score"] * 0.10
        )
        recommended = [
            f"If you have this experience, add a truthful example showing where you used {skill}. Do not add it if it does not match your background."
            for skill in gaps[:5]
        ]
        if not title_in_resume and target_role:
            recommended.insert(0, f"If this is your target role, include '{target_role}' in your headline or summary.")
        if not recommended:
            recommended.append("Keep the matching skills connected to specific experience or project examples.")
        listed_skills = cls._strings(resume_data.get("skills"))
        other_skills = [skill for skill in listed_skills if skill.lower() not in {item.lower() for item in requirements}]
        return {
            "overall_score": overall,
            "explanation": f"The resume contains {len(resume_skills)} of {len(requirements)} recognized skills from the job description. This is a keyword estimate, not a semantic or hiring prediction.",
            "scores": scores,
            "important_skills": requirements[:20],
            "overlapping_skills": resume_skills,
            "missing_skills": gaps,
            "irrelevant_content": [f"{skill} is listed in the resume but was not found in this job description." for skill in other_skills[:8]],
            "recommended_changes": recommended,
        }

    @classmethod
    async def suggest_skills(cls, current_skills: Any, target_role: str = "") -> Dict[str, Any]:
        role = re.sub(r"[^a-z0-9]+", " ", (target_role or "").lower()).strip()
        role_skills = next((skills for role_name, skills in ROLE_SKILLS.items() if any(alias in role for alias in ROLE_ALIASES.get(role_name, (role_name,)))), [])
        if not role_skills:
            role_skills = cls._matches(role, TECH_SKILLS + SOFT_SKILLS)
        existing = {item.lower() for item in cls._strings(current_skills)}
        suggestions = [skill for skill in role_skills if skill.lower() not in existing]
        return {
            "success": True,
            "result": {
                "suggested_additions": suggestions[:10],
                "recommended_structure": {
                    "Technical Skills": ["Languages", "Frameworks", "Databases"] if role_skills else ["Add role-relevant skills you can verify"],
                    "Tools & Platforms": ["List tools you have used"],
                    "Soft Skills": ["List strengths supported by your experience"],
                },
                "reasoning": "Suggestions are role-based examples. Add a skill only if it reflects your actual experience.",
            },
            "suggestions": ["Verify each suggested skill before adding it to your resume."],
            "model_used": "Built-in Resume Analysis Rules",
        }

    @classmethod
    async def tailor_resume(cls, resume_data: Dict[str, Any], job_description: str) -> Dict[str, Any]:
        if not job_description.strip():
            raise HTTPException(status_code=422, detail="A job description is required to compare this resume.")
        resume_text = cls._resume_text(resume_data)
        target_role = str(resume_data.get("target_role") or "")
        match = cls._job_match(resume_text, resume_data, job_description, target_role)
        if not match:
            relevant_terms = []
        else:
            relevant_terms = match["overlapping_skills"]
        raw_bullets: List[str] = []
        for section in ("experience", "internships", "projects"):
            for entry in cls._entries(resume_data.get(section)):
                if isinstance(entry, dict):
                    raw_bullets.extend(cls._strings(entry.get("bullets") or entry.get("responsibilities") or entry.get("description")))
        job_terms = cls._matches(job_description, TECH_SKILLS + SOFT_SKILLS)
        relevant_bullets = [bullet for bullet in raw_bullets if cls._matches(bullet, job_terms)]
        gaps = (match or {}).get("missing_skills", [])
        summary = str(resume_data.get("summary") or "").strip()
        if not summary:
            verified_skills = ", ".join(relevant_terms[:4])
            summary = f"{target_role or 'Professional'} with experience in {verified_skills}. Add a verified achievement and role-specific focus before using this draft." if verified_skills else f"{target_role or 'Professional'} with experience relevant to the target role. Add verified skills and achievements before using this draft."
        return {
            "tailored_headline": target_role or "Target role",
            "suggested_summary": summary,
            "suggested_bullet_points": relevant_bullets[:6],
            "critical_skills_to_add": gaps[:8],
            "keywords_to_embed": gaps[:8],
            "message": "Existing facts were preserved. Suggested missing skills are gaps to verify, not claims about your experience.",
        }

    @classmethod
    async def analyze_resume(
        cls,
        resume_text: str,
        target_role: str = "",
        job_description: str = "",
        resume_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        data = resume_data if isinstance(resume_data, dict) else ParserService.extract_structured_data(resume_text or "")
        data = data or {}
        personal = data.get("personal_info") or {}
        if not isinstance(personal, dict):
            personal = {}
        summary = str(data.get("summary") or "").strip()
        if not summary and resume_text:
            summary_match = re.search(r"(?:professional\s+)?summary\s*[:\n]+([^\n]+(?:\n(?![A-Z][A-Za-z /&-]{2,}:)[^\n]+)*)", resume_text, re.IGNORECASE)
            summary = summary_match.group(1).strip() if summary_match else ""
        target_role = target_role or str(data.get("target_role") or cls._get(personal, "jobTitle", "job_title") or "")
        text = (resume_text or cls._resume_text(data)).strip()
        lowered = text.lower()

        experience = cls._entries(data.get("experience"))
        internships = cls._entries(data.get("internships"))
        projects = cls._entries(data.get("projects"))
        education = cls._entries(data.get("education"))
        certifications = cls._entries(data.get("certifications"))
        achievements = cls._entries(data.get("achievements"))
        skills = data.get("skills") or {}
        skill_text = " ".join(cls._strings(skills))
        detected_technical = cls._matches(text + " " + skill_text, TECH_SKILLS)
        detected_soft = cls._matches(text + " " + skill_text, SOFT_SKILLS)

        experience_bullets: List[str] = []
        for entry in experience + internships:
            if isinstance(entry, dict):
                experience_bullets.extend(cls._strings(entry.get("bullets") or entry.get("responsibilities") or entry.get("description")))
        project_bullets: List[str] = []
        for entry in projects:
            if isinstance(entry, dict):
                project_bullets.extend(cls._strings(entry.get("bullets") or entry.get("description") or entry.get("subtitle")))
        bullets = experience_bullets + project_bullets
        metric_pattern = re.compile(r"(?:\b\d+(?:\.\d+)?\s*(?:%|percent|k|m|million|thousand|users|clients|projects|hours|days|weeks|months|years)\b|[$₹€£]\s*\d)", re.IGNORECASE)
        metric_bullets = [bullet for bullet in bullets if metric_pattern.search(bullet)]
        action_bullets = [bullet for bullet in bullets if cls._starts_with_action(bullet)]
        summary_words = len(summary.split())

        summary_score = 28 if not summary else 55 if summary_words < 20 else 90 if 30 <= summary_words <= 80 else 72 if summary_words <= 100 else 58
        if summary and re.search(r"\b(?:I|me|my|we|our)\b", summary, re.IGNORECASE):
            summary_score -= 12
        skills_score = min(98, 35 + len(detected_technical) * 7 + len(detected_soft) * 3)
        experience_score = (40 if experience else 25 if not internships else 55) + min(25, len(experience) * 8) + min(20, len(experience_bullets) * 4)
        if bullets:
            experience_score += round(15 * len(metric_bullets) / len(bullets))
        internship_score = 70 if not internships and experience else 35 if not internships else min(96, 55 + len(internships) * 12 + min(25, len([b for item in internships if isinstance(item, dict) for b in cls._strings(item.get("bullets"))]) * 4))
        project_score = 35 if not projects else min(96, 55 + len(projects) * 12 + min(20, len(detected_technical) * 2))
        education_score = 32 if not education else 72 if not any(isinstance(item, dict) and cls._get(item, "degree", "institution") for item in education) else 92
        certification_score = 68 if not certifications else min(98, 78 + 5 * len(certifications))
        achievement_score = 68 if not achievements else min(98, 70 + min(25, len(achievements) * 8))
        structured_sections = sum(bool(data.get(key)) for key in ("summary", "skills", "experience", "internships", "projects", "education", "certifications"))
        structure_score = round(35 + 65 * structured_sections / 7)
        long_bullets = sum(1 for bullet in bullets if len(bullet.split()) > 45)
        first_person = bool(re.search(r"\b(?:I|me|my|we|our)\b", text, re.IGNORECASE))
        job_match = cls._job_match(text, data, job_description, target_role) if job_description.strip() else None
        relevance_score = job_match["overall_score"] if job_match else (82 if target_role and target_role.lower() in text.lower() else 68 if target_role else 72)
        action_score = 45 if not bullets else 100 * len(action_bullets) / len(bullets)
        impact_score = 30 if not bullets else 25 + 75 * len(metric_bullets) / len(bullets)
        technical_score = min(98, 35 + len(detected_technical) * 8)

        full_name = cls._get(personal, "fullName", "full_name", "name")
        email = cls._get(personal, "email")
        phone = cls._get(personal, "phone", "phoneNumber", "phone_number")
        location = cls._get(personal, "location", "address")
        contact_count = sum(bool(value) for value in (full_name, email, phone, location))
        ats_score = min(100, 34 + contact_count * 10 + min(26, structured_sections * 4))
        clarity_score = max(35, 88 - min(24, long_bullets * 6) - (12 if summary_words > 100 else 0) - (8 if first_person else 0))
        professionalism_score = max(45, 88 - (14 if first_person else 0) - (10 if not email else 0) - min(20, long_bullets * 4))

        scores = {
            "summary": cls._score_item(summary_score, f"The summary contains {summary_words} words." if summary else "No professional summary was found."),
            "skills": cls._score_item(skills_score, f"Found {len(detected_technical)} technical and {len(detected_soft)} soft skills in the resume."),
            "experience": cls._score_item(experience_score, f"Found {len(experience)} work entries and {len(experience_bullets)} work bullets." if experience or experience_bullets else "No work experience bullets were found."),
            "internships": cls._score_item(internship_score, f"Found {len(internships)} internship entries." if internships else "Internships are optional; work experience is present." if experience else "No internship entries were found."),
            "projects": cls._score_item(project_score, f"Found {len(projects)} project entries." if projects else "No projects were listed."),
            "education": cls._score_item(education_score, f"Found {len(education)} education entries." if education else "No education entries were found."),
            "certifications": cls._score_item(certification_score, f"Found {len(certifications)} certifications." if certifications else "No certifications listed; include them when relevant to the target role."),
            "achievements": cls._score_item(achievement_score, f"Found {len(achievements)} achievement entries." if achievements else "No separate achievements section was found."),
            "structure": cls._score_item(structure_score, f"Found content in {structured_sections} of 7 common resume sections."),
            "clarity": cls._score_item(clarity_score, f"Found {long_bullets} bullets longer than 45 words."),
            "ats": cls._score_item(ats_score, f"Found {contact_count} of 4 common contact fields and {structured_sections} standard sections."),
            "impact": cls._score_item(impact_score, f"{len(metric_bullets)} of {len(bullets)} bullets include a measurable result." if bullets else "Add experience or project bullets to assess measurable impact."),
            "relevance": cls._score_item(relevance_score, f"Keyword alignment against the job description is {relevance_score}/100." if job_match else ("The target role appears in the resume." if relevance_score == 82 else "A target role was supplied; add more role-specific evidence." if target_role else "Add a target role or job description for a role-specific relevance estimate.")),
            "action_verbs": cls._score_item(action_score, f"{len(action_bullets)} of {len(bullets)} bullets begin with a recognized action verb." if bullets else "No bullets were available to assess action verbs."),
            "quantified_achievements": cls._score_item(impact_score, f"{len(metric_bullets)} of {len(bullets)} bullets contain a number or measurable unit." if bullets else "No bullets were available to assess measurable achievements."),
            "technical_depth": cls._score_item(technical_score, f"Found {len(detected_technical)} recognized technical skills."),
            "professionalism": cls._score_item(professionalism_score, "Checked for contact details, first-person wording, and overly long bullets."),
        }

        weights = {"summary": 0.10, "skills": 0.12, "experience": 0.18, "projects": 0.08, "education": 0.08, "structure": 0.08, "clarity": 0.08, "ats": 0.12, "impact": 0.10, "relevance": 0.06}
        overall_score = cls._score(sum(scores[key]["score"] * weight for key, weight in weights.items()))
        strengths = []
        if summary and 30 <= summary_words <= 80:
            strengths.append("The summary is within a concise 30–80 word range.")
        if detected_technical:
            strengths.append(f"The resume shows relevant technical skills: {', '.join(detected_technical[:6])}.")
        if metric_bullets:
            strengths.append(f"{len(metric_bullets)} bullet(s) include measurable results.")
        if experience:
            strengths.append(f"The resume includes {len(experience)} work experience entr{'y' if len(experience) == 1 else 'ies'}.")
        if not strengths:
            strengths.append("The resume text was parsed and checked for sections, contact details, skills, and measurable results.")

        missing_information = []
        if not full_name:
            missing_information.append("Add your full name to the contact section.")
        if not email:
            missing_information.append("Add a professional email address.")
        if not phone:
            missing_information.append("Add a phone number if recruiters should contact you by phone.")
        if not summary:
            missing_information.append("Add a short professional summary.")
        if not experience and not internships:
            missing_information.append("Add relevant work experience, internships, or volunteer experience.")
        if not education:
            missing_information.append("Add your education history.")
        if not skills:
            missing_information.append("Add a skills section with skills you can verify.")

        ats_issues = []
        ats_reasons = []
        if not email:
            ats_issues.append("No email address was detected in the contact information.")
        if not re.search(r"\b(?:19|20)\d{2}\b", text):
            ats_issues.append("No four-digit education or employment year was detected.")
        if len(text) > 12000:
            ats_issues.append("The extracted resume text is long; check that the resume stays focused.")
        ats_reasons.append(f"Recognized {structured_sections} common resume sections.")
        ats_reasons.append("This check reviews extracted text and cannot inspect visual layout or guarantee how a specific ATS will parse the file.")

        recommended_changes = []
        if not summary:
            recommended_changes.append("Add a 2–4 sentence summary focused on the target role and verified experience.")
        if bullets and not metric_bullets:
            recommended_changes.append("Add verified numbers, scale, or outcomes to relevant bullets where you can support them.")
        if not detected_technical and target_role:
            recommended_changes.append(f"Add role-relevant skills for {target_role} only when they reflect your experience.")
        if not re.search(r"\b(?:19|20)\d{2}\b", text):
            recommended_changes.append("Add accurate dates for work and education entries.")
        if len(summary.split()) > 80:
            recommended_changes.append("Shorten the summary to roughly 30–80 words and keep its strongest evidence.")
        if not recommended_changes:
            recommended_changes.append("Keep each skill tied to a specific, truthful example in your experience or projects.")

        weaknesses = []
        if not summary:
            weaknesses.append({"section": "Summary", "current": "", "problem": "A recruiter may not see the candidate's focus quickly.", "improvement": "State the target role, verified strengths, and one concrete result.", "suggested_version": f"{target_role or '[target role]'} with experience in [verified skills]. Add [verified achievement] and the type of role you are seeking."})
        elif summary_words > 80:
            weaknesses.append({"section": "Summary", "current": summary[:240], "problem": f"The summary contains {summary_words} words and may be difficult to scan.", "improvement": "Keep the most relevant role, skills, and evidence in a shorter summary."})
        if bullets and not metric_bullets:
            weaknesses.append({"section": "Experience", "current": experience_bullets[0][:220] if experience_bullets else "", "problem": "The listed bullets do not show measurable outcomes.", "improvement": "Add a verified scale, time, cost, quality, or volume result where available.", "suggested_version": (experience_bullets[0][:180].rstrip(" .") + " — [add verified result]") if experience_bullets else ""})
        if not detected_technical and target_role:
            weaknesses.append({"section": "Skills", "current": "", "problem": f"No recognized technical skills were found for the target role '{target_role}'.", "improvement": "List role-relevant tools and skills that you can support with real experience."})
        if not email:
            weaknesses.append({"section": "Contact", "current": "", "problem": "No email address was detected.", "improvement": "Add a professional email address near your name."})

        job_match = cls._job_match(text, data, job_description, target_role) if job_description.strip() else None
        missing_skills = job_match["missing_skills"][:10] if job_match else []
        keyword_items = []
        if job_match:
            keyword_items = [{"keyword": skill, "found": skill in job_match["overlapping_skills"], "category": "Job requirement"} for skill in job_match["important_skills"]]
        else:
            keyword_items = [{"keyword": skill, "found": True, "category": "Detected skill"} for skill in detected_technical[:15]]

        return {
            "model": "Rule-based analyzer",
            "provider": "Built-in Resume Analysis",
            "job_description_used": bool(job_description.strip()),
            "overall_score": {"score": overall_score, "explanation": f"This score summarizes resume structure, role keywords, contact details, and measurable evidence. It is a guidance estimate, not a hiring prediction."},
            "scores": scores,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "missing_information": missing_information,
            "technical_skills": detected_technical,
            "soft_skills": detected_soft,
            "evidence_skills": {"technical": detected_technical, "soft": detected_soft},
            "ats_details": {"issues": ats_issues, "reasons": ats_reasons, "recommended_changes": recommended_changes},
            "job_match": job_match,
            "job_match_status": "matched" if job_match else "insufficient_requirements" if job_description.strip() else None,
            "job_match_fallback": False,
        }

    @classmethod
    def legacy_analysis_fields(cls, report: Dict[str, Any]) -> Dict[str, Any]:
        scores = report["scores"]
        section_scores = {label: scores[key]["score"] for key, label in SCORE_LABELS.items()}
        ats_score = scores["ats"]["score"]
        job = report.get("job_match") or {}
        detected = list(dict.fromkeys(report.get("technical_skills", []) + report.get("soft_skills", [])))
        missing = list(job.get("missing_skills", []))
        keyword_items = [
            {"keyword": skill, "found": skill in job.get("overlapping_skills", []), "category": "Job requirement"}
            for skill in job.get("important_skills", [])
        ]
        suggestions = list(report.get("ats_details", {}).get("recommended_changes", []))
        suggestions.extend(job.get("recommended_changes", []))
        suggestions.extend(item.get("improvement", "") for item in report.get("weaknesses", []) if isinstance(item, dict))
        return {
            "overall_score": report["overall_score"]["score"],
            "ats_compatibility": "Excellent" if ats_score >= 85 else "Good" if ats_score >= 70 else "Moderate" if ats_score >= 50 else "Needs Improvement",
            "section_scores": section_scores,
            "detected_skills": detected,
            "missing_skills": missing,
            "keywords": keyword_items,
            "formatting_issues": list(report.get("ats_details", {}).get("issues", [])),
            "missing_information": list(report.get("missing_information", [])),
            "suggestions": list(dict.fromkeys(item for item in suggestions if isinstance(item, str) and item.strip())),
            "ai_report": report,
        }
