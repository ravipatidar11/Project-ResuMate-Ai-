import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { atsAPI } from '../api/ats';
import { jobMatchAPI } from '../api/jobMatch';
import { useToast } from '../context/ToastContext';
import ScoreMeter from '../components/common/ScoreMeter';
import Modal from '../components/common/Modal';
import {
  History,
  Sparkles,
  Briefcase,
  Trash2,
  Calendar,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function AnalysisHistoryPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('ats'); // 'ats' | 'job_matches'
  const [atsHistory, setAtsHistory] = useState([]);
  const [jobHistory, setJobHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [atsRes, jobRes] = await Promise.all([
        atsAPI.getHistory(),
        jobMatchAPI.getHistory()
      ]);
      setAtsHistory(atsRes.data || []);
      setJobHistory(jobRes.data || []);
    } catch {
      addToast('Failed to load history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteAts = async (id) => {
    if (!window.confirm('Delete this ATS analysis report?')) return;
    try {
      await atsAPI.deleteAnalysis(id);
      setAtsHistory((prev) => prev.filter((a) => a.id !== id));
      addToast('Record deleted', 'info');
    } catch {
      addToast('Failed to delete report', 'error');
    }
  };

  const handleDeleteJobMatch = async (id) => {
    if (!window.confirm('Delete this job match record?')) return;
    try {
      await jobMatchAPI.deleteMatch(id);
      setJobHistory((prev) => prev.filter((j) => j.id !== id));
      addToast('Record deleted', 'info');
    } catch {
      addToast('Failed to delete match', 'error');
    }
  };

  const openAtsDetail = async (id) => {
    try {
      const res = await atsAPI.getAnalysisDetail(id);
      setDetailData({ type: 'ats', ...res.data });
      setDetailModalOpen(true);
    } catch {
      addToast('Failed to load report details', 'error');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-6 py-8 sm:px-9 sm:py-10 text-white shadow-lg shadow-indigo-200/60">
        <div className="absolute -right-12 -top-24 h-72 w-72 rounded-full border-[36px] border-white/10" />
        <div className="absolute right-36 -bottom-32 h-64 w-64 rounded-full bg-violet-400/20 blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-50">
              <History className="h-3.5 w-3.5" /> YOUR WORKSPACE
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analysis history</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
              Pick up where you left off. Your resume scans and job matches, all in one place.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="min-w-28 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">{atsHistory.length}</p><p className="mt-0.5 text-xs text-indigo-100">Resume scans</p>
            </div>
            <div className="min-w-28 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">{jobHistory.length}</p><p className="mt-0.5 text-xs text-indigo-100">Job matches</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab('ats')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'ats'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Resume scans</span><span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === 'ats' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{atsHistory.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('job_matches')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'job_matches'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Job matches</span><span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === 'job_matches' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{jobHistory.length}</span>
        </button>
        </div>
        <button onClick={fetchHistory} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* List Container */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading history records...</p>
        </div>
      ) : activeTab === 'ats' ? (
        atsHistory.length === 0 ? (
          <div className="p-12 sm:p-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Sparkles className="h-7 w-7" /></div>
            <h2 className="text-base font-bold text-slate-900">No resume scans yet</h2><p className="mt-1 text-sm text-slate-500">Run an ATS scan to see your results and track your progress here.</p>
            <Link to="/analyzer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"><Sparkles className="h-4 w-4" /> Open ATS Analyzer</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {atsHistory.map((item) => (
              <div
                key={item.id}
                className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/70 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.overall_score >= 80
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.ats_compatibility}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-3 truncate group-hover:text-indigo-700 transition-colors">
                    {item.file_name || 'Resume Scan'}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{item.overall_score}%</span>
                    <span className="text-xs text-slate-400 font-semibold">Score</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openAtsDetail(item.id)}
                      className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAts(item.id)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : jobHistory.length === 0 ? (
        <div className="p-12 sm:p-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><Briefcase className="h-7 w-7" /></div>
          <h2 className="text-base font-bold text-slate-900">No job matches yet</h2><p className="mt-1 text-sm text-slate-500">Compare your resume with a job description to see how well you fit.</p>
          <Link to="/job-matcher" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"><Briefcase className="h-4 w-4" /> Open Job Matcher</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobHistory.map((item) => (
            <div
              key={item.id}
              className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/70 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">
                    {item.ai_report?.job_match_status === 'insufficient_requirements'
                      ? 'Insufficient data'
                      : item.ai_report?.job_match_fallback || item.ai_report?.provider === 'Built-in Resume Analysis'
                        ? `Keyword estimate · ${item.match_percentage}%`
                        : `${item.match_percentage}% Match`}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-3 group-hover:text-indigo-700 transition-colors">{item.job_title}</h3>
                <p className="text-xs text-slate-500">{item.job_company || 'Target Company'}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">
                  {item.matching_skills?.length || 0} skills aligned
                </span>
                <button
                  onClick={() => handleDeleteJobMatch(item.id)}
                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="ATS Report Details"
        maxWidth="max-w-2xl"
      >
        {detailData && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="font-bold text-slate-900 text-sm">{detailData.file_name}</p>
                <p className="text-slate-500">{new Date(detailData.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">{detailData.overall_score}%</span>
                <p className="text-[10px] font-bold text-indigo-600">{detailData.ats_compatibility}</p>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-800 uppercase mb-1">Detected Skills:</p>
              <div className="flex flex-wrap gap-1">
                {(detailData.detected_skills || []).map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {detailData.suggestions && (
              <div>
                <p className="font-bold text-slate-800 uppercase mb-1">Suggestions:</p>
                <ul className="space-y-1 list-disc list-inside text-slate-700">
                  {detailData.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {detailData.ai_report && (
              <section className="space-y-3 border-t border-slate-200 pt-4">
                <div><h3 className="font-bold text-slate-900">Resume review · {detailData.ai_report.model}</h3><p className="mt-1 text-slate-600">{detailData.ai_report.overall_score?.score}/100 — {detailData.ai_report.overall_score?.explanation}</p></div>
                <div className="grid gap-2 sm:grid-cols-2">{Object.entries(detailData.ai_report.scores || {}).map(([key, value]) => <div key={key} className="rounded-lg bg-slate-50 p-2.5"><div className="flex justify-between gap-2 font-bold capitalize text-slate-800"><span>{key.replaceAll('_', ' ')}</span><span>{value.score}/100</span></div><p className="mt-1 text-slate-600">{value.explanation}</p></div>)}</div>
                {(detailData.ai_report.weaknesses || []).map((item, index) => <div key={index} className="rounded-lg border border-amber-100 bg-amber-50/50 p-3"><p className="font-bold text-slate-800">{item.section}{item.current ? ` · “${item.current}”` : ''}</p><p className="mt-1 text-slate-600">{item.problem}</p>{item.suggested_version && <p className="mt-2 rounded bg-white p-2 text-indigo-800">{item.suggested_version}</p>}</div>)}
              </section>
            )}
          </div>
        )}
      </Modal>
      </div>
    </div>
  );
}
