import io
from xml.sax.saxutils import escape
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.units import inch

class PDFService:
    @classmethod
    def generate_resume_pdf(cls, resume_data: Dict[str, Any], template_name: str = "ats_friendly") -> bytes:
        """Generate high-quality ATS-friendly PDF using ReportLab."""
        buffer = io.BytesIO()
        template_name = (template_name or "ats_friendly").lower()

        # Page margins
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.5 * inch,
            leftMargin=0.5 * inch,
            topMargin=0.5 * inch,
            bottomMargin=0.5 * inch
        )

        styles = getSampleStyleSheet()

        # Color schemes based on template
        if "modern" in template_name:
            primary_color = colors.HexColor("#1e3a8a")  # Deep blue
            secondary_color = colors.HexColor("#3b82f6")
            text_color = colors.HexColor("#1f2937")
            header_font = "Helvetica-Bold"
            body_font = "Helvetica"
        elif "minimal" in template_name:
            primary_color = colors.HexColor("#27272a")  # Slate gray
            secondary_color = colors.HexColor("#52525b")
            text_color = colors.HexColor("#18181b")
            header_font = "Times-Bold"
            body_font = "Times-Roman"
        else:  # ats_friendly
            primary_color = colors.HexColor("#111827")  # Clean Black/Charcoal
            secondary_color = colors.HexColor("#374151")
            text_color = colors.HexColor("#1f2937")
            header_font = "Helvetica-Bold"
            body_font = "Helvetica"

        # Custom Paragraph Styles
        name_style = ParagraphStyle(
            'CandidateName',
            fontName=header_font,
            fontSize=20 if "modern" in template_name else 18,
            leading=24,
            textColor=primary_color,
            alignment=1 if "minimal" in template_name else 0
        )

        title_style = ParagraphStyle(
            'CandidateTitle',
            fontName=header_font,
            fontSize=11,
            leading=14,
            textColor=secondary_color,
            alignment=1 if "minimal" in template_name else 0
        )

        contact_style = ParagraphStyle(
            'ContactInfo',
            fontName=body_font,
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#4b5563"),
            alignment=1 if "minimal" in template_name else 0
        )

        section_heading_style = ParagraphStyle(
            'SectionHeading',
            fontName=header_font,
            fontSize=11,
            leading=14,
            textColor=primary_color,
            spaceBefore=8,
            spaceAfter=3,
            keepWithNext=True
        )

        item_title_style = ParagraphStyle(
            'ItemTitle',
            fontName=header_font,
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#111827")
        )

        item_subtitle_style = ParagraphStyle(
            'ItemSubtitle',
            fontName=body_font,
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#4b5563")
        )

        body_style = ParagraphStyle(
            'BodyContent',
            fontName=body_font,
            fontSize=9,
            leading=12.5,
            textColor=text_color
        )

        bullet_style = ParagraphStyle(
            'BulletPoint',
            fontName=body_font,
            fontSize=9,
            leading=12,
            textColor=text_color,
            leftIndent=14,
            firstLineIndent=-10
        )

        story = []

        personal_info = resume_data.get("personal_info", {})
        full_name = personal_info.get("fullName") or "Your Name"
        job_title = personal_info.get("jobTitle") or resume_data.get("target_role") or ""
        
        # 1. Header
        story.append(Paragraph(full_name, name_style))
        if job_title:
            story.append(Spacer(1, 2))
            story.append(Paragraph(job_title, title_style))

        # Contact line
        contact_items = []
        if personal_info.get("email"):
            contact_items.append(personal_info["email"])
        if personal_info.get("phone"):
            contact_items.append(personal_info["phone"])
        if personal_info.get("location"):
            contact_items.append(personal_info["location"])
        if personal_info.get("linkedin"):
            contact_items.append(personal_info["linkedin"].replace("https://www.", "").replace("https://", ""))
        if personal_info.get("github"):
            contact_items.append(personal_info["github"].replace("https://", ""))
        if personal_info.get("portfolio") or personal_info.get("website"):
            url = personal_info.get("portfolio") or personal_info.get("website")
            contact_items.append(url.replace("https://", ""))

        if contact_items:
            story.append(Spacer(1, 4))
            story.append(Paragraph(" • ".join(contact_items), contact_style))

        story.append(Spacer(1, 6))
        story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceBefore=2, spaceAfter=6))

        # Helper for adding section title
        def add_section_header(title: str):
            story.append(Paragraph(title.upper(), section_heading_style))
            if "ats" in template_name:
                story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#9ca3af"), spaceBefore=1, spaceAfter=4))
            else:
                story.append(Spacer(1, 3))

        # 2. Professional Summary
        summary = resume_data.get("summary", "")
        if summary and summary.strip():
            add_section_header("Professional Summary")
            story.append(Paragraph(summary.strip(), body_style))
            story.append(Spacer(1, 6))

        # 3. Work Experience
        experience = resume_data.get("experience", [])
        if experience:
            add_section_header("Work Experience")
            for exp in experience:
                role = exp.get("role", "")
                company = exp.get("company", "")
                start_date = exp.get("startDate", "")
                end_date = "Present" if exp.get("current") else exp.get("endDate", "")
                loc = exp.get("location", "")

                header_left = f"<b>{role}</b>" + (f" | {company}" if company else "")
                header_right = f"{start_date} – {end_date}" + (f" | {loc}" if loc else "")

                # Table for 2-column header (Role left, Date right)
                header_table = Table(
                    [[Paragraph(header_left, item_title_style), Paragraph(header_right, ParagraphStyle('RightAligned', parent=item_subtitle_style, alignment=2))]],
                    colWidths=[5.0 * inch, 2.5 * inch]
                )
                header_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                    ('TOPPADDING', (0, 0), (-1, -1), 2),
                ]))
                story.append(header_table)

                # Bullets
                for bullet in exp.get("bullets", []):
                    if bullet.strip():
                        story.append(Paragraph(f"• {bullet.strip()}", bullet_style))
                story.append(Spacer(1, 5))

        # Internship Experience
        internships = resume_data.get("internships", [])
        if internships:
            add_section_header("Internship Experience")
            for item in internships:
                role = item.get("role", "")
                company = item.get("company", "")
                dates = f"{item.get('startDate', '')} – {item.get('endDate', '')}".strip(" –")
                location = item.get("location", "")
                left = f"<b>{role}</b>" + (f" | {company}" if company else "")
                right = dates + (f" | {location}" if location else "")
                item_table = Table(
                    [[Paragraph(left, item_title_style), Paragraph(right, ParagraphStyle('InternshipRight', parent=item_subtitle_style, alignment=2))]],
                    colWidths=[5.0 * inch, 2.5 * inch]
                )
                item_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                    ('TOPPADDING', (0, 0), (-1, -1), 2),
                ]))
                story.append(item_table)
                for bullet in item.get("bullets", []):
                    if bullet and bullet.strip():
                        story.append(Paragraph(f"• {bullet.strip()}", bullet_style))
                story.append(Spacer(1, 5))

        # 4. Projects
        projects = resume_data.get("projects", [])
        if projects:
            add_section_header("Projects")
            for prj in projects:
                title = prj.get("title", "")
                techs = ", ".join(prj.get("technologies", [])) if isinstance(prj.get("technologies"), list) else ""
                link = prj.get("link") or prj.get("github") or ""

                left_title = f"<b>{title}</b>" + (f" ({techs})" if techs else "")
                safe_link = escape(link, {'"': '&quot;'})
                link_label = escape(link.replace("https://", "").replace("http://", ""))
                right_link = f'<link href="{safe_link}" color="#4f46e5"><u>{link_label}</u></link>' if link else ""

                prj_table = Table(
                    [[Paragraph(left_title, item_title_style), Paragraph(right_link, ParagraphStyle('LinkRight', parent=item_subtitle_style, alignment=2))]],
                    colWidths=[5.2 * inch, 2.3 * inch]
                )
                prj_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                    ('TOPPADDING', (0, 0), (-1, -1), 2),
                ]))
                story.append(prj_table)

                for bullet in prj.get("bullets", []):
                    if bullet.strip():
                        story.append(Paragraph(f"• {bullet.strip()}", bullet_style))
                story.append(Spacer(1, 4))

        # 5. Education
        education = resume_data.get("education", [])
        if education:
            add_section_header("Education")
            for edu in education:
                degree = edu.get("degree", "")
                field = edu.get("fieldOfStudy", "")
                inst = edu.get("institution", "")
                dates = f"{edu.get('startDate', '')} – {edu.get('endDate', '')}".strip(" –")
                gpa = f"GPA: {edu.get('gpa')}" if edu.get("gpa") else ""

                deg_str = f"<b>{degree}</b>" + (f" in {field}" if field else "") + (f", {inst}" if inst else "")
                date_gpa = dates + (f" | {gpa}" if gpa else "")

                edu_table = Table(
                    [[Paragraph(deg_str, item_title_style), Paragraph(date_gpa, ParagraphStyle('EduRight', parent=item_subtitle_style, alignment=2))]],
                    colWidths=[5.2 * inch, 2.3 * inch]
                )
                edu_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                    ('TOPPADDING', (0, 0), (-1, -1), 2),
                ]))
                story.append(edu_table)
                if edu.get("description"):
                    story.append(Paragraph(edu["description"], body_style))
                story.append(Spacer(1, 4))

        # 6. Skills
        skills_data = resume_data.get("skills", {})
        if skills_data:
            add_section_header("Technical & Professional Skills")
            if isinstance(skills_data, dict):
                for cat, items in skills_data.items():
                    if items and isinstance(items, list):
                        line = f"<b>{cat.capitalize()}:</b> {', '.join(str(i) for i in items)}"
                        story.append(Paragraph(line, body_style))
                        story.append(Spacer(1, 2))
            elif isinstance(skills_data, list):
                line = f"<b>Skills:</b> {', '.join(str(i) for i in skills_data)}"
                story.append(Paragraph(line, body_style))
            story.append(Spacer(1, 4))

        # 7. Certifications & Achievements
        certs = resume_data.get("certifications", [])
        achievements = resume_data.get("achievements", [])
        if certs or achievements:
            add_section_header("Certifications & Achievements")
            for c in certs:
                c_str = f"• <b>{c.get('name', '')}</b>" + (f" – {c.get('issuer', '')}" if c.get("issuer") else "") + (f" ({c.get('issueDate', '')})" if c.get("issueDate") else "")
                credential_url = c.get("credentialUrl", "")
                if credential_url:
                    safe_url = escape(credential_url, {'"': '&quot;'})
                    c_str += f' — <link href="{safe_url}" color="blue">Verify certificate</link>'
                story.append(Paragraph(c_str, bullet_style))
            for a in achievements:
                a_str = f"• <b>{a.get('title', '')}</b>: {a.get('description', '')}"
                story.append(Paragraph(a_str, bullet_style))

        interests = resume_data.get("interests", [])
        if interests:
            add_section_header("Interests")
            story.append(Paragraph(escape(", ".join(str(item) for item in interests)), body_style))

        # Build document
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
