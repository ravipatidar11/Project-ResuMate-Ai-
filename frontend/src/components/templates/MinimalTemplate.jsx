import React from 'react';
import { Globe } from 'lucide-react';


function LinkedInMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0"><rect width="24" height="24" rx="3" fill="#0A66C2" /><path fill="#fff" d="M6.5 9h2.8v9H6.5zm1.4-4.2a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2M11 9h2.7v1.2h.1a3 3 0 0 1 2.7-1.5c2.9 0 3.4 1.9 3.4 4.3V18h-2.8v-4.4c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.4V18H11z" /></svg>;
}

function GitHubMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor"><path d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.6.1.8-.3.8-.6v-2.1c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.8 2.3 3.6 1.7.1-.7.4-1.2.7-1.5-2.5-.3-5.1-1.3-5.1-5.5 0-1.2.4-2.1 1.1-2.9-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 1.1a10.4 10.4 0 0 1 5.5 0c2.1-1.4 3-1.1 3-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.7 1.1 2.9 0 4.2-2.6 5.2-5.1 5.5.4.3.8 1 .8 2v3c0 .3.2.7.8.6A11.1 11.1 0 0 0 12 .9" /></svg>;
}

export default function MinimalTemplate({ data }) {
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
      className="w-full bg-white text-zinc-900 p-8 sm:p-14 shadow-lg rounded-none max-w-[850px] mx-auto text-[13px] leading-relaxed font-serif"
    >
      {/* Centered Minimal Header */}
      <div className="text-center pb-6 border-b border-zinc-300">
        <h1 className="text-3xl font-normal tracking-wide text-zinc-950 font-serif">
          {personal_info.fullName || 'Candidate Name'}
        </h1>
        {personal_info.jobTitle && (
          <p className="text-xs uppercase tracking-widest text-zinc-600 mt-1 font-sans">
            {personal_info.jobTitle}
          </p>
        )}

        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-xs text-zinc-600 mt-3 font-sans">
          {personal_info.location && <span>{personal_info.location}</span>}
          {personal_info.phone && <span>• {personal_info.phone}</span>}
          {personal_info.email && <span>• {personal_info.email}</span>}
          {personal_info.linkedin && <a href={personal_info.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn profile" title="LinkedIn" className="inline-flex items-center gap-1"><LinkedInMark /><span>{personal_info.fullName || 'LinkedIn'}</span></a>}
          {personal_info.github && <a href={personal_info.github} target="_blank" rel="noreferrer" aria-label="GitHub profile" title="GitHub" className="inline-flex items-center gap-1"><GitHubMark /><span>{personal_info.github.split(/[?#]/)[0].replace(/\/+$/, '').split('/').pop() || 'GitHub'}</span></a>}
          {personal_info.portfolio && <a href={personal_info.portfolio} target="_blank" rel="noreferrer" aria-label="Portfolio" title="Portfolio" className="inline-flex items-center gap-1"><Globe className="h-4 w-4 shrink-0" /><span>Portfolio</span></a>}
        </div>
      </div>

      <div className="space-y-6 pt-6 font-sans">
        {/* Summary */}
        {summary && (
          <div>
            <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-950 mb-2 border-b border-zinc-200 pb-1">
              Profile
            </h2>
            <p className="text-zinc-700 leading-relaxed text-[13px]">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-950 mb-3 border-b border-zinc-200 pb-1">
              Experience
            </h2>
            <div className="space-y-4">
              {experience.map((item, idx) => (
                <div key={item.id || idx}>
                  <div className="flex justify-between items-baseline text-[13px]">
                    <span className="font-semibold text-zinc-900">
                      {item.role} {item.company && <span className="font-normal text-zinc-600">— {item.company}</span>}
                    </span>
                    <span className="text-xs text-zinc-500 italic">
                      {item.startDate} – {item.current ? 'Present' : item.endDate}
                    </span>
                  </div>
                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="mt-1 space-y-1 list-disc list-outside ml-4 text-[12.5px] text-zinc-700">
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

        {internships.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-950 mb-3 border-b border-zinc-200 pb-1">Internship Experience</h2>
            <div className="space-y-3">{internships.map((item, idx) => <div key={item.id || idx}>
              <div className="flex justify-between items-baseline text-[13px]"><span className="font-semibold text-zinc-900">{item.role} {item.company && <span className="font-normal text-zinc-600">— {item.company}</span>}</span><span className="text-xs text-zinc-500 italic">{item.startDate} – {item.endDate}</span></div>
              {item.location && <p className="text-xs text-zinc-500">{item.location}</p>}
              {item.bullets?.length > 0 && <ul className="mt-1 space-y-1 list-disc list-outside ml-4 text-[12.5px] text-zinc-700">{item.bullets.map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul>}
            </div>)}</div>
          </div>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-950 mb-3 border-b border-zinc-200 pb-1">
              Projects
            </h2>
            <div className="space-y-3">
              {projects.map((prj, idx) => (
                <div key={prj.id || idx}>
                  <div className="flex justify-between items-baseline text-[13px]">
                    <span className="font-semibold text-zinc-900">
                      {prj.title}
                      {prj.technologies && (
                        <span className="text-xs font-normal text-zinc-500 ml-2">
                          [{Array.isArray(prj.technologies) ? prj.technologies.join(', ') : prj.technologies}]
                        </span>
                      )}
                    </span>
                    {(prj.link || prj.github) && (
                      <a href={prj.link || prj.github} target="_blank" rel="noreferrer" className="text-xs text-zinc-600 underline">
                        {(prj.link || prj.github).replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                  {prj.bullets && (
                    <ul className="mt-1 space-y-0.5 list-disc list-outside ml-4 text-[12.5px] text-zinc-700">
                      {prj.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
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
          <div>
            <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-950 mb-2 border-b border-zinc-200 pb-1">
              Education
            </h2>
            <div className="space-y-2">
              {education.map((edu, idx) => (
                <div key={edu.id || idx} className="flex justify-between items-baseline text-[13px]">
                  <div>
                    <span className="font-semibold text-zinc-900">{edu.degree}</span>
                    <span className="text-zinc-600">, {edu.institution}</span>
                    {edu.fieldOfStudy && <span className="text-zinc-500 italic"> — {edu.fieldOfStudy}</span>}
                  </div>
                  <span className="text-xs text-zinc-500 italic">
                    {edu.startDate} – {edu.endDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills && (
          <div>
            <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-950 mb-2 border-b border-zinc-200 pb-1">
              Expertise
            </h2>
            <div className="text-[12.5px] text-zinc-700 space-y-1">
              {typeof skills === 'object' && !Array.isArray(skills) ? (
                Object.entries(skills).map(([category, items]) => {
                  if (!items || (Array.isArray(items) && items.length === 0)) return null;
                  return (
                    <p key={category}>
                      <span className="font-semibold text-zinc-900 capitalize">{category}: </span>
                      <span>{Array.isArray(items) ? items.join(', ') : items}</span>
                    </p>
                  );
                })
              ) : (
                <p>{Array.isArray(skills) ? skills.join(', ') : String(skills)}</p>
              )}
            </div>
          </div>
        )}
        {interests.length > 0 && <div><h2 className="mb-2 border-b border-zinc-200 pb-1 text-xs font-bold uppercase tracking-widest text-zinc-950">Interests</h2><p className="text-[12.5px] text-zinc-700">{interests.join(', ')}</p></div>}
      </div>
    </div>
  );
}
