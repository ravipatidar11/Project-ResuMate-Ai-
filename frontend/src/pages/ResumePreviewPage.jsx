import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { resumesAPI } from '../api/resumes';
import { pdfAPI } from '../api/pdf';
import { useToast } from '../context/ToastContext';
import TemplateRenderer from '../components/templates/TemplateRenderer';
import { Download, ArrowLeft, Printer, LayoutTemplate, Edit3, RefreshCw } from 'lucide-react';

export default function ResumePreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [resume, setResume] = useState(null);
  const [template, setTemplate] = useState('ats_friendly');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchResume = async () => {
      setLoading(true);
      try {
        const res = await resumesAPI.getById(id);
        setResume(res.data);
        setTemplate(res.data.template_name || 'ats_friendly');
      } catch {
        addToast('Resume not found', 'error');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchResume();
  }, [id, navigate]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      addToast('Downloading ATS-compliant PDF...', 'info');
      await pdfAPI.downloadPdf(id, template, `${resume.title.replace(/\s+/g, '_')}.pdf`);
      addToast('Download complete!', 'success');
    } catch {
      addToast('Failed to download PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Rendering preview...</p>
      </div>
    );
  }

  if (!resume) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Controls Bar (Hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to={`/builder/${id}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Editor</span>
          </Link>
          <h1 className="text-base font-bold text-slate-900 truncate max-w-xs">{resume.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Template Switcher */}
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-slate-400" />
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
            >
              <option value="ats_friendly">ATS Friendly</option>
              <option value="modern_professional">Modern Professional</option>
              <option value="minimal_professional">Minimal Professional</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
          >
            {downloading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Rendered Document */}
      <div className="rounded-2xl border border-slate-200 bg-slate-200/60 p-4 sm:p-10 shadow-inner flex justify-center">
        <TemplateRenderer templateName={template} data={resume} />
      </div>
    </div>
  );
}
