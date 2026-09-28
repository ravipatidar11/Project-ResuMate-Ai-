import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Sparkles, Check, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

export default function AIModal({
  isOpen,
  onClose,
  title = 'AI Resume Enhancement',
  initialContent = '',
  modelUsed = 'Free Local AI',
  isLocalLlm = false,
  suggestions = [],
  onApply,
  onRegenerate,
  loading = false,
}) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleApply = () => {
    onApply(content);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Model Info Header */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{modelUsed}</p>
              <p className="text-[11px] text-slate-500">
                {isLocalLlm ? 'Powered by local Ollama LLM' : 'Powered by built-in Free NLP Engine'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500" />
            <span>₹0 Free</span>
          </div>
        </div>

        {/* Editable Output */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Review & Edit AI Generated Content:
          </label>
          {loading ? (
            <div className="h-48 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-sm font-medium text-indigo-900">Crafting high-impact resume content...</p>
            </div>
          ) : (
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm font-mono leading-relaxed bg-white text-slate-800 shadow-inner resize-y"
              placeholder="AI generated content will appear here..."
            />
          )}
          <p className="text-xs text-slate-500 mt-1.5 italic">
            Tip: You can modify, rephrase, or add specifics above before applying to your resume.
          </p>
        </div>

        {/* Suggestions list if any */}
        {suggestions && suggestions.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>ATS Expert Recommendations:</span>
            </div>
            <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
              {suggestions.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={loading || !content.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200 transition-all hover:shadow"
          >
            <Check className="w-4 h-4" />
            Apply to Resume
          </button>
        </div>
      </div>
    </Modal>
  );
}
