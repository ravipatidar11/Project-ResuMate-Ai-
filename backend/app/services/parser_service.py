import os
import re
import uuid
from typing import Dict, Any, List, Tuple
from pypdf import PdfReader
from docx import Document
from app.config import settings

# Comprehensive skills dictionary for automated skill tagging
TECH_SKILLS = [
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "golang", "go", "rust", "php", "ruby", "swift", "kotlin", "scala", "r", "dart", "html", "html5", "css", "css3", "sql", "nosql", "bash", "shell",
    # Frameworks & Libraries
    "react", "react.js", "next.js", "vue", "vue.js", "angular", "svelte", "fastapi", "flask", "django", "express", "node.js", "nodejs", "spring", "spring boot", "asp.net", "laravel", "rails", "tailwind", "tailwindcss", "bootstrap", "material ui", "redux", "graphql", "rest api", "restful api",
    # Data & AI
    "machine learning", "deep learning", "nlp", "llm", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "opencv", "langchain", "huggingface", "data analysis", "data visualization", "tableau", "power bi",
    # Cloud & DevOps
    "docker", "kubernetes", "aws", "azure", "gcp", "google cloud", "ci/cd", "github actions", "gitlab", "jenkins", "terraform", "ansible", "linux", "nginx", "apache", "microservices", "serverless",
    # Databases
    "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb", "supabase", "firebase", "prisma", "sqlalchemy",
    # Tools & Concepts
    "git", "github", "gitlab", "jira", "confluence", "agile", "scrum", "tdd", "system design", "object oriented programming", "oop", "clean code", "unit testing", "cybersecurity", "jwt", "oauth"
]

SOFT_SKILLS = [
    "leadership", "teamwork", "communication", "problem solving", "critical thinking", "time management", "adaptability", "project management", "collaboration", "mentorship", "public speaking", "negotiation", "conflict resolution", "creativity"
]

