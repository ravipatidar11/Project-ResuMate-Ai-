import React from 'react';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';


function LinkedInMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0"><rect width="24" height="24" rx="3" fill="#0A66C2" /><path fill="#fff" d="M6.5 9h2.8v9H6.5zm1.4-4.2a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2M11 9h2.7v1.2h.1a3 3 0 0 1 2.7-1.5c2.9 0 3.4 1.9 3.4 4.3V18h-2.8v-4.4c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.4V18H11z" /></svg>;
}

function GitHubMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor"><path d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.6.1.8-.3.8-.6v-2.1c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.8 2.3 3.6 1.7.1-.7.4-1.2.7-1.5-2.5-.3-5.1-1.3-5.1-5.5 0-1.2.4-2.1 1.1-2.9-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 1.1a10.4 10.4 0 0 1 5.5 0c2.1-1.4 3-1.1 3-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.7 1.1 2.9 0 4.2-2.6 5.2-5.1 5.5.4.3.8 1 .8 2v3c0 .3.2.7.8.6A11.1 11.1 0 0 0 12 .9" /></svg>;
}

export default function AtsTemplate({ data }) {
  const {
    personal_info = {},
    summary = '',
    experience = [],
    internships = [],
    education = [],
    projects = [],
    skills = {},
    certifications = [],
    achievements = [],
    languages = [],
    interests = [],
  } = data || {};

  return (
    <div
      id="printable-resume"
      className="w-full bg-white text-slate-900 p-8 sm:p-12 shadow-md rounded-lg max-w-[850px] mx-auto text-[13px] leading-relaxed font-sans"
    >
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-3 text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-950">
          {personal_info.fullName || 'Candidate Name'}
        </h1>
        {personal_info.jobTitle && (
          <p className="text-sm font-semibold text-slate-700 mt-0.5 tracking-wide uppercase">
            {personal_info.jobTitle}
          </p>
        )}

        {/* Contact info list */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 mt-2 font-medium">
          {personal_info.email && <span>{personal_info.email}</span>}
          {personal_info.phone && <span>• {personal_info.phone}</span>}
          {personal_info.location && <span>• {personal_info.location}</span>}
          {personal_info.linkedin && <a href={personal_info.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn profile" title="LinkedIn" className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-700"><LinkedInMark /><span>{personal_info.fullName || 'LinkedIn'}</span></a>}
          {personal_info.github && <a href={personal_info.github} target="_blank" rel="noreferrer" aria-label="GitHub profile" title="GitHub" className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-950"><GitHubMark /><span>{personal_info.github.split(/[?#]/)[0].replace(/\/+$/, '').split('/').pop() || 'GitHub'}</span></a>}
          {personal_info.portfolio && <a href={personal_info.portfolio} target="_blank" rel="noreferrer" aria-label="Portfolio" title="Portfolio" className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-700"><Globe className="h-4 w-4 shrink-0" /><span>Portfolio</span></a>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-slate-800 text-[13px] leading-normal">{summary}</p>
        </div>
      )}

      {internships.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">Internship Experience</h2>
          <div className="space-y-3">{internships.map((item, idx) => <div key={item.id || idx}>
            <div className="flex justify-between items-baseline font-bold text-slate-900 text-[13px]"><span>{item.role}{item.company && <span className="font-semibold text-slate-700"> | {item.company}</span>}</span><span className="text-xs font-semibold text-slate-600">{item.startDate} – {item.endDate}</span></div>
            {(item.location || item.bullets?.length > 0) && <p className="text-xs text-slate-600">{item.location}</p>}
            {item.bullets?.length > 0 && <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-slate-800 text-[12.5px]">{item.bullets.map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul>}
          </div>)}</div>
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Work Experience
          </h2>
          <div className="space-y-3">
            {experience.map((item, idx) => (
              <div key={item.id || idx}>
                <div className="flex justify-between items-baseline font-bold text-slate-900 text-[13px]">
                  <span>
                    {item.role} {item.company && <span className="font-semibold text-slate-700">| {item.company}</span>}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 shrink-0">
                    {item.startDate} – {item.current ? 'Present' : item.endDate || 'Present'} {item.location && `(${item.location})`}
                  </span>
                </div>
                {item.bullets && item.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-slate-800 text-[12.5px]">
                    {item.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="leading-snug">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Key Projects
          </h2>
          <div className="space-y-2.5">
            {projects.map((prj, idx) => (
              <div key={prj.id || idx}>
                <div className="flex justify-between items-baseline font-bold text-slate-900 text-[13px]">
                  <span>
                    {prj.title}
                    {prj.technologies && prj.technologies.length > 0 && (
                      <span className="font-normal text-xs text-slate-600 ml-1.5">
                        ({Array.isArray(prj.technologies) ? prj.technologies.join(', ') : prj.technologies})
                      </span>
                    )}
                  </span>
                  {(prj.link || prj.github) && (
                    <a href={prj.link || prj.github} target="_blank" rel="noreferrer" className="text-xs font-normal text-indigo-600 underline">
                      {(prj.link || prj.github).replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
                {prj.bullets && prj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-slate-800 text-[12.5px]">
                    {prj.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="leading-snug">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu, idx) => (
              <div key={edu.id || idx} className="flex justify-between items-baseline text-[13px]">
                <div>
                  <span className="font-bold text-slate-900">
                    {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                  </span>
                  {edu.institution && (
                    <span className="text-slate-700">, {edu.institution}</span>
                  )}
                  {edu.gpa && <span className="text-xs text-slate-500 ml-2">GPA: {edu.gpa}</span>}
                </div>
                <span className="text-xs font-semibold text-slate-600 shrink-0">
                  {edu.startDate} – {edu.endDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills && (
        <div className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Skills & Competencies
          </h2>
          <div className="text-[12.5px] space-y-1 text-slate-800">
            {typeof skills === 'object' && !Array.isArray(skills) ? (
              Object.entries(skills).map(([category, items]) => {
                if (!items || (Array.isArray(items) && items.length === 0)) return null;
                return (
                  <div key={category} className="flex gap-1.5">
                    <span className="font-bold capitalize text-slate-900 min-w-[100px]">
                      {category}:
                    </span>
                    <span>{Array.isArray(items) ? items.join(', ') : items}</span>
                  </div>
                );
              })
            ) : (
              <div>
                <span className="font-bold text-slate-900">Core Skills: </span>
                <span>{Array.isArray(skills) ? skills.join(', ') : String(skills)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certifications & Achievements */}
      {((certifications && certifications.length > 0) || (achievements && achievements.length > 0)) && (
        <div className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Certifications & Honors
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-0.5 text-[12.5px] text-slate-800">
            {certifications.map((c, i) => (
              <li key={i}>
                <span className="font-semibold">{c.name}</span>
                {c.issuer && <span> — {c.issuer}</span>}
                {c.issueDate && <span className="text-slate-500"> ({c.issueDate})</span>}
                {c.credentialUrl && <> <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="text-indigo-700 underline">Credential</a></>}
              </li>
            ))}
            {achievements.map((a, i) => (
              <li key={i}>
                <span className="font-semibold">{a.title}</span>
                {a.description && <span>: {a.description}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {interests.length > 0 && <div className="mt-4"><h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">Interests</h2><p className="text-[12.5px] text-slate-800">{interests.join(', ')}</p></div>}
    </div>
  );
}
