import React from 'react';

export default function ScoreMeter({ score = 0, size = 120, strokeWidth = 10, label = 'ATS Score' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  let colorClass = 'text-emerald-500';
  let badgeText = 'Excellent';
  let bgBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  if (clampedScore < 50) {
    colorClass = 'text-rose-500';
    badgeText = 'Needs Work';
    bgBadge = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (clampedScore < 75) {
    colorClass = 'text-amber-500';
    badgeText = 'Moderate';
    bgBadge = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (clampedScore < 88) {
    colorClass = 'text-blue-500';
    badgeText = 'Good';
    bgBadge = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-1000 ease-out`}
            fill="transparent"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {clampedScore}
            <span className="text-sm font-semibold text-slate-400">%</span>
          </span>
          {label && <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>}
        </div>
      </div>

      {badgeText && (
        <span className={`mt-2.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bgBadge}`}>
          {badgeText}
        </span>
      )}
    </div>
  );
}
