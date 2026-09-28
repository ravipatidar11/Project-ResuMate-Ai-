import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  FileText,
  ShieldCheck,
  Zap,
  Target,
  Download,
  ArrowRight,
  CheckCircle,
  Cpu,
  Lock,
  Layers,
  BarChart3,
  Award
} from 'lucide-react';
import TemplateRenderer from '../components/templates/TemplateRenderer';

const SAMPLE_DEMO_DATA = {
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
  summary: "Accomplished Senior Full-Stack Engineer with 5+ years of experience architecting distributed cloud systems and high-throughput web applications. Expert in React, Python, and microservices architecture.",
  experience: [
    {
      company: "Zoho Corporation",
      role: "Lead Full-Stack Engineer",
      startDate: "2022",
      current: true,
      bullets: [
        "Architected scalable backend microservices handling 2M+ daily requests with 99.99% uptime.",
        "Reduced client-side bundle size by 40% using code splitting and lazy loading in React."
      ]
    }
  ],
  education: [
    {
      institution: "Indian Institute of Technology Madras",
      degree: "B.Tech in Computer Science and Engineering",
      startDate: "2017",
      endDate: "2021",
      gpa: "8.8/10"
    }
  ],
  skills: {
    technical: ["React", "FastAPI", "Python", "Docker", "PostgreSQL", "TypeScript", "CI/CD"],
    soft: ["Technical Leadership", "Agile/Scrum", "System Design"],
    tools: ["Git", "Linux", "VS Code"]
  },
  projects: [
    {
      title: "Real-time Telemetry Dashboard",
      technologies: ["React", "FastAPI", "PostgreSQL"],
      bullets: ["Engineered live observability suite tracking 50+ cluster health indicators."]
    }
  ]
};

export default function LandingPage() {
  const { isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [activeTemplate, setActiveTemplate] = useState('ats_friendly');
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleDemoClick = async () => {
    setLoadingDemo(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch {
      // handled in context
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Free Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-6 shadow-xs">
              <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
              <span>100% Free Forever · Zero Paid APIs · Local Privacy</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
              Build Resumes That Beat the <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">ATS Algorithms</span>
            </h1>

            <p className="mt-5 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              Create professional, ATS-compliant resumes from scratch or upload your existing document. Get deep AI diagnostics, tailored job description matching, and vector-clean PDF downloads at ₹0 cost.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
                >
                  <FileText className="w-5 h-5" />
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Create My Resume Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={handleDemoClick}
                    disabled={loadingDemo}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
                  >
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>{loadingDemo ? 'Launching Demo...' : '1-Click Instant Demo'}</span>
                  </button>
                </>
              )}
            </div>

            {/* Trust checklist */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-500" />
                <span>Local Ollama LLM Supported</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Download className="w-4 h-4 text-blue-500" />
                <span>ATS-Friendly PDF Export</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>100% Private Local Storage</span>
              </div>
            </div>
          </div>

          {/* Interactive Live Demo Preview Box */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-500 ml-2">Live Resume Preview Engine</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'ats_friendly', label: 'ATS Friendly' },
                  { id: 'modern_professional', label: 'Modern' },
                  { id: 'minimal_professional', label: 'Minimal' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTemplate(t.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeTemplate === t.id
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3 sm:p-6">
              <TemplateRenderer templateName={activeTemplate} data={SAMPLE_DEMO_DATA} />
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Complete SaaS Platform</h2>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">Everything You Need to Land Interviews</p>
          <p className="text-slate-600 mt-3 text-sm">
            Professional tools engineered to pass automated recruiter screeners and impress hiring managers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Interactive Resume Builder</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Create resumes from scratch with live split preview. Repeatable sections for experience, education, projects, certifications, and languages.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Deep ATS Score Diagnostics</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Upload PDF/DOCX resumes. Get instant overall ATS score (0-100), category diagnostics, formatting checks, and missing keyword alerts.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Job Description Matcher</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Paste any job posting. Instantly see match percentage, matching skills vs gaps, and generate tailored bullet points with 1 click.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">100% Free Local AI</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Runs with Ollama local LLM or built-in intelligent NLP rules. Zero paid API keys, zero subscriptions, complete data privacy.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action bar */}
      <section className="py-16 bg-gradient-to-tr from-slate-900 to-indigo-950 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Ready to Land Your Dream Job?</h2>
          <p className="mt-3 text-sm text-indigo-200 max-w-xl mx-auto">
            Join thousands of job seekers creating ATS-optimized, metric-driven resumes in minutes.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl font-bold text-indigo-950 bg-white hover:bg-indigo-50 shadow-lg transition-transform hover:scale-105"
            >
              Get Started for Free
            </Link>
            <button
              onClick={handleDemoClick}
              className="px-6 py-3.5 rounded-xl font-bold text-white bg-indigo-800 hover:bg-indigo-700 transition-colors border border-indigo-700"
            >
              Explore Demo Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <p>© 2026 ResuMate AI · AI Resume Builder & ATS Analyzer · 100% Free & Open Source</p>
      </footer>
    </div>
  );
}
