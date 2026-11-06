import React from 'react';
import { motion } from 'motion/react';

interface LiquidWaveGaugeProps {
  currentLiters: number;
  targetLiters: number;
  remainingLiters: number;
  percentage: number;
  isLimitReached: boolean;
  isWarning: boolean;
  lastTapTrigger?: number;
}

export const LiquidWaveGauge: React.FC<LiquidWaveGaugeProps> = ({
  currentLiters,
  targetLiters,
  remainingLiters,
  percentage,
  isLimitReached,
  isWarning,
}) => {
  // Clamp percentage between 4% (so bottom wave is visible) and 96%
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const waterLevelHeight = Math.max(8, Math.min(94, clampedPercentage));

  let waveColorBack = 'rgba(2, 132, 199, 0.45)';
  let waveColorFront = 'rgba(56, 189, 248, 0.85)';
  let glowColor = 'rgba(56, 189, 248, 0.35)';

  if (isLimitReached) {
    waveColorBack = 'rgba(185, 28, 28, 0.55)';
    waveColorFront = 'rgba(239, 68, 68, 0.85)';
    glowColor = 'rgba(239, 68, 68, 0.5)';
  } else if (isWarning) {
    waveColorBack = 'rgba(217, 119, 6, 0.55)';
    waveColorFront = 'rgba(251, 191, 36, 0.85)';
    glowColor = 'rgba(251, 191, 36, 0.4)';
  }

  return (
    <div className="relative mx-auto flex w-full flex-col items-center justify-center">
      {/* Outer Glow Halo */}
      <div
        className="absolute inset-0 rounded-3xl blur-2xl transition-all duration-700"
        style={{
          background: glowColor,
          opacity: clampedPercentage > 0 ? 0.35 : 0.1,
          transform: 'scale(0.92)',
        }}
      />

      {/* Main Glass Vessel */}
      <div className="relative h-64 w-full max-w-[340px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0e172a]/90 via-[#0a1120]/95 to-[#060a14] p-4 shadow-2xl shadow-black/80 backdrop-blur-xl">
        {/* Subtle glass reflection highlight on top */}
        <div className="pointer-events-none absolute inset-x-4 top-2 h-16 rounded-2xl bg-gradient-to-b from-white/10 to-transparent opacity-60" />

        {/* Ambient background grid lines representing liter calibrations */}
        <div className="pointer-events-none absolute inset-y-6 right-4 flex flex-col justify-between text-[9px] font-mono font-bold text-slate-500/60 select-none">
          <span>{targetLiters}L</span>
          <span>{Math.round(targetLiters * 0.75)}L</span>
          <span>{Math.round(targetLiters * 0.5)}L</span>
          <span>{Math.round(targetLiters * 0.25)}L</span>
          <span>0L</span>
        </div>

        {/* Liquid Container */}
        <div className="absolute inset-x-0 bottom-0 overflow-hidden rounded-b-3xl transition-all duration-700 ease-out"
          style={{ height: `${waterLevelHeight}%` }}
        >
          {/* Back Wave */}
          <div
            className="absolute -left-[100%] w-[300%] h-8 -top-4 opacity-70 animate-wave-slow"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, ${waveColorBack} 0%, transparent 70%)`,
            }}
          >
            <svg
              className="w-full h-8"
              viewBox="0 0 1200 40"
              preserveAspectRatio="none"
              fill={waveColorBack}
            >
              <path d="M0,20 C150,35 350,5 500,20 C650,35 850,5 1000,20 C1150,35 1300,5 1400,20 L1400,40 L0,40 Z" />
            </svg>
          </div>

          {/* Front Wave */}
          <div
            className="absolute -left-[50%] w-[300%] h-8 -top-3 animate-wave-fast"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, ${waveColorFront} 0%, transparent 70%)`,
            }}
          >
            <svg
              className="w-full h-8"
              viewBox="0 0 1200 40"
              preserveAspectRatio="none"
              fill={waveColorFront}
            >
              <path d="M0,15 C200,0 400,30 600,15 C800,0 1000,30 1200,15 L1200,40 L0,40 Z" />
            </svg>
          </div>

          {/* Deep Liquid Body Gradient */}
          <div
            className="h-full w-full"
            style={{
              background: isLimitReached
                ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.75) 0%, rgba(153, 27, 27, 0.95) 100%)'
                : isWarning
                ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.7) 0%, rgba(180, 83, 9, 0.9) 100%)'
                : 'linear-gradient(180deg, rgba(56, 189, 248, 0.65) 0%, rgba(2, 132, 199, 0.85) 60%, rgba(14, 116, 144, 0.95) 100%)',
            }}
          >
            {/* Ambient rising bubble particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <span className="bubble-1 absolute bottom-2 left-[20%] h-2.5 w-2.5 rounded-full bg-white/40 blur-[0.5px]" />
              <span className="bubble-2 absolute bottom-1 left-[50%] h-1.5 w-1.5 rounded-full bg-white/50 blur-[0.5px]" />
              <span className="bubble-3 absolute bottom-3 left-[75%] h-2 w-2 rounded-full bg-white/30 blur-[0.5px]" />
            </div>
          </div>
        </div>

        {/* Center Readout Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
          <motion.div
            key={currentLiters}
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                {currentLiters}
              </span>
              <span className="text-2xl font-bold text-sky-300 drop-shadow">
                / {targetLiters}
              </span>
              <span className="text-lg font-black text-sky-400 drop-shadow">L</span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md">
                {percentage}% used
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold shadow-md backdrop-blur-md ${
                  isLimitReached
                    ? 'border-red-400/40 bg-red-950/70 text-red-300'
                    : 'border-sky-400/30 bg-sky-950/70 text-sky-200'
                }`}
              >
                {remainingLiters} L left
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
