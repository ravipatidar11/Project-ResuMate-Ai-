import re
import json
from typing import Dict, Any, List, Tuple
from app.services.parser_service import TECH_SKILLS, SOFT_SKILLS

class JobMatcher:
    @classmethod
    def match_resume_with_job(
        cls,
        resume_dict: Dict[str, Any],
        job_description: str,
        job_title: str = "",
        job_company: str = ""
    ) -> Dict[str, Any]:
        """Compare a resume against a target job description and return detailed match metrics."""
        jd_lower = job_description.lower()

        # 1. Extract skills from Job Description
        jd_tech_skills = []
        for s in TECH_SKILLS:
            pattern = r'\b' + re.escape(s) + r'\b'
            if re.search(pattern, jd_lower):
                jd_tech_skills.append(s.title())

        jd_soft_skills = []
        for s in SOFT_SKILLS:
            pattern = r'\b' + re.escape(s) + r'\b'
            if re.search(pattern, jd_lower):
                jd_soft_skills.append(s.title())

        all_jd_skills = list(dict.fromkeys(jd_tech_skills + jd_soft_skills))

        # 2. Extract Candidate Skills & Text
        skills_raw = resume_dict.get("skills", {})
        cand_skills = []
        if isinstance(skills_raw, dict):
            for v in skills_raw.values():
                if isinstance(v, list):
                    cand_skills.extend([str(item).lower() for item in v])
        elif isinstance(skills_raw, list):
            cand_skills.extend([str(item).lower() for item in skills_raw])

        # Also search raw resume content
        full_resume_text = json.dumps(resume_dict, ensure_ascii=False, default=str).lower()

        # 3. Categorize Matches
        matching_skills = []
        missing_skills = []

        for skill in all_jd_skills:
            skill_lower = skill.lower()
            skill_pattern = r"(?<![a-z0-9])" + re.escape(skill_lower) + r"(?![a-z0-9])"
            if skill_lower in cand_skills or re.search(skill_pattern, full_resume_text):
                matching_skills.append(skill)
            else:
                missing_skills.append(skill)

        # 4. Calculate Match Percentage
        total_jd_skills_count = len(all_jd_skills)
        matched_count = len(matching_skills)
        match_pct = round((matched_count / total_jd_skills_count) * 100) if total_jd_skills_count else None

        # 5. Extract Experience Years Requirement
        exp_match_pattern = re.search(r'(\d+)\+?\s*(?:-\s*(\d+))?\s*years?', jd_lower)
        required_years = "3-5"
        if exp_match_pattern:
            if exp_match_pattern.group(2):
                required_years = f"{exp_match_pattern.group(1)}-{exp_match_pattern.group(2)}"
            else:
                required_years = f"{exp_match_pattern.group(1)}+"

        exp_assessment = (
            f"Keyword overlap: {matched_count} of {total_jd_skills_count} recognized skills found."
            if total_jd_skills_count
            else "No recognized technical or soft-skill requirements were found in the job description."
        )

        # 6. Important Keywords Breakdown
        keywords_status = []
        for skill in all_jd_skills[:15]:
            keywords_status.append({
                "keyword": skill,
                "found": skill in matching_skills,
                "importance": "High" if skill in jd_tech_skills[:5] else "Medium"
            })

        # 7. Actionable Recommendations
        recommendations = []
        if not all_jd_skills:
            recommendations.append("Add specific technical or soft-skill requirements to the job description to calculate a keyword estimate.")
        else:
            if missing_skills:
                recommendations.append(f"Incorporate missing core skills: {', '.join(missing_skills[:5])} in your Skills or Experience section.")
            if job_title and job_title.lower() not in full_resume_text:
                recommendations.append(f"Update your resume headline or target title to match '{job_title}'.")
            recommendations.append("Mirror relevant terminology from the job description in your professional summary.")

        # 8. Tailored Bullet Suggestions & Optimized Summary
        optimized_bullets = []
        if missing_skills:
            top_miss = missing_skills[:3]
            optimized_bullets.append(
                f"Utilized {', '.join(top_miss)} to architect scalable application features and streamline core workflows."
            )
        if all_jd_skills:
            optimized_bullets.append(
                "Partnered with cross-functional teams to deliver software aligned with business requirements."
            )

        target_title = job_title or "Software Professional"
        suggested_summary = (
            f"Accomplished {target_title} with solid hands-on experience in {', '.join(matching_skills[:4]) or 'modern technologies'}. "
            f"Focused on applying relevant skills to the requirements of the role."
        )

        return {
            "match_percentage": match_pct,
            "matching_skills": matching_skills,
            "missing_skills": missing_skills,
            "keywords": keywords_status,
            "experience_match": {
                "required_years": required_years,
                "assessment": exp_assessment,
                "status": "Competitive" if match_pct is not None and match_pct >= 70 else "Fair"
            },
            "recommendations": recommendations,
            "optimized_suggestions": [
                {"title": "Tailored Summary", "content": suggested_summary},
                {"title": "Targeted Bullet 1", "content": optimized_bullets[0] if optimized_bullets else ""},
                {"title": "Targeted Bullet 2", "content": optimized_bullets[1] if len(optimized_bullets) > 1 else ""},
            ] if all_jd_skills else []
        }
