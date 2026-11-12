import React from 'react';
import { RiskLevel } from '../../types';

interface RiskMeterProps {
  score: number;
  level: RiskLevel;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
  score,
  level,
  confidence = 94,
  size = 'md',
}) => {
  // Determine color based on score
  const getColor = (s: number) => {
    if (s < 30) return { stroke: '#10B981', text: 'text-emerald-600', bg: 'from-emerald-500 to-teal-500' };
    if (s < 60) return { stroke: '#F59E0B', text: 'text-amber-600', bg: 'from-amber-500 to-yellow-500' };
    if (s < 85) return { stroke: '#F97316', text: 'text-orange-600', bg: 'from-orange-500 to-amber-600' };
    return { stroke: '#EF4444', text: 'text-rose-600', bg: 'from-rose-600 to-red-600' };
  };

  const color = getColor(score);

  // SVG Gauge calculations
  const radius = size === 'lg' ? 68 : size === 'sm' ? 38 : 52;
  const strokeWidth = size === 'lg' ? 10 : size === 'sm' ? 6 : 8;
  const circumference = 2 * Math.PI * radius;
  // We make it a 240 degree gauge
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * Math.min(score, 100)) / 100;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <svg
          className="transform -rotate-[135deg]"
          width={(radius + strokeWidth) * 2}
          height={(radius + strokeWidth) * 2}
        >
          {/* Background track */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active progress */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="transparent"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={`font-mono font-bold tracking-tight ${color.text} ${
              size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-3xl'
            }`}
          >
            {score}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            / 100 Risk
          </span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-[12px] font-medium uppercase tracking-wider ${
            score >= 85
              ? 'bg-rose-100 text-rose-800'
              : score >= 60
              ? 'bg-orange-100 text-orange-800'
              : score >= 35
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {level} Risk
        </span>
        <div className="text-[12px] font-normal text-slate-500 dark:text-slate-400 mt-1">
          Confidence: <span className="font-semibold text-slate-700 dark:text-slate-300">{confidence}%</span>
        </div>
      </div>
    </div>
  );
};
