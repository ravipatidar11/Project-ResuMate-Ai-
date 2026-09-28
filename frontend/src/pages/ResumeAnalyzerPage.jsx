import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI } from '../api/upload';
import { atsAPI } from '../api/ats';
import { aiAPI } from '../api/ai';
import { resumesAPI } from '../api/resumes';
import { useToast } from '../context/ToastContext';
import ScoreMeter from '../components/common/ScoreMeter';
import {
  Upload,
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ResumeAnalyzerPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeMode, setActiveMode] = useState('upload'); // 'upload' | 'select' | 'paste'
  const [file, setFile] = useState(null);
  const resumeFileInputRef = useRef(null);
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [rawText, setRawText] = useState('');
  const [userResumes, setUserResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [createdResumeId, setCreatedResumeId] = useState(null);

  useEffect(() => {
    const fetchUserResumes = async () => {
      try {
        const res = await resumesAPI.getAll();
        setUserResumes(res.data || []);
      } catch {
        // ignore
      }
    };
    fetchUserResumes();
    aiAPI.getStatus().then((res) => setOllamaStatus(res.data)).catch(() => setOllamaStatus({ available: false, message: 'Could not reach the local AI status service.' }));
  }, []);

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      addToast('Please upload a .pdf or .docx file', 'error');
      return;
    }
    setFile(f);
    setAnalysisResult(null);
  };

  const handleAnalyzeUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      addToast('Please select a file to upload', 'warning');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_role', targetRole);
      formData.append('job_description', jobDescription);
      formData.append('auto_create_resume', 'true');

      const res = await uploadAPI.uploadAndParse(formData);
      setAnalysisResult(res.data.analysis);
      setCreatedResumeId(res.data.resume_id);
      addToast('Resume parsed and analyzed successfully!', 'success');
      if (res.data.analysis.overall_score >= 80) {
        confetti({ particleCount: 70, spread: 60 });
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to parse resume document';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeSavedResume = async () => {
    if (!selectedResumeId) {
      addToast('Please select a resume', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await atsAPI.analyzeResume(selectedResumeId, jobDescription);
      setAnalysisResult(res.data);
      setCreatedResumeId(selectedResumeId);
      addToast('Analysis complete!', 'success');
      if (res.data.overall_score >= 80) {
        confetti({ particleCount: 70, spread: 60 });
      }
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to analyze selected resume', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeText = async () => {
    if (!rawText.trim()) {
      addToast('Please paste resume text', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await atsAPI.analyzeText({ text: rawText, target_role: targetRole, job_description: jobDescription });
      setAnalysisResult(res.data);
      addToast('Analysis complete!', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to analyze pasted text', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          ATS Resume Analyzer
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Get a context-aware review from your local Ollama model, with evidence-based improvements and optional job matching.
        </p>
        {ollamaStatus && <div className={`mt-3 inline-flex max-w-full flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs ${ollamaStatus.available ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><span className={`h-2 w-2 rounded-full ${ollamaStatus.available ? 'bg-emerald-500' : 'bg-amber-500'}`} /><span className="font-bold">{ollamaStatus.available ? `Local AI ready · ${ollamaStatus.active_model}` : 'Local AI model unavailable'}</span><span>{ollamaStatus.message}</span></div>}
      </div>

      {/* Input Selection Tabs */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
          <button
            onClick={() => {
              setActiveMode('upload');
              resumeFileInputRef.current?.click();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'upload'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload File (PDF/DOCX)</span>
          </button>
          {userResumes.length > 0 && (
            <button
              onClick={() => setActiveMode('select')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeMode === 'select'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Select Saved Resume ({userResumes.length})</span>
            </button>
          )}
          <button
            onClick={() => setActiveMode('paste')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'paste'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Paste Resume Text</span>
          </button>
        </div>

        <input
          ref={resumeFileInputRef}
          id="resume-file-input"
          type="file"
          accept=".pdf,.docx"
          className="sr-only"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) validateAndSetFile(selectedFile);
            e.target.value = '';
          }}
        />

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
          <label htmlFor="analysis-job-description" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700">Job Description <span className="font-medium normal-case tracking-normal text-slate-400">(optional, for contextual matching)</span></label>
          <textarea
            id="analysis-job-description"
            rows={4}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description to get semantic skill, experience, project, and keyword matching..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs leading-relaxed focus:ring-2 focus:ring-indigo-200"
          />
          <p className="mt-1 text-[11px] text-slate-500">The local AI compares meaning and related experience, not just exact keyword matches.</p>
        </div>

        {/* MODE 1: Upload File */}
        {activeMode === 'upload' && (
          <form onSubmit={handleAnalyzeUpload} className="space-y-4">
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 transition-colors hover:border-indigo-500 hover:bg-indigo-50/20"
            >
              <label htmlFor="resume-file-input" className="block cursor-pointer p-8 text-center sm:p-12 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-inset">
                <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Upload className="h-7 w-7" />
                </span>
                <span className="block text-sm font-bold text-slate-900">
                  {file ? file.name : 'Choose a PDF/DOCX or drag it here'}
                </span>
                <span className="mt-1 block text-xs text-slate-500">Click here to browse · PDF and DOCX up to 10MB</span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Optional Target Role (e.g. Senior Software Engineer)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="submit"
                disabled={loading || !file}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? 'Analyzing...' : 'Scan & Analyze'}</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: Select Saved Resume */}
        {activeMode === 'select' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Choose one of your saved resumes:
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="">-- Choose a Resume --</option>
                {userResumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.target_role || 'General'})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAnalyzeSavedResume}
              disabled={loading || !selectedResumeId}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{loading ? 'Analyzing...' : 'Analyze Resume'}</span>
            </button>
          </div>
        )}

        {/* MODE 3: Paste Text */}
        {activeMode === 'paste' && (
          <div className="space-y-4">
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your raw resume text here..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono leading-relaxed"
            />
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Optional Target Role (e.g. Full Stack Engineer)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
              <button
                onClick={handleAnalyzeText}
                disabled={loading || !rawText.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? 'Analyzing...' : 'Analyze Text'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ANALYSIS RESULTS DASHBOARD */}
      {analysisResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Top Score Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Circular Gauge */}
            <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0">
              <ScoreMeter
                score={analysisResult.overall_score}
                size={160}
                strokeWidth={12}
                label="Overall Score"
              />
              <span className="text-xs font-bold text-slate-500 mt-2">
                AI ATS Compatibility: {analysisResult.ats_compatibility} ({analysisResult.section_scores?.ATS ?? '—'}/100)
              </span>
            </div>

            {/* Section Breakdown Progress Bars */}
            <div className="md:col-span-8 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Section Score Breakdown</h3>
                {createdResumeId && (
                  <button
                    onClick={() => navigate(`/builder/${createdResumeId}`)}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <span>Edit Uploaded Resume</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {Object.entries(analysisResult.section_scores || {}).filter(([sec]) => ['Summary', 'Skills', 'Experience', 'Projects', 'ATS'].includes(sec)).map(([sec, val]) => (
                <div key={sec} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{sec}</span>
                    <span>{val}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        val >= 80 ? 'bg-emerald-500' : val >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                  {analysisResult.ai_report?.scores?.[sec.toLowerCase().replaceAll(' ', '_')]?.explanation && (
                    <p className="text-[11px] leading-relaxed text-slate-500">{analysisResult.ai_report.scores[sec.toLowerCase().replaceAll(' ', '_')].explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {analysisResult.authorship_estimate && (
            <section className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-white p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"><ShieldCheck className="h-5 w-5" /></div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">AI vs Human Resume Estimate</h3>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">Estimate · {analysisResult.authorship_estimate.confidence} confidence</span>
                    </div>
                    <p className="mt-1 text-lg font-extrabold text-indigo-800">{analysisResult.authorship_estimate.label}</p>
                    <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600">This is a rough estimate based on writing patterns, not proof of who wrote the resume. AI and human writing can look alike, so don’t use this result alone to judge a candidate.</p>
                  </div>
                </div>
                {analysisResult.authorship_estimate.ai_pattern_score !== null && (
                  <div className="flex shrink-0 items-center gap-3 rounded-xl border border-white bg-white/80 px-4 py-2.5 sm:flex-col sm:gap-0 sm:text-center">
                    <span className="text-2xl font-extrabold text-indigo-700">{analysisResult.authorship_estimate.ai_pattern_score}<span className="text-sm text-slate-400">/100</span></span>
                    <span className="text-[11px] font-medium text-slate-500">AI-style signals</span>
                  </div>
                )}
              </div>
              <ul className="mt-4 grid gap-2 border-t border-indigo-100 pt-4 sm:grid-cols-2">
                {analysisResult.authorship_estimate.indicators.map((indicator, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />{indicator}</li>
                ))}
              </ul>
            </section>
          )}

          {analysisResult.ai_report && (
            <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div><h2 className="text-lg font-extrabold text-slate-900">AI Resume Review</h2><p className="mt-1 text-xs text-slate-500">Reasoned by {analysisResult.ai_report.provider} · {analysisResult.ai_report.model}{analysisResult.ai_report.job_description_used ? ' · Job description included' : ''}</p></div>
                <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">Overall: {analysisResult.ai_report.overall_score.score}/100</span>
              </div>
              <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">{analysisResult.ai_report.overall_score.explanation}</p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(analysisResult.ai_report.scores || {}).map(([key, item]) => (
                  <div key={key} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-bold capitalize text-slate-800">{key.replaceAll('_', ' ')}</h3><span className="text-sm font-extrabold text-indigo-700">{item.score}/100</span></div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">{item.explanation}</p>
                  </div>
                ))}
              </div>

              {analysisResult.ai_report.strengths?.length > 0 && <div><h3 className="text-sm font-bold text-slate-900">What is working well</h3><ul className="mt-2 grid gap-2 sm:grid-cols-2">{analysisResult.ai_report.strengths.map((item, index) => <li key={index} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-900">{item}</li>)}</ul></div>}

              <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <div><h3 className="text-xs font-bold text-slate-900">AI ATS review</h3><p className="mt-1 text-xs leading-relaxed text-slate-600">{analysisResult.ai_report.scores.ats.explanation}</p>{analysisResult.ai_report.ats_details?.reasons?.map((item, index) => <p key={index} className="mt-1 text-[11px] text-slate-500">• {item}</p>)}</div>
                <div><h3 className="text-xs font-bold text-slate-900">Parsing concerns & next steps</h3>{[...(analysisResult.ai_report.ats_details?.issues || []), ...(analysisResult.ai_report.ats_details?.recommended_changes || [])].map((item, index) => <p key={index} className="mt-1 text-[11px] leading-relaxed text-slate-600">• {item}</p>)}</div>
              </div>

              {analysisResult.ai_report.weaknesses?.length > 0 && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-bold text-slate-900">Evidence-based improvements</h3>
                  {analysisResult.ai_report.weaknesses.map((item, index) => (
                    <article key={index} className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 text-xs">
                      <p className="font-bold text-slate-900">{item.section || 'Resume'}{item.current ? ` · “${item.current}”` : ''}</p>
                      <p className="mt-1 text-slate-700"><span className="font-semibold">Why improve:</span> {item.problem}</p>
                      <p className="mt-1 text-slate-700"><span className="font-semibold">How:</span> {item.improvement}</p>
                      {item.suggested_version && <p className="mt-2 rounded-lg border border-white bg-white p-3 leading-relaxed text-indigo-900"><span className="font-semibold">Suggested version:</span> {item.suggested_version}</p>}
                    </article>
                  ))}
                </div>
              )}

              {analysisResult.ai_report.job_match && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">Job Description Match</h3><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-700">{analysisResult.ai_report.job_match.overall_score}/100</span></div>
                  <p className="text-xs leading-relaxed text-slate-600">{analysisResult.ai_report.job_match.explanation}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(analysisResult.ai_report.job_match.scores || {}).map(([key, item]) => <div key={key} className="rounded-lg bg-slate-50 p-3"><div className="flex justify-between gap-2 text-xs font-bold capitalize"><span>{key.replaceAll('_', ' ')}</span><span>{item.score}/100</span></div><p className="mt-1 text-[11px] text-slate-600">{item.explanation}</p></div>)}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[['Overlapping skills', analysisResult.ai_report.job_match.overlapping_skills], ['Important missing skills', analysisResult.ai_report.job_match.missing_skills], ['Irrelevant content', analysisResult.ai_report.job_match.irrelevant_content], ['Recommended changes', analysisResult.ai_report.job_match.recommended_changes]].map(([title, items]) => <div key={title}><h4 className="text-xs font-bold text-slate-800">{title}</h4><ul className="mt-1 list-inside list-disc space-y-1 text-[11px] text-slate-600">{(items || []).map((item, index) => <li key={index}>{item}</li>)}</ul></div>)}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 3 Detail Cards: Skills, Issues, Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Detected Skills */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Detected Skills ({analysisResult.detected_skills?.length || 0})</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {(analysisResult.detected_skills || []).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    {skill}
                  </span>
                ))}
                {!(analysisResult.detected_skills || []).length && (
                  <p className="text-xs leading-relaxed text-slate-500">No skills were detected in the extracted resume text. Check that the uploaded file contains selectable text.</p>
                )}
              </div>

              {analysisResult.missing_skills && analysisResult.missing_skills.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-rose-700 mb-1.5">Missing Core Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.missing_skills.map((ms, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                      >
                        + {ms}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Formatting & Missing Info */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Formatting & Alerts</h3>
              </div>

              <div className="space-y-3 text-xs">
                {analysisResult.formatting_issues && analysisResult.formatting_issues.length > 0 ? (
                  <div>
                    <p className="font-bold text-amber-900 mb-1">Formatting Observations:</p>
                    <ul className="space-y-1 text-slate-700 list-disc list-inside">
                      {analysisResult.formatting_issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> No critical formatting errors found!
                  </p>
                )}

                {analysisResult.missing_information && analysisResult.missing_information.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="font-bold text-rose-700 mb-1">Missing Elements:</p>
                    <ul className="space-y-1 text-slate-700 list-disc list-inside">
                      {analysisResult.missing_information.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Actionable Suggestions */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">AI Recommendations</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {(analysisResult.suggestions || []).map((sug, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{sug}</span>
                  </li>
                ))}
                {!(analysisResult.suggestions || []).length && (
                  <li className="text-xs leading-relaxed text-slate-500">No urgent changes were identified. Review the section score explanations and detailed feedback above.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
