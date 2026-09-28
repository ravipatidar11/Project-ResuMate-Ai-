import React, { useState, useEffect } from 'react';
import { resumesAPI } from '../api/resumes';
import { jobMatchAPI } from '../api/jobMatch';
import { useToast } from '../context/ToastContext';
import ScoreMeter from '../components/common/ScoreMeter';
import Modal from '../components/common/Modal';
import {
  Briefcase,
  Sparkles,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Wand2,
  Copy,
  Check,
  RefreshCw,
  FileText,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function JobMatcherPage() {
  const { addToast } = useToast();

  const [userResumes, setUserResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  // Optimize Resume Modal
  const [optimizeModalOpen, setOptimizeModalOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedData, setOptimizedData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await resumesAPI.getAll();
        setUserResumes(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedResumeId(res.data[0].id.toString());
        }
      } catch {
        // ignore
      }
    };
    fetchResumes();
  }, []);

  const handleRunMatch = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      addToast('Please paste a job description', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await jobMatchAPI.matchJob({
        resume_id: selectedResumeId ? parseInt(selectedResumeId) : null,
        job_title: jobTitle,
        job_company: jobCompany,
        job_description: jobDescription
      });
      setMatchResult(res.data);
      addToast('Job match calculation complete!', 'success');
      if (res.data.match_percentage >= 75) {
        confetti({ particleCount: 70, spread: 60 });
      }
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to compare resume with job description', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeResume = async () => {
    setOptimizing(true);
    setOptimizeModalOpen(true);
    try {
      const res = await jobMatchAPI.optimizeResume({
        resume_id: selectedResumeId ? parseInt(selectedResumeId) : null,
        job_description: jobDescription
      });
      setOptimizedData(res.data);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to generate optimized suggestions', 'error');
      setOptimizeModalOpen(false);
    } finally {
      setOptimizing(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const insufficientMatch = matchResult?.ai_report?.job_match_status === 'insufficient_requirements';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Job Description Matcher & Tailor
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Paste a job posting to compare recognized skills, find keyword gaps, and review relevant existing resume bullets.
        </p>
      </div>

      {/* Input Form */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <form onSubmit={handleRunMatch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Resume
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                {userResumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.target_role || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Company (Optional)
              </label>
              <input
                type="text"
                value={jobCompany}
                onChange={(e) => setJobCompany(e.target.value)}
                placeholder="e.g. Razorpay, Infosys, Tata Consultancy Services"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Job Description Text
            </label>
            <textarea
              rows={8}
              required
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job requirements, responsibilities, and qualifications here..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono leading-relaxed"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !jobDescription.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 disabled:opacity-50 transition-all hover:scale-105"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{loading ? 'Comparing...' : 'Compare Resume with Job'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* MATCH RESULTS DASHBOARD */}
      {matchResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Score Meter */}
            <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0">
              {insufficientMatch ? (
                <div className="max-w-xs rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-xs text-amber-900">
                  <AlertCircle className="mx-auto mb-2 h-5 w-5" />
                  Add specific technical or soft-skill requirements to calculate a match estimate.
                </div>
              ) : <ScoreMeter score={matchResult.match_percentage} size={160} strokeWidth={12} label="Job Match" />}
              <span className="text-xs font-bold text-slate-500 mt-2">
                Target Role: {matchResult.job_title || 'Software Role'}
              </span>
            </div>

            {/* Quick Metrics & Optimize Trigger */}
            <div className="md:col-span-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {insufficientMatch ? 'Match estimate unavailable' : `Match Analysis: ${matchResult.match_percentage}% Alignment`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {matchResult.experience_match?.assessment
                      ? <span className="text-slate-600">{matchResult.experience_match.assessment}</span>
                      : <>Experience Level: <span className="font-bold text-slate-700">{matchResult.experience_match?.required_years} years ({matchResult.experience_match?.status})</span></>}
                  </p>
                </div>

                {/* Optimize Resume Button */}
                {!insufficientMatch && <button
                  onClick={handleOptimizeResume}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-200 transition-all hover:scale-105 shrink-0"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Review Job-Focused Suggestions</span>
                </button>}
              </div>

              {/* Skills matched vs missing bars */}
              {!insufficientMatch && <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Matching Skills ({matchResult.matching_skills?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(matchResult.matching_skills || []).map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-white text-emerald-800 text-[11px] font-semibold border border-emerald-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Missing Skills ({matchResult.missing_skills?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(matchResult.missing_skills || []).slice(0, 10).map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-white text-rose-800 text-[11px] font-semibold border border-rose-300">
                        + {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>}
            </div>
          </div>

          {insufficientMatch && (
            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
              The description needs specific skills or qualifications before a keyword estimate can be calculated.
            </section>
          )}

          {matchResult.ai_report?.job_match && (
            <section className="space-y-4 rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div><h2 className="text-lg font-extrabold text-slate-900">Job Keyword Match Estimate</h2><p className="mt-1 text-xs text-slate-500">Recognized keyword overlap only; semantic equivalence is not assessed.</p></div>
                <p className="max-w-2xl text-xs leading-relaxed text-slate-600">{matchResult.ai_report.job_match.explanation}</p>
              </div>
              {!matchResult.ai_report.job_match_fallback && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {Object.entries(matchResult.ai_report.job_match.scores || {}).map(([key, score]) => <div key={key} className="rounded-xl border border-slate-200 p-3"><div className="flex justify-between gap-2"><span className="text-xs font-bold capitalize text-slate-800">{key.replaceAll('_', ' ')}</span><span className="text-sm font-extrabold text-indigo-700">{score.score}</span></div><p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">{score.explanation}</p></div>)}
              </div>}
              <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
                {[['Important job skills', matchResult.ai_report.job_match.important_skills], ['Overlapping skills', matchResult.ai_report.job_match.overlapping_skills], ['Relevant gaps', matchResult.ai_report.job_match.missing_skills], ['Resume skills not found in posting', matchResult.ai_report.job_match.irrelevant_content], ['Recommended changes', matchResult.ai_report.job_match.recommended_changes]].map(([title, items]) => <div key={title}><h3 className="text-xs font-bold text-slate-800">{title}</h3><ul className="mt-1.5 list-inside list-disc space-y-1 text-xs leading-relaxed text-slate-600">{(items || []).map((item, idx) => <li key={idx}>{item}</li>)}</ul></div>)}
              </div>
            </section>
          )}

          {/* Keywords & Recommendations Grid */}
          {!insufficientMatch && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Keywords Analysis */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Important Keywords from Job Posting</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {(matchResult.keywords || []).map((kw, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{kw.keyword}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        kw.found
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {kw.found ? 'Found in Resume' : 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Recommended Resume Changes</h3>
              <ul className="space-y-3 text-xs text-slate-700">
                {(matchResult.recommendations || []).map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>}
        </div>
      )}

      {/* OPTIMIZE RESUME MODAL DRAWER */}
      <Modal
        isOpen={optimizeModalOpen}
        onClose={() => setOptimizeModalOpen(false)}
        title="Resume Suggestions for This Job"
        maxWidth="max-w-3xl"
      >
        {optimizing ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-800">Preparing job-focused resume suggestions...</p>
          </div>
        ) : optimizedData ? (
          <div className="space-y-5 text-xs text-slate-800">
            {/* Suggested Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 uppercase">Suggested Professional Summary:</span>
                <button
                  onClick={() => handleCopy(optimizedData.suggested_summary, 'summary')}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  {copiedKey === 'summary' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'summary' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                {optimizedData.suggested_summary}
              </p>
            </div>

            {/* Suggested Bullets */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 uppercase">Relevant Existing Resume Bullets:</span>
              <div className="space-y-2">
                {(optimizedData.suggested_bullet_points || []).map((b, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="leading-relaxed flex-1">• {b}</span>
                    <button
                      onClick={() => handleCopy(b, `bullet-${idx}`)}
                      className="p-1 text-slate-400 hover:text-indigo-600"
                    >
                      {copiedKey === `bullet-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Skills to Add */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 uppercase">Skills to Address (verify before adding):</span>
              <div className="flex flex-wrap gap-1.5">
                {(optimizedData.critical_skills_to_add || []).map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-800 text-xs font-semibold border border-indigo-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
