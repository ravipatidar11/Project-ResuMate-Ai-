import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resumesAPI } from '../api/resumes';
import { aiAPI } from '../api/ai';
import { pdfAPI } from '../api/pdf';
import { atsAPI } from '../api/ats';
import { useToast } from '../context/ToastContext';
import TemplateRenderer from '../components/templates/TemplateRenderer';
import AIModal from '../components/common/AIModal';
import {
  Save,
  Download,
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  LayoutTemplate,
  Check,
  Eye,
  RefreshCw,
  Zap,
  Wand2,
  FileCheck,
  ExternalLink
  ,History
} from 'lucide-react';

const INITIAL_RESUME = {
  title: 'My Professional Resume',
  template_name: 'ats_friendly',
  target_role: 'Software Engineer',
  personal_info: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    jobTitle: 'Software Engineer',
    website: '',
    linkedin: '',
    github: '',
    portfolio: ''
  },
  summary: '',
  education: [],
  experience: [],
  internships: [],
  projects: [],
  skills: {
    technical: ['Python', 'JavaScript', 'React', 'SQL', 'Git'],
    soft: ['Problem Solving', 'Communication', 'Teamwork'],
    tools: ['Docker', 'VS Code', 'Linux']
  },
  certifications: [],
  achievements: [],
  interests: [],
  languages: [
    { id: '1', language: 'English', proficiency: 'Fluent' },
    { id: '2', language: 'Hindi', proficiency: 'Native' }
  ]
};

