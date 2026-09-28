import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, RefreshCw, Edit3, Download, History, FilePlus2, ArrowUpRight } from 'lucide-react';
import { uploadAPI } from '../api/upload';
import { resumesAPI } from '../api/resumes';
import { useToast } from '../context/ToastContext';

export default function EditResumePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const refreshResumes = async () => {
    setLoading(true);
    try {
      const response = await resumesAPI.getAll();
      setResumes((response.data || []).filter((resume) => resume.source_filename));
    } catch {
      addToast('Could not load your uploaded resumes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshResumes(); }, []);

  const selectFile = (candidate) => {
    if (!candidate) return;
    const extension = candidate.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx'].includes(extension)) {
      addToast('Choose a PDF or DOCX resume', 'error');
      return;
    }
    if (candidate.size > 10 * 1024 * 1024) {
      addToast('The resume must be smaller than 10 MB', 'error');
      return;
    }
    setFile(candidate);
  };

  const handleImport = async (event) => {
    event.preventDefault();
    if (!file) return;
    setImporting(true);
    try {
      const response = await uploadAPI.importResume(file);
      addToast('Resume imported. Your original file is kept unchanged.', 'success');
      const original = await resumesAPI.getById(response.data.resume_id);
      const editableVersion = await resumesAPI.createVersion(response.data.resume_id, original.data);
      navigate(`/builder/${editableVersion.data.id}`);
    } catch (error) {
      addToast(error.response?.data?.detail || 'Could not import this resume', 'error');
    } finally {
      setImporting(false);
    }
  };

  const downloadOriginal = async (resume) => {
    try {
      const response = await resumesAPI.getOriginalFile(resume.id);
      const url = URL.createObjectURL(new Blob([response.data]));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = resume.source_filename || 'original-resume';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      addToast('Original upload is no longer available', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <header className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/80 px-6 py-7 shadow-sm sm:px-9 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <FileText className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Edit your resume</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Bring your existing resume into ResumeMate. We’ll extract the content so you can refine it, preview your changes, and save a new version.</p>
          </div>
          <div className="relative flex shrink-0 items-center gap-2 self-start rounded-full border border-white bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm sm:self-center">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> PDF & DOCX supported
            <ArrowUpRight className="ml-1 h-3.5 w-3.5 text-indigo-500" />
          </div>
        </div>
      </header>

      <form onSubmit={handleImport} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <input ref={fileInput} type="file" accept=".pdf,.docx" className="sr-only" onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ''; }} />
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files?.[0]); }}
          className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30 sm:p-12"
        >
          <FilePlus2 className="mx-auto h-10 w-10 text-indigo-600" />
          <h2 className="mt-3 text-base font-bold text-slate-900">Import an existing resume</h2>
          <p className="mt-1 text-xs text-slate-500">PDF or DOCX, up to 10 MB. Text-based PDFs work best.</p>
          <button type="button" onClick={() => fileInput.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-50">
            <Upload className="h-4 w-4" /> Choose file
          </button>
          {file && <p className="mt-3 text-xs font-semibold text-slate-700">Selected: {file.name}</p>}
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={!file || importing} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
            {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
            {importing ? 'Extracting resume…' : 'Extract & Open Editor'}
          </button>
        </div>
      </form>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Uploaded resumes & saved versions</h2>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500"><RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />Loading your resume history…</div>
        ) : resumes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Your imported resumes and versions will appear here.</div>
        ) : resumes.map((resume) => (
          <article key={resume.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><FileText className="h-5 w-5" /></span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-slate-900">{resume.title}</h3>
                <p className="truncate text-xs text-slate-500">{resume.source_filename} · Version {resume.version_number || 1} · Updated {new Date(resume.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => downloadOriginal(resume)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Download className="h-3.5 w-3.5" />Original</button>
              <button type="button" onClick={() => navigate(`/builder/${resume.id}`)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700"><Edit3 className="h-3.5 w-3.5" />Edit this version</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
