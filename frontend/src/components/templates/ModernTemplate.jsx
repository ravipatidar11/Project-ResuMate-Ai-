import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink } from 'lucide-react';

export default function ModernTemplate({ data }) {
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
      className="w-full bg-white text-slate-900 shadow-xl rounded-xl max-w-[850px] mx-auto text-[13px] leading-relaxed font-sans overflow-hidden border border-slate-200"
    >
      {/* Top Stylish Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {personal_info.fullName || 'Candidate Name'}
            </h1>
            {personal_info.jobTitle && (
              <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                {personal_info.jobTitle}
              </span>
            )}
          </div>
          {/* Contact pill grid */}
          <div className="text-xs space-y-1 text-slate-300">
            {personal_info.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{personal_info.email}</span>
              </div>
            )}
            {personal_info.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{personal_info.phone}</span>
              </div>
            )}
            {personal_info.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{personal_info.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Links bar */}
        {(personal_info.linkedin || personal_info.github || personal_info.portfolio) && (
          <div className="flex flex-wrap gap-4 pt-3 mt-3 border-t border-indigo-900/60 text-xs text-indigo-200">
            {personal_info.linkedin && (
              <a href={personal_info.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                <Linkedin className="w-3.5 h-3.5" />
                <span>LinkedIn</span>
              </a>
            )}
            {personal_info.github && (
              <a href={personal_info.github} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
            )}
            {personal_info.portfolio && (
              <a href={personal_info.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                <Globe className="w-3.5 h-3.5" />
                <span>Portfolio</span>
              </a>
            )}
          </div>
        )}
      </div>

      <div className="p-8 space-y-5">
        {/* Summary */}
        {summary && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-4 rounded-xs bg-indigo-600"></div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                Professional Profile
              </h2>
            </div>
            <p className="text-slate-700 leading-normal pl-4 border-l border-slate-200">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-2 h-4 rounded-xs bg-indigo-600"></div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                Work Experience
              </h2>
            </div>
            <div className="space-y-4 pl-4 border-l border-slate-200">
              {experience.map((item, idx) => (
                <div key={item.id || idx} className="relative">
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span className="text-indigo-900 text-sm">
                      {item.role} {item.company && <span className="font-normal text-slate-600">at {item.company}</span>}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.startDate} – {item.current ? 'Present' : item.endDate}
                    </span>
                  </div>
                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="mt-1.5 space-y-1 text-slate-700 text-[12.5px]">
                      {item.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <span className="text-indigo-500 font-bold mt-0.5">•</span>
                          <span>{b}</span>
                        </li>
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
            <div className="flex items-center gap-2 mb-2.5"><div className="w-2 h-4 rounded-xs bg-indigo-600" /><h2 className="text-xs font-bold uppercase tracking-wider text-indigo-950">Internship Experience</h2></div>
            <div className="space-y-3 pl-4 border-l border-slate-200">{internships.map((item, idx) => <div key={item.id || idx}>
              <div className="flex justify-between items-baseline font-bold text-slate-900"><span className="text-indigo-900 text-sm">{item.role} {item.company && <span className="font-normal text-slate-600">at {item.company}</span>}</span><span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">{item.startDate} – {item.endDate}</span></div>
              {item.location && <p className="text-xs text-slate-500">{item.location}</p>}
              {item.bullets?.length > 0 && <ul className="mt-1 space-y-1 text-slate-700 text-[12.5px]">{item.bullets.map((bullet, bulletIndex) => <li key={bulletIndex} className="flex items-start gap-2"><span className="text-indigo-500">•</span><span>{bullet}</span></li>)}</ul>}
            </div>)}</div>
          </div>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-2 h-4 rounded-xs bg-indigo-600"></div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                Featured Projects
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 pl-4 border-l border-slate-200">
              {projects.map((prj, idx) => (
                <div key={prj.id || idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span className="text-slate-900">{prj.title}</span>
                    {(prj.link || prj.github) && (
                      <a href={prj.link || prj.github} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 flex items-center gap-1 hover:underline">
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {prj.technologies && prj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(Array.isArray(prj.technologies) ? prj.technologies : [prj.technologies]).map((t, tIdx) => (
                        <span key={tIdx} className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100/60 text-indigo-800 font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {prj.bullets && (
                    <ul className="mt-1.5 space-y-0.5 text-xs text-slate-700">
                      {prj.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-1.5">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2-Column bottom: Skills & Education */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l border-slate-200">
          {/* Skills */}
          {skills && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 mb-2">
                Skills & Tech Stack
              </h3>
              <div className="space-y-2">
                {typeof skills === 'object' && !Array.isArray(skills) ? (
                  Object.entries(skills).map(([cat, list]) => {
                    if (!list || (Array.isArray(list) && list.length === 0)) return null;
                    return (
                      <div key={cat}>
                        <p className="text-xs font-bold text-slate-800 capitalize">{cat}:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(Array.isArray(list) ? list : [list]).map((s, sIdx) => (
                            <span key={sIdx} className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(skills) ? skills : [skills]).map((s, sIdx) => (
                      <span key={sIdx} className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 mb-2">
                Education
              </h3>
              <div className="space-y-2.5">
                {education.map((edu, idx) => (
                  <div key={edu.id || idx}>
                    <p className="font-bold text-slate-900">{edu.degree}</p>
                    <p className="text-xs text-slate-600">{edu.fieldOfStudy ? `${edu.fieldOfStudy}, ` : ''}{edu.institution}</p>
                    <p className="text-[11px] text-indigo-700 font-semibold">{edu.startDate} – {edu.endDate} {edu.gpa && `• GPA: ${edu.gpa}`}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {interests.length > 0 && <div><h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-950">Interests</h2><p className="pl-4 text-[12.5px] text-slate-700">{interests.join(', ')}</p></div>}
      </div>
    </div>
  );
}
