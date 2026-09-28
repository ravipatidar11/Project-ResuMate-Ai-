import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { resumesAPI } from '../api/resumes';
import { atsAPI } from '../api/ats';
import { jobMatchAPI } from '../api/jobMatch';
import { pdfAPI } from '../api/pdf';
import {
  FileText,
  Plus,
  Upload,
  Sparkles,
  Briefcase,
  Download,
  Copy,
  Trash2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import ScoreMeter from '../components/common/ScoreMeter';

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [jobMatches, setJobMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [resumesRes, analysesRes, matchesRes] = await Promise.all([
        resumesAPI.getAll(),
        atsAPI.getHistory(),
        jobMatchAPI.getHistory(),
      ]);
      setResumes(resumesRes.data || []);
      setAnalyses(analysesRes.data || []);
      setJobMatches(matchesRes.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDuplicate = async (id) => {
    try {
      await resumesAPI.duplicate(id);
      addToast('Resume duplicated successfully!', 'success');
      fetchDashboardData();
    } catch {
      addToast('Failed to duplicate resume', 'error');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await resumesAPI.delete(id);
      addToast('Resume deleted', 'info');
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      addToast('Failed to delete resume', 'error');
    }
  };

  const handleDownload = async (resume) => {
    try {
      addToast('Generating ATS-compliant PDF...', 'info');
      await pdfAPI.downloadPdf(resume.id, resume.template_name, `${resume.title.replace(/\s+/g, '_')}.pdf`);
      addToast('Download complete!', 'success');
    } catch (err) {
      addToast('Failed to download PDF', 'error');
    }
  };

  const latestAtsScore = analyses.length > 0 ? analyses[0].overall_score : 85;
  const latestAtsRating = analyses.length > 0 ? analyses[0].ats_compatibility : 'Good';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Overview Dashboard</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Hello, {user?.full_name || user?.email?.split('@')[0] || 'Candidate'}!
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Track your ATS scores, tailor resumes for specific job descriptions, and download ATS-friendly PDFs.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/builder"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-900/50 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Create Resume</span>
          </Link>
          <Link
            to="/analyzer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-800 bg-white hover:bg-slate-100 shadow-md transition-all hover:scale-105"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Upload & Analyze</span>
          </Link>
          <Link
            to="/job-matcher"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-indigo-200 bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 transition-all hover:scale-105"
          >
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>Match Job Description</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Resumes</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{resumes.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Ready for applications</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Latest ATS Score</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {latestAtsScore}%
            </p>
            <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {latestAtsRating} Compatibility
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Matches</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{jobMatches.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Targeted comparisons</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resume Suggestions</p>
            <p className="text-sm font-extrabold text-indigo-600 mt-1">100% Free</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Built-in analysis active</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Split: Resumes vs Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: My Resumes (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">My Resumes</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {resumes.length}
              </span>
            </div>
            <Link
              to="/builder"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Create New</span>
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-400">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-indigo-600" />
              <p className="text-sm font-medium">Loading your resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white border border-dashed border-slate-300 text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No resumes created yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Create a new resume from scratch with live preview, or upload your existing PDF/DOCX to get started.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link
                  to="/builder"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Create from Scratch
                </Link>
                <Link
                  to="/analyzer"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
                >
                  Upload Existing
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                        <Link to={`/builder/${resume.id}`}>{resume.title}</Link>
                      </h3>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {resume.template_name?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Target Role: <span className="font-semibold text-slate-700">{resume.target_role || 'General'}</span>
                      {' • '}
                      Updated {new Date(resume.updated_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      to={`/builder/${resume.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/preview/${resume.id}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Full Preview"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDownload(resume)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(resume.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id, resume.title)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Activity (1 Col wide) */}
        <div className="space-y-6">
          {/* Latest ATS Scan Widget */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Latest ATS Analysis</h3>
              <Link to="/history" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                View All
              </Link>
            </div>

            {analyses.length > 0 ? (
              <div className="flex flex-col items-center py-2">
                <ScoreMeter score={analyses[0].overall_score} size={130} label="Compatibility" />
                <p className="text-xs font-bold text-slate-800 mt-3 truncate max-w-full text-center">
                  {analyses[0].file_name}
                </p>
                <p className="text-[11px] text-slate-400">
                  Scanned {new Date(analyses[0].created_at).toLocaleDateString()}
                </p>
                <Link
                  to="/analyzer"
                  className="mt-4 w-full text-center py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Run New Scan
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500">No resumes analyzed yet</p>
                <Link
                  to="/analyzer"
                  className="mt-3 inline-block px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600"
                >
                  Upload & Analyze
                </Link>
              </div>
            )}
          </div>

          {/* Recent Job Matches */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recent Job Matches</h3>
              <Link to="/job-matcher" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                New Match
              </Link>
            </div>

            {jobMatches.length > 0 ? (
              <div className="space-y-3">
                {jobMatches.slice(0, 3).map((jm) => (
                  <div
                    key={jm.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{jm.job_title || 'Role Target'}</p>
                      <p className="text-[10px] text-slate-500">{jm.job_company || 'Target Company'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-100 text-indigo-800">
                      {jm.ai_report?.job_match_status === 'insufficient_requirements'
                        ? 'Insufficient data'
                        : jm.ai_report?.job_match_fallback || jm.ai_report?.provider === 'Built-in Resume Analysis'
                          ? `Keyword estimate · ${jm.match_percentage}%`
                          : `${jm.match_percentage}%`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500">No job matches run yet</p>
                <Link
                  to="/job-matcher"
                  className="mt-2 inline-block text-xs font-bold text-indigo-600 hover:underline"
                >
                  Match a job description →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