export default function ResumeBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [resumeData, setResumeData] = useState(INITIAL_RESUME);
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const savedDataRef = useRef(id ? null : JSON.stringify(INITIAL_RESUME));
  const resumeReadyRef = useRef(!id);
  const [downloading, setDownloading] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [analyzingATS, setAnalyzingATS] = useState(false);
  const [reimporting, setReimporting] = useState(false);

  // AI Modal States
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalTitle, setAiModalTitle] = useState('AI Assistant');
  const [aiContent, setAiContent] = useState('');
  const [aiModelUsed, setAiModelUsed] = useState('Free Local AI');
  const [aiIsLocalLlm, setAiIsLocalLlm] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiApplyCallback, setAiApplyCallback] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchResume = async () => {
        setLoading(true);
        try {
          const res = await resumesAPI.getById(id);
          const data = res.data;
          // Ensure skills object format
          if (Array.isArray(data.skills)) {
            data.skills = { technical: data.skills, soft: [], tools: [] };
          }
          savedDataRef.current = JSON.stringify(data);
          resumeReadyRef.current = true;
          setResumeData(data);
        } catch (err) {
          addToast('Failed to load resume details', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchResume();
    }
  }, [id]);

  useEffect(() => {
    if (!id) { setVersions([]); return; }
    resumesAPI.getVersions(id).then((res) => setVersions(res.data || [])).catch(() => setVersions([]));
  }, [id]);

  // Save edits after the user pauses typing. New resumes are created on the
  // first edit, then subsequent changes update that same resume.
  useEffect(() => {
    if (!resumeReadyRef.current || saving) return;
    const serialized = JSON.stringify(resumeData);
    if (serialized === savedDataRef.current) return;

    setSaveStatus('pending');
    const timer = window.setTimeout(async () => {
      setSaveStatus('saving');
      try {
        if (id) {
          await resumesAPI.update(id, resumeData);
        } else {
          const res = await resumesAPI.create(resumeData);
          savedDataRef.current = serialized;
          navigate(`/builder/${res.data.id}`, { replace: true });
        }
        savedDataRef.current = serialized;
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [resumeData, id, navigate, saving]);

  // Handler helpers
  const handlePersonalInfoChange = (field, value) => {
    setResumeData((prev) => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (id) {
        await resumesAPI.update(id, resumeData);
        addToast('Resume updated successfully!', 'success');
      } else {
        const res = await resumesAPI.create(resumeData);
        addToast('Resume created successfully!', 'success');
        navigate(`/builder/${res.data.id}`, { replace: true });
      }
      savedDataRef.current = JSON.stringify(resumeData);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
      addToast('Failed to save resume', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      addToast('Generating ATS-compliant PDF...', 'info');
      if (id) {
        await pdfAPI.downloadPdf(id, resumeData.template_name, `${(resumeData.title || 'resume').replace(/\s+/g, '_')}.pdf`);
      } else {
        await pdfAPI.downloadCustomPdf(resumeData, resumeData.template_name, 'resume.pdf');
      }
      addToast('PDF downloaded successfully!', 'success');
    } catch {
      addToast('Failed to generate PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveAsVersion = async () => {
    if (!id) { addToast('Save the resume once before creating a version', 'info'); return; }
    setSaving(true);
    try {
      await resumesAPI.update(id, resumeData);
      const response = await resumesAPI.createVersion(id, resumeData);
      savedDataRef.current = JSON.stringify(response.data);
      addToast(`Saved as version ${response.data.version_number}`, 'success');
      navigate(`/builder/${response.data.id}`);
    } catch (error) {
      addToast(error.response?.data?.detail || 'Could not save a new version', 'error');
    } finally { setSaving(false); }
  };

  const handleAnalyzeATS = async () => {
    if (!id) { addToast('Save the resume before running ATS analysis', 'info'); return; }
    setAnalyzingATS(true);
    try {
      await resumesAPI.update(id, resumeData);
      savedDataRef.current = JSON.stringify(resumeData);
      const response = await atsAPI.analyzeResume(id);
      const score = response.data?.overall_score ?? response.data?.score;
      addToast(`ATS analysis complete${score != null ? `: ${score}%` : ''}. View it in ATS Analyzer.`, 'success');
    } catch (error) {
      addToast(error.response?.data?.detail || 'ATS analysis failed', 'error');
    } finally { setAnalyzingATS(false); }
  };

  const handleDownloadOriginal = async () => {
    try {
      const response = await resumesAPI.getOriginalFile(id);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = resumeData.source_filename || 'original-resume';
      link.click();
      URL.revokeObjectURL(url);
    } catch { addToast('Original upload is unavailable', 'error'); }
  };

  const handleReimportOriginal = async () => {
    if (!id) return;
    setReimporting(true);
    try {
      const response = await resumesAPI.reimportOriginal(id);
      addToast('Created a new version from the original file with refreshed extraction.', 'success');
      navigate(`/builder/${response.data.id}`);
    } catch (error) {
      addToast(error.response?.data?.detail || 'Could not re-extract the original file', 'error');
    } finally { setReimporting(false); }
  };

  // Repeatable array helpers
  const addArrayItem = (section, defaultItem) => {
    setResumeData((prev) => ({
      ...prev,
      [section]: [...(prev[section] || []), { id: Date.now().toString(), ...defaultItem }]
    }));
  };

  const updateArrayItem = (section, index, field, value) => {
    setResumeData((prev) => {
      const arr = [...(prev[section] || [])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [section]: arr };
    });
  };

  const removeArrayItem = (section, index) => {
    setResumeData((prev) => {
      const arr = [...(prev[section] || [])];
      arr.splice(index, 1);
      return { ...prev, [section]: arr };
    });
  };

  // Bullet point helpers for Experience and Projects
  const updateBullet = (section, itemIndex, bulletIndex, value) => {
    setResumeData((prev) => {
      const arr = [...(prev[section] || [])];
      const bullets = [...(arr[itemIndex].bullets || [])];
      bullets[bulletIndex] = value;
      arr[itemIndex] = { ...arr[itemIndex], bullets };
      return { ...prev, [section]: arr };
    });
  };

  const addBullet = (section, itemIndex) => {
    setResumeData((prev) => {
      const arr = [...(prev[section] || [])];
      const bullets = [...(arr[itemIndex].bullets || []), 'Accomplished [X] as measured by [Y] by doing [Z].'];
      arr[itemIndex] = { ...arr[itemIndex], bullets };
      return { ...prev, [section]: arr };
    });
  };

  const removeBullet = (section, itemIndex, bulletIndex) => {
    setResumeData((prev) => {
      const arr = [...(prev[section] || [])];
      const bullets = [...(arr[itemIndex].bullets || [])];
      bullets.splice(bulletIndex, 1);
      arr[itemIndex] = { ...arr[itemIndex], bullets };
      return { ...prev, [section]: arr };
    });
  };

  // Skills helpers
  const handleSkillAdd = (category, skill) => {
    if (!skill.trim()) return;
    setResumeData((prev) => {
      const skills = { ...prev.skills };
      const list = skills[category] || [];
      if (!list.includes(skill.trim())) {
        skills[category] = [...list, skill.trim()];
      }
      return { ...prev, skills };
    });
  };

  const handleSkillRemove = (category, index) => {
    setResumeData((prev) => {
      const skills = { ...prev.skills };
      const list = [...(skills[category] || [])];
      list.splice(index, 1);
      skills[category] = list;
      return { ...prev, skills };
    });
  };

  // AI Features Triggers
  const openAIGenerateSummary = async () => {
    setAiLoading(true);
    setAiModalTitle('Generate Professional Summary');
    setAiModalOpen(true);
    try {
      const techSkills = resumeData.skills?.technical || [];
      const res = await aiAPI.generateSummary({
        role: resumeData.target_role || resumeData.personal_info.jobTitle || 'Software Engineer',
        experience_level: 'Mid to Senior',
        key_skills: techSkills.slice(0, 6)
      });
      setAiContent(res.data.result);
      setAiModelUsed(res.data.model_used);
      setAiIsLocalLlm(res.data.is_local_llm);
      setAiSuggestions(res.data.suggestions || []);
      setAiApplyCallback(() => (newText) => {
        setResumeData((prev) => ({ ...prev, summary: newText }));
        addToast('Summary updated with AI content!', 'success');
      });
    } catch {
      addToast('AI generation failed', 'error');
      setAiModalOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  const openAIImproveSummary = async () => {
    if (!resumeData.summary.trim()) {
      openAIGenerateSummary();
      return;
    }
    setAiLoading(true);
    setAiModalTitle('Improve Summary for ATS');
    setAiModalOpen(true);
    try {
      const res = await aiAPI.improveSummary({
        summary: resumeData.summary,
        target_role: resumeData.target_role
      });
      setAiContent(res.data.result);
      setAiModelUsed(res.data.model_used);
      setAiIsLocalLlm(res.data.is_local_llm);
      setAiSuggestions([
        'Action verbs and quantifiable keywords have been enhanced.',
        'Review the draft below and edit if needed before applying.'
      ]);
      setAiApplyCallback(() => (newText) => {
        setResumeData((prev) => ({ ...prev, summary: newText }));
        addToast('Summary improved!', 'success');
      });
    } catch {
      addToast('AI enhancement failed', 'error');
      setAiModalOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  const openAIImproveExperience = async (expIndex) => {
    const exp = resumeData.experience[expIndex];
    if (!exp) return;
    setAiLoading(true);
    setAiModalTitle(`Improve Bullets: ${exp.role || 'Role'}`);
    setAiModalOpen(true);
    try {
      const res = await aiAPI.improveExperience({
        role: exp.role || 'Software Engineer',
        company: exp.company || 'Company',
        bullets: exp.bullets || []
      });
      const bulletText = (res.data.result || []).map((b) => `• ${b}`).join('\n');
      setAiContent(bulletText);
      setAiModelUsed(res.data.model_used);
      setAiIsLocalLlm(res.data.is_local_llm);
      setAiSuggestions([
        'Rewritten following the Google XYZ formula: Accomplished [X] measured by [Y] doing [Z].',
        'Edit individual numbers or metrics to match your actual achievements.'
      ]);
      setAiApplyCallback(() => (newText) => {
        const parsedBullets = newText
          .split('\n')
          .map((l) => l.replace(/^[•\-\*]\s*/, '').trim())
          .filter(Boolean);
        setResumeData((prev) => {
          const arr = [...prev.experience];
          arr[expIndex] = { ...arr[expIndex], bullets: parsedBullets };
          return { ...prev, experience: arr };
        });
        addToast('Experience bullets updated!', 'success');
      });
    } catch {
      addToast('Failed to enhance bullets', 'error');
      setAiModalOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  const openAIGenerateProjectBullets = async (prjIndex) => {
    const prj = resumeData.projects[prjIndex];
    if (!prj) return;
    setAiLoading(true);
    setAiModalTitle(`AI Project Description: ${prj.title || 'Project'}`);
    setAiModalOpen(true);
    try {
      const res = await aiAPI.generateProjectDesc({
        title: prj.title || 'Full-Stack Application',
        technologies: prj.technologies || ['React', 'FastAPI'],
        overview: prj.subtitle || ''
      });
      const bulletText = (res.data.result || []).map((b) => `• ${b}`).join('\n');
      setAiContent(bulletText);
      setAiModelUsed(res.data.model_used);
      setAiIsLocalLlm(res.data.is_local_llm);
      setAiApplyCallback(() => (newText) => {
        const parsedBullets = newText
          .split('\n')
          .map((l) => l.replace(/^[•\-\*]\s*/, '').trim())
          .filter(Boolean);
        setResumeData((prev) => {
          const arr = [...prev.projects];
          arr[prjIndex] = { ...arr[prjIndex], bullets: parsedBullets };
          return { ...prev, projects: arr };
        });
        addToast('Project bullets generated!', 'success');
      });
    } catch {
      addToast('Project AI generation failed', 'error');
      setAiModalOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  const openAISuggestSkills = async () => {
    setAiLoading(true);
    setAiModalTitle('Trending Skills Suggestions');
    setAiModalOpen(true);
    try {
      const res = await aiAPI.improveSkills({
        current_skills: resumeData.skills,
        target_role: resumeData.target_role || 'Software Engineer'
      });
      const suggested = res.data.result?.suggested_additions || [];
      setAiContent(suggested.join(', '));
      setAiModelUsed(res.data.model_used);
      setAiSuggestions([
        'Trending skills that high-screening ATS algorithms look for in this role.',
        'Separate by commas and apply to append to your Technical Skills.'
      ]);
      setAiApplyCallback(() => (newText) => {
        const skillsToAdd = newText.split(',').map((s) => s.trim()).filter(Boolean);
        setResumeData((prev) => {
          const skills = { ...prev.skills };
          const tech = skills.technical || [];
          const merged = Array.from(new Set([...tech, ...skillsToAdd]));
          skills.technical = merged;
          return { ...prev, skills };
        });
        addToast('Skills appended!', 'success');
      });
    } catch {
      addToast('Skill suggestion failed', 'error');
      setAiModalOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  const openAIMakeAtsFriendly = async () => {
    setAiLoading(true);
    setAiModalTitle('Optimize Resume for ATS Screening');
    setAiModalOpen(true);
    try {
      const res = await aiAPI.makeAtsFriendly({ resume_data: resumeData });
      const details = res.data.result;
      const suggestionsText = (details.suggestions || []).map((s) => `• ${s}`).join('\n');
      setAiContent(
        `AI ATS Compliance Audit: ${details.compliance_score}/100\n\n${(details.reasons || []).join('\n')}\n\nKey Recommendations:\n${suggestionsText}`
      );
      setAiModelUsed(res.data.model_used);
      setAiSuggestions(details.suggestions || []);
      setAiApplyCallback(() => () => {
        setResumeData((prev) => ({ ...prev, template_name: 'ats_friendly' }));
        addToast('Set template to ATS Friendly!', 'success');
      });
    } catch {
      addToast('ATS audit failed', 'error');
      setAiModalOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'summary', label: 'Summary' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects' },
    { id: 'internships', label: 'Internships' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'more', label: 'Certificates & More' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={resumeData.title}
            onChange={(e) => setResumeData((prev) => ({ ...prev, title: e.target.value }))}
            className="text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-hidden px-1 py-0.5"
            placeholder="Resume Title"
          />
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-slate-400" />
            <select
              value={resumeData.template_name}
              onChange={(e) => setResumeData((prev) => ({ ...prev, template_name: e.target.value }))}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="ats_friendly">ATS Friendly Template</option>
              <option value="modern_professional">Modern Professional</option>
              <option value="minimal_professional">Minimal Professional</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {id && resumeData.source_filename && <button onClick={handleDownloadOriginal} className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">Original</button>}
          {id && resumeData.source_filename && <button onClick={handleReimportOriginal} disabled={reimporting} className="px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50">{reimporting ? 'Re-extracting…' : 'Re-extract original'}</button>}
          {id && <div className="relative">
            <button onClick={() => setShowVersions((open) => !open)} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"><History className="w-3.5 h-3.5"/>Versions</button>
            {showVersions && <div className="absolute right-0 top-full z-30 mt-2 min-w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              {versions.map((version) => <button key={version.id} onClick={() => navigate(`/builder/${version.id}`)} className="block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-indigo-50">Version {version.version_number || 1} · {new Date(version.updated_at).toLocaleDateString()}</button>)}
              {!versions.length && <p className="px-3 py-2 text-xs text-slate-500">No saved versions</p>}
            </div>}
          </div>}
          {id && <button onClick={handleSaveAsVersion} disabled={saving} className="px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50">Save as New Version</button>}
          {id && <button onClick={handleAnalyzeATS} disabled={analyzingATS} className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50">{analyzingATS ? 'Analyzing…' : 'Analyze ATS'}</button>}
          {/* Make ATS Friendly Button */}
          <button
            onClick={openAIMakeAtsFriendly}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Make ATS Friendly</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving...' : 'Save Resume'}</span>
          </button>
          <span aria-live="polite" className="hidden sm:inline text-[11px] text-slate-500 min-w-24">
            {saveStatus === 'pending' && 'Unsaved changes'}
            {saveStatus === 'saving' && 'Auto-saving…'}
            {saveStatus === 'saved' && 'All changes saved'}
            {saveStatus === 'error' && 'Auto-save failed'}
          </span>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {downloading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-600" />}
            <span>PDF</span>
          </button>

          {/* Mobile Preview Toggle */}
          <button
            onClick={() => setMobilePreviewOpen(!mobilePreviewOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Split Builder Grid: Left Editor (1.2 fr) vs Right Live Preview (1.8 fr) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Form Sections (Col span 5 on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Section Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-slate-200/70 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            {/* TAB 1: Personal Info */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Full Name</label>
                    <input
                      type="text"
                      value={resumeData.personal_info.fullName || ''}
                      onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                      placeholder="Aarav Sharma"
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Target Job Title</label>
                    <input
                      type="text"
                      value={resumeData.personal_info.jobTitle || ''}
                      onChange={(e) => {
                        handlePersonalInfoChange('jobTitle', e.target.value);
                        setResumeData((prev) => ({ ...prev, target_role: e.target.value }));
                      }}
                      placeholder="Lead Software Engineer"
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Email Address</label>
                    <input
                      type="email"
                      value={resumeData.personal_info.email || ''}
                      onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                      placeholder="aarav@example.in"
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Phone</label>
                    <input
                      type="text"
                      value={resumeData.personal_info.phone || ''}
                      onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-600">Location (City, Country)</label>
                    <input
                      type="text"
                      value={resumeData.personal_info.location || ''}
                      onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                      placeholder="Bengaluru, Karnataka, India"
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-600">LinkedIn Profile URL</label>
                    <input
                      type="text"
                      value={resumeData.personal_info.linkedin || ''}
                      onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/aaravsharma"
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">GitHub URL</label>
                    <input
                      type="text"
                      value={resumeData.personal_info.github || ''}
                      onChange={(e) => handlePersonalInfoChange('github', e.target.value)}
                      placeholder="https://github.com/aaravsharma"
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Portfolio / Website</label>
                    <input
                      type="text"
                      value={resumeData.personal_info.portfolio || resumeData.personal_info.website || ''}
                      onChange={(e) => {
                        handlePersonalInfoChange('portfolio', e.target.value);
                        handlePersonalInfoChange('website', e.target.value);
                      }}
                      placeholder="https://aaravsharma.dev"
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Summary */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-900">Professional Summary</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={openAIGenerateSummary}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate with AI</span>
                    </button>
                    {resumeData.summary && (
                      <button
                        type="button"
                        onClick={openAIImproveSummary}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Improve</span>
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  rows={6}
                  value={resumeData.summary}
                  onChange={(e) => setResumeData((prev) => ({ ...prev, summary: e.target.value }))}
                  placeholder="Experienced software engineer with expertise in..."
                  className="w-full px-3.5 py-2.5 text-xs leading-relaxed rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-200"
                />
                <p className="text-[11px] text-slate-500">
                  Tip: A high-impact summary is 3-4 sentences highlighting your years of experience, core domains, and key metrics.
                </p>
              </div>
            )}

            {/* TAB 3: Work Experience */}
            {activeTab === 'experience' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-900">Work Experience</h3>
                  <button
                    type="button"
                    onClick={() =>
                      addArrayItem('experience', {
                        company: 'Company Name',
                        role: 'Software Engineer',
                        location: 'Remote',
                        startDate: '2023',
                        endDate: 'Present',
                        current: true,
                        bullets: ['Accomplished [X] as measured by [Y] by doing [Z].']
                      })
                    }
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Position</span>
                  </button>
                </div>

                {resumeData.experience.map((exp, expIdx) => (
                  <div key={exp.id || expIdx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">Position #{expIdx + 1}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openAIImproveExperience(expIdx)}
                          className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Improve Bullets</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('experience', expIdx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => updateArrayItem('experience', expIdx, 'company', e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Role / Title"
                        value={exp.role}
                        onChange={(e) => updateArrayItem('experience', expIdx, 'role', e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Start Date (e.g. 2022)"
                        value={exp.startDate}
                        onChange={(e) => updateArrayItem('experience', expIdx, 'startDate', e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border bg-white"
                      />
                      <input
                        type="text"
                        placeholder="End Date (or Present)"
                        value={exp.endDate}
                        onChange={(e) => updateArrayItem('experience', expIdx, 'endDate', e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border bg-white"
                      />
                    </div>

                    {/* Bullet Points */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Impact Bullets</label>
                      {(exp.bullets || []).map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => updateBullet('experience', expIdx, bIdx, e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg border bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeBullet('experience', expIdx, bIdx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addBullet('experience', expIdx)}
                        className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Bullet</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: Skills */}
            {activeTab === 'internships' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div><h3 className="text-sm font-bold text-slate-900">Internships</h3><p className="mt-1 text-[11px] text-slate-500">Showcase hands-on experience, contributions, and results.</p></div>
                  <button type="button" onClick={() => addArrayItem('internships', { company: '', role: '', location: '', startDate: '', endDate: '', bullets: [''] })} className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"><Plus className="h-3.5 w-3.5" /> Add Internship</button>
                </div>
                {(resumeData.internships || []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><p className="text-xs text-slate-500">No internships added yet.</p><p className="mt-1 text-[11px] text-slate-400">Internships, co-ops, and trainee roles fit here.</p></div>
                ) : (resumeData.internships || []).map((internship, index) => (
                  <div key={internship.id || index} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-800">Internship #{index + 1}</span><button type="button" onClick={() => removeArrayItem('internships', index)} className="text-rose-500 hover:text-rose-700" aria-label="Remove internship"><Trash2 className="h-3.5 w-3.5" /></button></div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input value={internship.role || ''} onChange={(e) => updateArrayItem('internships', index, 'role', e.target.value)} placeholder="Role / Internship Title" className="rounded-lg border bg-white px-2.5 py-2 text-xs" />
                      <input value={internship.company || ''} onChange={(e) => updateArrayItem('internships', index, 'company', e.target.value)} placeholder="Company / Organization" className="rounded-lg border bg-white px-2.5 py-2 text-xs" />
                      <input value={internship.location || ''} onChange={(e) => updateArrayItem('internships', index, 'location', e.target.value)} placeholder="Location (optional)" className="rounded-lg border bg-white px-2.5 py-2 text-xs" />
                      <div className="grid grid-cols-2 gap-2"><input value={internship.startDate || ''} onChange={(e) => updateArrayItem('internships', index, 'startDate', e.target.value)} placeholder="Start date" className="min-w-0 rounded-lg border bg-white px-2.5 py-2 text-xs" /><input value={internship.endDate || ''} onChange={(e) => updateArrayItem('internships', index, 'endDate', e.target.value)} placeholder="End date" className="min-w-0 rounded-lg border bg-white px-2.5 py-2 text-xs" /></div>
                    </div>
                    <div className="space-y-2 border-t border-slate-200 pt-3">
                      <label className="text-[11px] font-bold uppercase text-slate-600">Responsibilities & Achievements</label>
                      {(internship.bullets || []).map((bullet, bulletIndex) => <div key={bulletIndex} className="flex gap-2"><textarea rows={2} value={bullet} onChange={(e) => updateBullet('internships', index, bulletIndex, e.target.value)} placeholder="Describe a contribution, tool used, or measurable result" className="flex-1 resize-y rounded-lg border bg-white px-2.5 py-2 text-xs" /><button type="button" onClick={() => removeBullet('internships', index, bulletIndex)} className="self-start p-1 text-slate-400 hover:text-rose-600" aria-label="Remove bullet"><Trash2 className="h-3.5 w-3.5" /></button></div>)}
                      <button type="button" onClick={() => addBullet('internships', index)} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline"><Plus className="h-3 w-3" /> Add achievement</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: Skills */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-900">Skills</h3>
                  <button
                    type="button"
                    onClick={openAISuggestSkills}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Suggest Trending Skills</span>
                  </button>
                </div>

                {['technical', 'soft', 'tools'].map((cat) => {
                  const list = resumeData.skills?.[cat] || [];
                  return (
                    <div key={cat} className="space-y-2">
                      <label className="text-xs font-bold capitalize text-slate-700">{cat} Skills</label>
                      <div className="flex flex-wrap gap-1.5">
                        {list.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => handleSkillRemove(cat, sIdx)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder={`Add ${cat} skill (press Enter)`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSkillAdd(cat, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 5: Projects */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-900">Projects</h3>
                  <button
                    type="button"
                    onClick={() =>
                      addArrayItem('projects', {
                        title: 'Project Name',
                        technologies: ['React', 'FastAPI'],
                        link: '',
                        github: '',
                        bullets: ['Engineered application utilizing modern distributed stack.']
                      })
                    }
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                {resumeData.projects.map((prj, prjIdx) => (
                  <div key={prj.id || prjIdx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">Project #{prjIdx + 1}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openAIGenerateProjectBullets(prjIdx)}
                          className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>AI Bullets</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('projects', prjIdx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Project Title"
                        value={prj.title}
                        onChange={(e) => updateArrayItem('projects', prjIdx, 'title', e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Technologies (comma separated)"
                        value={Array.isArray(prj.technologies) ? prj.technologies.join(', ') : prj.technologies || ''}
                        onChange={(e) =>
                          updateArrayItem(
                            'projects',
                            prjIdx,
                            'technologies',
                            e.target.value.split(',').map((s) => s.trim())
                          )
                        }
                        className="px-2.5 py-1.5 text-xs rounded-lg border bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Project URL"
                        value={prj.link || ''}
                        onChange={(e) => updateArrayItem('projects', prjIdx, 'link', e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border bg-white col-span-2"
                      />
                    </div>

                    {/* Bullets */}
                    <div className="space-y-1.5 pt-1">
                      {(prj.bullets || []).map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => updateBullet('projects', prjIdx, bIdx, e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg border bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeBullet('projects', prjIdx, bIdx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addBullet('projects', prjIdx)}
                        className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Project Bullet</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 6: Education */}
            {activeTab === 'education' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-900">Education</h3>
                  <button
                    type="button"
                    onClick={() =>
                      addArrayItem('education', {
                        institution: 'University Name',
                        degree: 'Bachelor of Science',
                        fieldOfStudy: 'Computer Science',
                        startDate: '2020',
                        endDate: '2024',
                        gpa: '3.8/4.0'
                      })
                    }
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Degree</span>
                  </button>
                </div>

                {resumeData.education.map((edu, eduIdx) => (
                  <div key={edu.id || eduIdx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">Degree #{eduIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('education', eduIdx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Institution / University"
                        value={edu.institution}
                        onChange={(e) => updateArrayItem('education', eduIdx, 'institution', e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Degree (e.g. B.Tech)"
                        value={edu.degree}
                        onChange={(e) => updateArrayItem('education', eduIdx, 'degree', e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Field of Study"
                        value={edu.fieldOfStudy}
                        onChange={(e) => updateArrayItem('education', eduIdx, 'fieldOfStudy', e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border bg-white"
                      />
                      <input
                        type="text"
                        placeholder="GPA (optional)"
                        value={edu.gpa || ''}
                        onChange={(e) => updateArrayItem('education', eduIdx, 'gpa', e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Start Date"
                        value={edu.startDate}
                        onChange={(e) => updateArrayItem('education', eduIdx, 'startDate', e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border bg-white"
                      />
                      <input
                        type="text"
                        placeholder="End Date"
                        value={edu.endDate}
                        onChange={(e) => updateArrayItem('education', eduIdx, 'endDate', e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 7: Certifications & More */}
            {activeTab === 'more' && (
              <div className="space-y-6">
                {/* Certifications */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-bold text-slate-900">Certifications</h3>
                    <button
                      type="button"
                      onClick={() =>
                        addArrayItem('certifications', {
                          name: 'AWS Certified Developer',
                          issuer: 'Amazon Web Services',
                          issueDate: '2024',
                          credentialUrl: ''
                        })
                      }
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                  {resumeData.certifications.map((c, i) => (
                    <div key={c.id || i} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input type="text" placeholder="Certification Name" value={c.name || ''} onChange={(e) => updateArrayItem('certifications', i, 'name', e.target.value)} className="rounded-lg border bg-white px-2.5 py-2 text-xs" />
                        <input type="text" placeholder="Issuing Organization" value={c.issuer || ''} onChange={(e) => updateArrayItem('certifications', i, 'issuer', e.target.value)} className="rounded-lg border bg-white px-2.5 py-2 text-xs" />
                        <input type="text" placeholder="Issue date (e.g. May 2025)" value={c.issueDate || ''} onChange={(e) => updateArrayItem('certifications', i, 'issueDate', e.target.value)} className="rounded-lg border bg-white px-2.5 py-2 text-xs" />
                        <input type="url" placeholder="Certificate URL (https://...)" value={c.credentialUrl || ''} onChange={(e) => updateArrayItem('certifications', i, 'credentialUrl', e.target.value)} className="rounded-lg border bg-white px-2.5 py-2 text-xs" />
                      </div>
                      <button type="button" onClick={() => removeArrayItem('certifications', i)} className="self-start rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label="Remove certification"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>

                {/* Achievements */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-bold text-slate-900">Achievements / Honors</h3>
                    <button
                      type="button"
                      onClick={() =>
                        addArrayItem('achievements', {
                          title: 'Hackathon Finalist',
                          description: 'Built distributed telemetry service'
                        })
                      }
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                  {resumeData.achievements.map((a, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Title"
                        value={a.title}
                        onChange={(e) => updateArrayItem('achievements', i, 'title', e.target.value)}
                        className="w-36 px-2.5 py-1.5 text-xs rounded-lg border"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={a.description}
                        onChange={(e) => updateArrayItem('achievements', i, 'description', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('achievements', i)}
                        className="text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="block border-b pb-2 text-sm font-bold text-slate-900">Interests</label>
                  <textarea
                    value={(resumeData.interests || []).join(', ')}
                    onChange={(event) => setResumeData((prev) => ({ ...prev, interests: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))}
                    placeholder="Cricket, volunteering, photography"
                    className="min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live Interactive Resume Preview (Col span 7 on desktop) */}
        <div className={`lg:col-span-7 ${mobilePreviewOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-20 space-y-3">
            <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Resume Preview
              </span>
              <span className="text-[11px] text-slate-400">
                Template: {resumeData.template_name?.replace('_', ' ')}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-4 sm:p-6 shadow-inner max-h-[85vh] overflow-y-auto">
              <TemplateRenderer templateName={resumeData.template_name} data={resumeData} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Modal Drawer for User Edits Before Applying */}
      <AIModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title={aiModalTitle}
        initialContent={aiContent}
        modelUsed={aiModelUsed}
        isLocalLlm={aiIsLocalLlm}
        suggestions={aiSuggestions}
        loading={aiLoading}
        onApply={(finalContent) => {
          if (aiApplyCallback) {
            aiApplyCallback(finalContent);
          }
        }}
      />
    </div>
  );
}
