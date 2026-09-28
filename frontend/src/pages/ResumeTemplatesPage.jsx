import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resumesAPI } from '../api/resumes';
import { useToast } from '../context/ToastContext';
import TemplateRenderer from '../components/templates/TemplateRenderer';
import { Check, LayoutTemplate, ArrowRight, Sparkles, FileText } from 'lucide-react';

const SAMPLE_DATA = {
  personal_info: {
    fullName: "Aarav Sharma",
    jobTitle: "Senior Full-Stack Engineer",
    email: "aarav.sharma@example.in",
    phone: "+91 98765 43210",
    location: "Bengaluru, Karnataka, India",
    linkedin: "https://linkedin.com/in/aaravsharma",
    github: "https://github.com/aaravsharma",
    portfolio: "https://aaravsharma.dev"
  },
  summary: "Results-driven Senior Full-Stack Engineer with 6+ years of experience architecting high-traffic web applications, microservices, and reactive user interfaces. Proven track record of improving system uptime to 99.98% and cutting latency by 45%.",
  education: [
    {
      institution: "Indian Institute of Technology Madras",
      degree: "B.Tech in Computer Science and Engineering",
      fieldOfStudy: "Software Systems",
      startDate: "2016",
      endDate: "2020",
      gpa: "8.8 / 10"
    }
  ],
  experience: [
    {
      company: "Razorpay",
      role: "Lead Full-Stack Engineer",
      startDate: "2022",
      endDate: "Present",
      current: true,
      bullets: [
        "Architected scalable microservices with Python, FastAPI, and Docker processing 1.5M daily events with 99.98% reliability.",
        "Engineered responsive React and TypeScript dashboard, trimming initial load time by 42% through code-splitting."
      ]
    }
  ],
  projects: [
    {
      title: "UPI Insights Dashboard",
      technologies: ["React", "FastAPI", "Docker", "PostgreSQL"],
      bullets: ["Built real-time container health monitoring visualization system handling 20k+ concurrent metrics streams."]
    }
  ],
  skills: {
    technical: ["Python", "FastAPI", "React", "TypeScript", "SQL", "Docker", "PostgreSQL"],
    soft: ["Technical Leadership", "Agile/Scrum", "System Architecture"],
    tools: ["Git", "GitHub Actions", "VS Code", "Linux"]
  },
  certifications: [
    { name: "AWS Certified Solutions Architect Associate", issuer: "Amazon Web Services", issueDate: "2023" }
  ]
};

const TEMPLATES_LIST = [
  {
    id: 'ats_friendly',
    name: 'ATS Friendly',
    description: 'Single-column, high-contrast, strictly formatted for 100% parser compatibility across Naukri, LinkedIn, and major applicant tracking systems.',
    badge: 'Highest ATS Pass Rate',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    id: 'modern_professional',
    name: 'Modern Professional',
    description: 'Stylish header banner with crisp accent bars, tech stack badges, and modern typography for forward-thinking tech roles.',
    badge: 'Popular for Tech & SaaS',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  {
    id: 'minimal_professional',
    name: 'Minimal Professional',
    description: 'Classic serif typography, centered contact hierarchy, and executive whitespace balance ideal for leadership and consulting.',
    badge: 'Executive & Clean',
    badgeColor: 'bg-zinc-100 text-zinc-800 border-zinc-300'
  }
];

export default function ResumeTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('ats_friendly');
  const [userResumes, setUserResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [displayData, setDisplayData] = useState(SAMPLE_DATA);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await resumesAPI.getAll();
        setUserResumes(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedResumeId(res.data[0].id.toString());
          setDisplayData(res.data[0]);
        }
      } catch {
        // use default sample
      }
    };
    fetchResumes();
  }, []);

  const handleResumeChange = (e) => {
    const rId = e.target.value;
    setSelectedResumeId(rId);
    if (!rId) {
      setDisplayData(SAMPLE_DATA);
    } else {
      const match = userResumes.find((r) => r.id.toString() === rId);
      if (match) setDisplayData(match);
    }
  };

  const applyTemplateToResume = async () => {
    if (!selectedResumeId) {
      navigate('/builder');
      return;
    }
    try {
      const target = userResumes.find((r) => r.id.toString() === selectedResumeId);
      if (target) {
        await resumesAPI.update(target.id, { ...target, template_name: selectedTemplate });
        addToast(`Template applied to "${target.title}"!`, 'success');
        navigate(`/builder/${target.id}`);
      }
    } catch {
      addToast('Failed to update template', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Professional Resume Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose from 3 battle-tested, ATS-friendly designs. Switch seamlessly while preserving 100% of your resume data.
          </p>
        </div>

        {/* Data selector */}
        {userResumes.length > 0 && (
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-600">Preview with:</span>
            <select
              value={selectedResumeId}
              onChange={handleResumeChange}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
            >
              <option value="">Sample Candidate Data</option>
              {userResumes.map((r) => (
                <option key={r.id} value={r.id.toString()}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Template Cards Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TEMPLATES_LIST.map((tpl) => {
          const isSelected = selectedTemplate === tpl.id;
          return (
            <div
              key={tpl.id}
              onClick={() => setSelectedTemplate(tpl.id)}
              className={`cursor-pointer p-6 rounded-2xl bg-white border transition-all ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-md scale-[1.01]'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tpl.badgeColor}`}>
                  {tpl.badge}
                </span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-3">{tpl.name}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tpl.description}</p>
            </div>
          );
        })}
      </div>

      {/* Action Bar for Selected Template */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50 border border-indigo-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold text-indigo-950">
            Active Selection: {TEMPLATES_LIST.find((t) => t.id === selectedTemplate)?.name}
          </span>
        </div>
        <button
          onClick={applyTemplateToResume}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all hover:scale-105"
        >
          <span>Use This Template</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Full Live Rendering Showcase */}
      <div className="rounded-2xl border border-slate-200 bg-slate-100 p-6 sm:p-10 shadow-inner">
        <TemplateRenderer templateName={selectedTemplate} data={displayData} />
      </div>
    </div>
  );
}