class ParserService:
    @staticmethod
    def detect_resume_skills(raw_text: str) -> Dict[str, List[str]]:
        """Extract only skills explicitly present in source text (no placeholder defaults)."""
        source = (raw_text or "").lower()

        def present(skill: str) -> bool:
            # Non-alphanumeric boundaries handle terms such as C++, C#, and .NET.
            pattern = r"(?<![a-z0-9])" + re.escape(skill.lower()) + r"(?![a-z0-9])"
            return re.search(pattern, source) is not None

        def display(skill: str) -> str:
            aliases = {"aws": "AWS", "gcp": "GCP", "nlp": "NLP", "llm": "LLM", "sql": "SQL", "api": "API", "c++": "C++", "c#": "C#"}
            return aliases.get(skill.lower(), skill.title())

        return {
            "technical": list(dict.fromkeys(display(skill) for skill in TECH_SKILLS if present(skill))),
            "soft": list(dict.fromkeys(display(skill) for skill in SOFT_SKILLS if present(skill))),
        }

    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """Extract clean text from a PDF file using pypdf."""
        text_lines = []
        try:
            reader = PdfReader(file_path)
            for page in reader.pages:
                # Layout mode keeps visual reading order and line breaks. The
                # default extractor can split headings (e.g. EDUCA TION) and
                # merge multi-column resumes into the wrong section.
                try:
                    page_text = page.extract_text(extraction_mode="layout")
                except TypeError:
                    page_text = page.extract_text()
                if page_text:
                    text_lines.append(page_text)
            return "\n".join(text_lines)
        except Exception as e:
            raise ValueError(f"Failed to read PDF file: {str(e)}")

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        """Extract clean text from a DOCX file using python-docx."""
        try:
            doc = Document(file_path)
            lines = []
            for p in doc.paragraphs:
                if p.text.strip():
                    lines.append(p.text.strip())
            for table in doc.tables:
                for row in table.rows:
                    row_data = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_data:
                        lines.append(" | ".join(row_data))
            return "\n".join(lines)
        except Exception as e:
            raise ValueError(f"Failed to read DOCX file: {str(e)}")

    @classmethod
    def parse_file(cls, file_path: str) -> str:
        """Extract raw text from PDF or DOCX file."""
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            return cls.extract_text_from_pdf(file_path)
        elif ext == ".docx":
            return cls.extract_text_from_docx(file_path)
        else:
            raise ValueError("Unsupported file format. Please upload PDF or DOCX.")

    @classmethod
    def extract_structured_data(cls, raw_text: str) -> Dict[str, Any]:
        """Extract editable resume content without filling gaps with invented details."""
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', raw_text)
        phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', raw_text)
        linkedin_match = re.search(r'(https?://)?(www\.)?linkedin\.com/in/[\w-]+', raw_text, re.IGNORECASE)
        github_match = re.search(r'(https?://)?(www\.)?github\.com/[\w-]+', raw_text, re.IGNORECASE)
        portfolio_match = re.search(r'(https?://)?(www\.)?[a-zA-Z0-9-]+\.(io|dev|me|com|org)(/[\w-]+)?', raw_text, re.IGNORECASE)
        portfolio = portfolio_match.group(0) if portfolio_match and "linkedin" not in portfolio_match.group(0).lower() and "github" not in portfolio_match.group(0).lower() else ""

        section_names = {
            "summary": {"SUMMARY", "PROFESSIONAL SUMMARY", "PROFILE", "ABOUT ME", "OBJECTIVE"},
            "skills": {"SKILLS", "TECHNICAL SKILLS", "CORE SKILLS", "KEY SKILLS"},
            "experience": {"EXPERIENCE", "WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE", "EMPLOYMENT HISTORY", "CAREER HISTORY"},
            "internships": {"INTERNSHIP", "INTERNSHIPS", "INTERNSHIP EXPERIENCE"},
            "projects": {"PROJECTS", "PERSONAL PROJECTS", "KEY PROJECTS"},
            "education": {"EDUCATION", "ACADEMIC BACKGROUND", "DEGREES"},
            "certifications": {"CERTIFICATIONS", "CERTIFICATES", "LICENSES"},
            "achievements": {"ACHIEVEMENTS", "AWARDS", "HONORS"},
            "languages": {"LANGUAGES"},
            "interests": {"INTERESTS", "HOBBIES", "PERSONAL INTERESTS"},
        }
        heading_lookup = {
            re.sub(r"[^A-Z]", "", heading.upper()): section
            for section, headings in section_names.items()
            for heading in headings
        }
        sections = {name: [] for name in section_names}
        preamble = []
        current_section = None

        for line in lines:
            # Resume PDFs often introduce spaces inside headings when the
            # source uses letter spacing or columns (e.g. "EDUCA TION").
            heading = re.sub(r"[^A-Z]", "", line.upper())
            section = heading_lookup.get(heading)
            if section:
                current_section = section
                continue
            if current_section:
                sections[current_section].append(line)
            else:
                preamble.append(line)

        # Keep a readable source summary when the document has no recognizable
        # headings, rather than silently dropping the imported text.
        summary_lines = sections["summary"] or (preamble[1:] if not any(sections.values()) else [])
        summary = " ".join(summary_lines)
        if not summary and not any(sections.values()):
            summary = " ".join(preamble)

        display_names = {"aws": "AWS", "gcp": "GCP", "nlp": "NLP", "llm": "LLM", "sql": "SQL", "api": "API", "c++": "C++", "c#": "C#"}
        skill_text = " ".join(sections["skills"])
        detected_technical = [display_names.get(skill, skill.title()) for skill in TECH_SKILLS if re.search(r"(?<![a-z0-9])" + re.escape(skill) + r"(?![a-z0-9])", skill_text.lower())]
        detected_soft = [skill.title() for skill in SOFT_SKILLS if re.search(r"(?<![a-z0-9])" + re.escape(skill) + r"(?![a-z0-9])", skill_text.lower())]
        extra_technical, extra_soft, extra_tools = [], [], []
        for line in sections["skills"]:
            cleaned = line.lstrip("â€¢?*- ").strip()
            category, separator, values = cleaned.partition(":")
            target = extra_soft if "soft" in category.lower() else extra_tools if any(word in category.lower() for word in ("tool", "platform")) else extra_technical
            if not separator:
                values = cleaned
            target.extend(part.strip(" ?-*\t") for part in re.split(r"[,;|?]", values) if part.strip(" ?-*\t"))
        technical = list(dict.fromkeys(detected_technical + extra_technical))
        soft = list(dict.fromkeys(detected_soft + extra_soft))
        tools = list(dict.fromkeys(extra_tools))

        def section_item(section: str, kind: str) -> list:
            content = [line.lstrip("?-* ").strip() for line in sections[section] if line.strip()]
            if not content:
                return []
            item = {"id": str(uuid.uuid4())[:8]}
            if kind == "experience":
                item.update({"company": "", "role": "", "location": "", "startDate": "", "endDate": "", "current": False, "bullets": content})
            elif kind == "education":
                item.update({"institution": content[0], "degree": content[1] if len(content) > 1 else "", "fieldOfStudy": "", "startDate": "", "endDate": "", "gpa": "", "description": "\n".join(content[2:])})
            elif kind == "project":
                item.update({"title": content[0], "subtitle": "", "link": "", "github": "", "technologies": [], "bullets": content[1:]})
            elif kind == "certification":
                item.update({"name": content[0], "issuer": "", "issueDate": "", "credentialUrl": ""})
            elif kind == "achievement":
                item.update({"title": content[0], "description": "\n".join(content[1:]), "date": ""})
            else:
                item.update({"language": content[0], "proficiency": ""})
            return [item]

        def experience_items(section: str) -> list:
            content = [re.sub(r"\s+", " ", line).strip() for line in sections[section] if line.strip()]
            dated_role = re.compile(r"(?:19|20)\d{2}.*(?:19|20)\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(?:19|20)\d{2}", re.IGNORECASE)
            starts = [i for i, line in enumerate(content) if dated_role.search(line)]
            if len(starts) < 2:
                return section_item(section, "experience")
            items = []
            for position, start in enumerate(starts):
                end = starts[position + 1] if position + 1 < len(starts) else len(content)
                block = content[start:end]
                header = re.sub(r"\s+", " ", block[0]).strip(" â€¢-*\t")
                date_match = re.search(r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(?:19|20)\d{2}\s*[â€“â€”-]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(?:19|20)\d{2}|(?:19|20)\d{2}\s*[â€“â€”-]\s*(?:Present|Current)", header, re.IGNORECASE)
                dates = date_match.group(0) if date_match else ""
                role = header.replace(dates, "") if dates else header
                role = re.sub(r"\s*[â€¢|,-]?\s*Internship\s*$", "", role, flags=re.IGNORECASE).strip(" â€¢-|â€“")
                following = [line.strip() for line in block[1:]]
                company = following.pop(0) if following and not following[0].lstrip().startswith(("â€¢", "-", "â€“")) and not re.match(r"^(built|deployed|created|worked|configured|applied|used|managed|developed|led|implemented)\b", following[0], re.IGNORECASE) else ""
                bullets = []
                for line in following:
                    is_bullet = line.lstrip().startswith(("â€¢", "-", "â€“"))
                    clean = line.lstrip("â€¢*- ").strip()
                    if not clean:
                        continue
                    if is_bullet:
                        bullets.append(clean)
                    elif bullets:
                        bullets[-1] += " " + clean
                    else:
                        bullets.append(clean)
                start_date, end_date = "", ""
                if dates:
                    month_dates = re.findall(r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:19|20)\d{2}", dates, re.IGNORECASE)
                    year_values = re.findall(r"(?:19|20)\d{2}", dates)
                    start_date = re.sub(r"\s+", " ", month_dates[0]).strip() if month_dates else (year_values[0] if year_values else "")
                    end_date = re.sub(r"\s+", " ", month_dates[-1]).strip() if len(month_dates) > 1 else (year_values[-1] if len(year_values) > 1 else ("Present" if "present" in dates.lower() or "current" in dates.lower() else ""))
                items.append({"id": str(uuid.uuid4())[:8], "company": company, "role": role, "location": "", "startDate": start_date, "endDate": end_date, "current": end_date.lower() in {"present", "current"}, "bullets": bullets})
            return items

        def education_items() -> list:
            content = [re.sub(r"\s+", " ", line.lstrip("â€¢?*- ")).strip() for line in sections["education"] if line.strip()]
            if not content:
                return []
            degree_pattern = re.compile(
                r"\b(bachelor|master|associate|doctor|ph\.?d|b\.? ?tech|m\.? ?tech|b\.? ?sc|m\.? ?sc|higher secondary|senior secondary|secondary education|diploma|class\s*(?:x|xii|10|12))\b",
                re.IGNORECASE,
            )
            entries = []
            index = 0
            while index < len(content):
                line = content[index]
                if degree_pattern.search(line):
                    degree_line = re.sub(r"^[â€¢?*-]+\s*", "", line).strip()
                    institution_line = content[index + 1] if index + 1 < len(content) and not degree_pattern.search(content[index + 1]) else ""
                    index += 2 if institution_line else 1
                elif index + 1 < len(content) and degree_pattern.search(content[index + 1]):
                    # Also support resumes that list the institution first.
                    institution_line, degree_line = line, content[index + 1]
                    index += 2
                else:
                    # Keep unfamiliar education text instead of dropping it.
                    if not entries:
                        entries.append({"id": str(uuid.uuid4())[:8], "institution": "", "degree": "", "fieldOfStudy": "", "startDate": "", "endDate": "", "gpa": "", "description": line})
                    else:
                        entries[-1]["description"] = "\n".join(filter(None, [entries[-1].get("description", ""), line]))
                    index += 1
                    continue

                years = re.findall(r"\b(?:19|20)\d{2}\b", degree_line)
                degree = re.sub(r"\s{2,}.*$", "", degree_line).strip()
                if years:
                    degree = re.sub(r"\b(?:19|20)\d{2}\b(?:\s*[â€“â€”-]\s*(?:\b(?:19|20)\d{2}\b|present))?", "", degree, flags=re.IGNORECASE).strip(" -â€“â€”")
                field = ""
                field_match = re.search(r"\(([^)]*)\)", degree)
                if field_match:
                    field = field_match.group(1).strip()
                    degree = (degree[:field_match.start()] + degree[field_match.end():]).strip(" -â€“â€”")
                gpa = ""
                if institution_line:
                    score = re.search(r"(?:CGPA|GPA|percentage)?\s*[:â€”-]?\s*(\d+(?:\.\d+)?\s*%?)", institution_line, re.IGNORECASE)
                    if score and re.search(r"CGPA|GPA|%", institution_line, re.IGNORECASE):
                        gpa = score.group(1).strip()
                        institution_line = (institution_line[:score.start()] + institution_line[score.end():]).strip(" â€”-:")
                    # Remove the trailing location after a common dash when it
                    # is present, keeping the school name intact.
                    institution = re.split(r"\s+[|]\s+", institution_line, maxsplit=1)[0].strip()
                else:
                    institution = ""
                entries.append({
                    "id": str(uuid.uuid4())[:8], "institution": institution,
                    "degree": degree, "fieldOfStudy": field,
                    "startDate": years[0] if years else "",
                    "endDate": years[-1] if len(years) > 1 else "",
                    "gpa": gpa, "description": "",
                })
            return entries

        name = next((line for line in preamble[:5] if len(line) < 60 and not re.search(r"@|https?://|www\.|\d{5,}", line, re.IGNORECASE)), "")
        return {
            "personal_info": {
                "fullName": name,
                "email": email_match.group(0) if email_match else "",
                "phone": phone_match.group(0) if phone_match else "",
                "location": "",
                "jobTitle": "",
                "website": portfolio,
                "linkedin": linkedin_match.group(0) if linkedin_match else "",
                "github": github_match.group(0) if github_match else "",
                "portfolio": portfolio,
            },
            "summary": summary,
            "skills": {"technical": technical, "soft": soft, "tools": tools},
            "education": education_items(),
            "experience": experience_items("experience"),
            "internships": experience_items("internships"),
            "projects": section_item("projects", "project"),
            "certifications": section_item("certifications", "certification"),
            "achievements": section_item("achievements", "achievement"),
            "languages": section_item("languages", "language"),
            "interests": [part.strip(" â€¢-*\t") for line in sections["interests"] for part in re.split(r"[|,;]", line) if part.strip(" â€¢-*\t")],
        }

