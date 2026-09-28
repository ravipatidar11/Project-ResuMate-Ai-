import re
from typing import Dict, Any, List, Tuple
from app.services.parser_service import TECH_SKILLS, SOFT_SKILLS

class ATSEngine:
    @classmethod
    def analyze_resume_data(cls, resume_dict: Dict[str, Any], raw_text: str = "") -> Dict[str, Any]:
        """Comprehensive ATS scoring and diagnostic evaluation of resume data."""
        personal_info = resume_dict.get("personal_info", {})
        summary = resume_dict.get("summary", "")
        experience = resume_dict.get("experience", [])
        education = resume_dict.get("education", [])
        projects = resume_dict.get("projects", [])
        skills_raw = resume_dict.get("skills", {})
        certifications = resume_dict.get("certifications", [])

        # Flatten skills
        skills_list = []
        if isinstance(skills_raw, dict):
            for k, v in skills_raw.items():
                if isinstance(v, list):
                    skills_list.extend([str(item) for item in v])
        elif isinstance(skills_raw, list):
            skills_list.extend([str(item) for item in skills_raw])

        # If raw_text is empty, build synthetic text from data
        if not raw_text:
            text_parts = [
                personal_info.get("fullName", ""),
                summary,
                " ".join(skills_list),
            ]
            for exp in experience:
                text_parts.append(f"{exp.get('role', '')} {exp.get('company', '')}")
                text_parts.extend(exp.get("bullets", []))
            for edu in education:
                text_parts.append(f"{edu.get('degree', '')} {edu.get('institution', '')}")
            for prj in projects:
                text_parts.append(f"{prj.get('title', '')}")
                text_parts.extend(prj.get("bullets", []))
            raw_text = " ".join(text_parts)

        text_lower = raw_text.lower()

        # 1. Contact Score (100 Max)
        contact_score = 0
        missing_info = []
        formatting_issues = []
        suggestions = []

        if personal_info.get("fullName"):
            contact_score += 25
        else:
            missing_info.append("Candidate Full Name is missing")

        if personal_info.get("email") and "@" in personal_info.get("email"):
            contact_score += 25
        else:
            missing_info.append("Valid professional email address is missing")

        if personal_info.get("phone"):
            contact_score += 20
        else:
            missing_info.append("Phone contact number is missing")

        if personal_info.get("location"):
            contact_score += 10
        else:
            missing_info.append("Location (City, Country) is missing")

        if personal_info.get("linkedin") or "linkedin.com" in text_lower:
            contact_score += 10
        else:
            suggestions.append("Add a LinkedIn profile link to improve recruiter searchability.")

        if personal_info.get("github") or personal_info.get("portfolio") or "github.com" in text_lower:
            contact_score += 10
        else:
            suggestions.append("Include a GitHub or portfolio link to showcase tangible proof of work.")

        # 2. Summary Score (100 Max)
        summary_score = 0
        if summary and len(summary.strip()) > 30:
            word_count = len(summary.split())
            if 30 <= word_count <= 80:
                summary_score = 95
            elif word_count > 80:
                summary_score = 80
                formatting_issues.append("Professional Summary exceeds 80 words. Aim for 3-4 concise, impactful sentences.")
            else:
                summary_score = 70
                suggestions.append("Expand your summary to 3-4 sentences outlining your key achievements and core competencies.")
            
            # Check for first-person pronouns
            if re.search(r'\b(I|me|my|we)\b', summary, re.IGNORECASE):
                summary_score = max(50, summary_score - 15)
                formatting_issues.append("Avoid first-person pronouns ('I', 'me', 'my') in summary. Use active voice.")
        else:
            summary_score = 20
            missing_info.append("Professional Summary section is missing or too brief.")
            suggestions.append("Add a 3-sentence summary highlighting your years of experience, core domains, and impact.")

        # 3. Experience Score (100 Max)
        exp_score = 0
        if experience:
            exp_count = len(experience)
            exp_score += min(40, exp_count * 20)

            # Check bullets and metrics
            total_bullets = 0
            metric_bullets = 0
            action_verb_bullets = 0

            for exp in experience:
                bullets = exp.get("bullets", [])
                total_bullets += len(bullets)
                for b in bullets:
                    # check for numbers or percentage or currency
                    if re.search(r'(\d+[\%kKmM\+]?|\$\d+)', b):
                        metric_bullets += 1
                    # check for strong action verbs
                    first_word = b.strip().split()[0].lower() if b.strip() else ""
                    if first_word.endswith(("ed", "ized", "ated", "red")):
                        action_verb_bullets += 1

            if total_bullets > 0:
                metric_ratio = metric_bullets / total_bullets
                if metric_ratio >= 0.5:
                    exp_score += 35
                elif metric_ratio >= 0.25:
                    exp_score += 25
                else:
                    exp_score += 15
                    suggestions.append("Only a few bullets have quantifiable metrics. Add numbers (e.g. '% faster', 'INR saved', 'X users').")

                action_ratio = action_verb_bullets / total_bullets
                if action_ratio >= 0.5:
                    exp_score += 25
                else:
                    exp_score += 15
                    suggestions.append("Begin every experience bullet point with an impactful past-tense action verb.")
            else:
                missing_info.append("Work experience entries lack descriptive bullet points.")
        else:
            exp_score = 25
            missing_info.append("No Work Experience or Internship records listed.")

        # 4. Education Score (100 Max)
        edu_score = 0
        if education:
            edu_score = 80
            for edu in education:
                if edu.get("institution") and edu.get("degree"):
                    edu_score = 100
                    break
        else:
            edu_score = 30
            missing_info.append("Education history is missing.")

        # 5. Skills Score & Detected Keywords (100 Max)
        skills_score = 0
        detected_skills = []
        for s in TECH_SKILLS + SOFT_SKILLS:
            pattern = r'\b' + re.escape(s) + r'\b'
            if re.search(pattern, text_lower):
                detected_skills.append(s.title())

        # Combine with listed skills
        all_unique_skills = sorted(list(set(detected_skills + [s.title() for s in skills_list])))
        if len(all_unique_skills) >= 12:
            skills_score = 95
        elif len(all_unique_skills) >= 8:
            skills_score = 85
        elif len(all_unique_skills) >= 4:
            skills_score = 70
        else:
            skills_score = 45
            suggestions.append("Add at least 8-12 industry-standard technical and soft skills to improve ATS keyword matches.")

        # Projects / Certifications Bonus
        proj_score = 0
        if projects or certifications:
            proj_score = 90
        else:
            suggestions.append("Include 2-3 key technical projects or industry certifications to stand out from other candidates.")

        # Overall Weighted Score
        overall_score = int(
            (contact_score * 0.15) +
            (summary_score * 0.15) +
            (exp_score * 0.35) +
            (skills_score * 0.25) +
            (edu_score * 0.10)
        )
        overall_score = min(98, max(20, overall_score))

        # ATS Rating label
        if overall_score >= 85:
            ats_compatibility = "Excellent"
        elif overall_score >= 70:
            ats_compatibility = "Good"
        elif overall_score >= 50:
            ats_compatibility = "Moderate"
        else:
            ats_compatibility = "Needs Improvement"

        # Keywords list with presence status
        core_keywords_to_check = [
            "Python", "JavaScript", "SQL", "React", "Docker", "Git", "API",
            "Agile", "CI/CD", "Testing", "Performance", "Security"
        ]
        keyword_stats = []
        for kw in core_keywords_to_check:
            found = bool(re.search(r'\b' + re.escape(kw.lower()) + r'\b', text_lower))
            keyword_stats.append({
                "keyword": kw,
                "found": found,
                "category": "Core Tech"
            })

        # Formatting checks
        if len(raw_text) > 8000:
            formatting_issues.append("Resume exceeds 2 standard pages in length. Trim to 1-2 pages for optimal ATS scanning.")
        if not re.search(r'\b(20\d{2}|19\d{2})\b', raw_text):
            formatting_issues.append("No dates (years) identified. Always clearly state employment and degree timeframes.")

        return {
            "overall_score": overall_score,
            "ats_compatibility": ats_compatibility,
            "section_scores": {
                "Contact Info": contact_score,
                "Summary": summary_score,
                "Experience": exp_score,
                "Skills": skills_score,
                "Education": edu_score
            },
            "detected_skills": all_unique_skills[:20],
            "missing_skills": [kw for kw in ["Docker", "CI/CD", "Cloud (AWS/GCP)", "TypeScript", "Unit Testing"] if kw.lower() not in text_lower][:5],
            "keywords": keyword_stats,
            "formatting_issues": formatting_issues,
            "missing_information": missing_info,
            "suggestions": suggestions or ["Your resume has great structure! Keep your numbers and project descriptions up to date."]
        }

