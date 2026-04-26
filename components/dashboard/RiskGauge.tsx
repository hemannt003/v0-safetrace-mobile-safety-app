'use client';

import { motion } from 'framer-motion';

export function RiskGauge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  let color = '#00966E'; // safe (green)
  let glowClass = '';
  
  if (percentage >= 72) {
    color = '#E52D27'; // red
    glowClass = 'animate-risk-glow';
  } else if (percentage >= 60) {
    color = '#E67E22'; // orange
  } else if (percentage >= 30) {
    color = '#F39C12'; // yellow
  }

  // Calculate arc
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  // 220 degree sweep
  const arcLength = (220 / 360) * circumference;
  const strokeDashoffset = arcLength - (percentage / 100) * arcLength;

  return (
    <div className="flex flex-col items-center justify-center py-6 relative">
      <div className={`relative w-48 h-48 flex items-center justify-center rounded-full ${glowClass}`}>
        <svg width="200" height="200" viewBox="0 0 200 200" className="absolute transform -rotate-[-110deg]">
          {/* Background arc */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="12"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <motion.circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </svg>
        
        <div className="absolute flex flex-col items-center text-center">
          <motion.span 
            className="text-5xl font-display font-bold"
            style={{ color }}
          >
            {percentage}%
          </motion.span>
          <span className="text-xs text-gray-400 font-semibold tracking-wider mt-1">RISK LEVEL</span>
        </div>
      </div>
    </div>
  );
}
