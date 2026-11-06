import React, { useState, useEffect } from 'react';
import { AlertTriangle, RotateCcw, Droplets, Calendar, Plus, Layers, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { FilterCycle } from '../types';
import { LiquidWaveGauge } from './LiquidWaveGauge';
import { PersonSelector } from './PersonSelector';
import { TapSplashEffect } from './TapSplashEffect';

interface MainTrackerProps {
  currentLiters: number;
  activeCycle: FilterCycle | null;
  totalFills: number;
  lastTapTimestamp: number | null;
  lastTapVolume: number;
  lastTapPerson?: string;
  people: string[];
  selectedPerson: string;
  onSelectPerson: (person: string) => void;
  onAddPerson: (newPerson: string) => void;
  onRenamePerson?: (oldName: string, newName: string) => void;
  onLogVolume: (volume: number, note?: string, person?: string) => void;
  onUndoLastTap: () => void;
  onOpenResetModal: () => void;
  onUpdateTarget: (target: number) => void;
  onNavigateToDashboard: () => void;
}

export const MainTracker: React.FC<MainTrackerProps> = ({
  currentLiters,
  activeCycle,
  totalFills,
  lastTapTimestamp,
  lastTapVolume,
  lastTapPerson,
  people,
  selectedPerson,
  onSelectPerson,
  onAddPerson,
  onRenamePerson,
  onLogVolume,
  onUndoLastTap,
  onOpenResetModal,
  onUpdateTarget,
  onNavigateToDashboard,
}) => {
  const [showUndo, setShowUndo] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [splash, setSplash] = useState<{
    id: number;
    volume: number;
    person?: string;
  } | null>(null);

  const targetLiters = activeCycle?.targetLiters || 1500;
  const isLimitReached = currentLiters >= targetLiters;
  const isWarning = currentLiters >= targetLiters * 0.85 && !isLimitReached;
  const percentage = Math.min(100, Math.round((currentLiters / targetLiters) * 100));
  const remainingLiters = Math.max(0, targetLiters - currentLiters);

  // Manage undo timer (show undo for 60 seconds after tap)
  useEffect(() => {
    if (!lastTapTimestamp) {
      setShowUndo(false);
      return;
    }

    const checkInterval = () => {
      const elapsed = Date.now() - lastTapTimestamp;
      const left = Math.max(0, 60 - Math.floor(elapsed / 1000));
      if (left > 0 && currentLiters >= lastTapVolume) {
        setShowUndo(true);
        setSecondsRemaining(left);
      } else {
        setShowUndo(false);
      }
    };

    checkInterval();
    const interval = setInterval(checkInterval, 1000);
    return () => clearInterval(interval);
  }, [lastTapTimestamp, currentLiters, lastTapVolume]);

  const handleFill = (volume: number, note?: string) => {
    setSplash({
      id: Date.now(),
      volume,
      person: selectedPerson,
    });
    onLogVolume(volume, note, selectedPerson);
    setTimeout(() => {
      setSplash(null);
    }, 1200);
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  // Calculate cycle days running and daily average
  const cycleDays = activeCycle?.startDate
    ? Math.max(1, Math.round((Date.now() - new Date(activeCycle.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const dailyAverage = (currentLiters / cycleDays).toFixed(1);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Alert Banner when Limit Reached */}
      {isLimitReached && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-red-500/80 bg-gradient-to-r from-red-950/90 via-red-900/80 to-red-950/90 p-4 text-center shadow-xl shadow-red-500/30 backdrop-blur-md"
        >
          <div className="flex items-center justify-center gap-2 text-lg font-black tracking-wide text-white">
            <AlertTriangle className="h-6 w-6 text-amber-300 drop-shadow" />
            <span>CHANGE FILTER</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-red-200">
            {targetLiters}L limit reached! Replace filter cartridge and tap Reset below.
          </p>
        </motion.div>
      )}

      {/* Target Capacity Pill Bar */}
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="font-bold uppercase tracking-wider text-slate-400">Target Capacity</span>
        <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-[#0a1120] p-1">
          {[1500, 3000].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onUpdateTarget(t)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                targetLiters === t
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}L
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const custom = window.prompt(
                'Enter custom filter capacity in Liters (e.g. 200, 450, 5000):',
                targetLiters.toString()
              );
              if (custom) {
                const val = parseInt(custom, 10);
                if (!isNaN(val) && val > 0) onUpdateTarget(val);
              }
            }}
            className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
              targetLiters !== 1500 && targetLiters !== 3000
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {targetLiters !== 1500 && targetLiters !== 3000 ? `${targetLiters}L` : 'Custom'}
          </button>
        </div>
      </div>

      {/* Modern Liquid Wave Gauge */}
      <div className="relative">
        <TapSplashEffect splash={splash} />
        <LiquidWaveGauge
          currentLiters={currentLiters}
          targetLiters={targetLiters}
          remainingLiters={remainingLiters}
          percentage={percentage}
          isLimitReached={isLimitReached}
          isWarning={isWarning}
        />
      </div>

      {/* Person Selector Component: Who is bringing the water? */}
      <PersonSelector
        people={people}
        selectedPerson={selectedPerson}
        onSelectPerson={onSelectPerson}
        onAddPerson={onAddPerson}
        onRenamePerson={onRenamePerson}
      />

      {/* Big Action Button (One Big Thumb Button) with Ripple */}
      <div className="relative flex flex-col gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => handleFill(5, '5L Container')}
          className="relative flex h-20 w-full items-center justify-center gap-3 overflow-hidden rounded-3xl border border-sky-400/30 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-700 text-xl font-black text-white shadow-xl shadow-sky-600/35 transition-all hover:brightness-105 active:shadow-md"
        >
          {/* Subtle water shimmer overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/20" />
          <Droplets className="h-7 w-7 text-white drop-shadow-md" />
          <div className="flex flex-col items-start leading-tight">
            <span>I filled 5L</span>
            <span className="text-[11px] font-bold text-sky-200">
              Logged as: {selectedPerson || 'Me'}
            </span>
          </div>
        </motion.button>

        {/* Quick Presets row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { vol: 1, label: '1L Mug/Bottle' },
            { vol: 2, label: '2L Pitcher' },
            { vol: 10, label: '10L Jug' },
          ].map((item) => (
            <motion.button
              key={item.vol}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => handleFill(item.vol, item.label)}
              className="flex flex-col items-center justify-center rounded-2xl border border-slate-700/60 bg-[#0e1626]/80 py-2.5 text-xs font-bold text-slate-200 shadow-sm backdrop-blur-sm transition hover:border-sky-500/40 active:bg-sky-950"
            >
              <div className="flex items-center gap-1 text-sky-400">
                <Plus className="h-3 w-3" />
                <span className="text-sm font-black text-white">{item.vol}L</span>
              </div>
              <span className="text-[10px] text-slate-400">{item.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Undo Action Button */}
        {showUndo && (
          <motion.button
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            type="button"
            onClick={onUndoLastTap}
            className="flex items-center justify-center gap-1.5 py-1 text-xs font-bold text-amber-300 transition hover:text-amber-200 active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>
              Undo last {lastTapVolume}L tap by {lastTapPerson || 'Me'} ({secondsRemaining}s)
            </span>
          </motion.button>
        )}
      </div>

      {/* Cycle Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-slate-800/80 bg-[#0c1424]/80 p-3.5 backdrop-blur-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Active Cycle Start
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-white">
            <Calendar className="h-3.5 w-3.5 text-sky-400" />
            <span>{formatDate(activeCycle?.startDate)}</span>
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500">
            {cycleDays} day{cycleDays === 1 ? '' : 's'} on this cartridge
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#0c1424]/80 p-3.5 backdrop-blur-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Fills
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-base font-black text-white">{totalFills} taps</span>
            <span className="rounded-full bg-sky-950 px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-600/30">
              ~{dailyAverage} L/d
            </span>
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500">
            {activeCycle?.name || 'Active Filter'}
          </div>
        </div>
      </div>

      {/* Reset Filter Button */}
      <div className="flex flex-col gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onOpenResetModal}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 py-3 text-xs font-bold text-red-300 transition hover:bg-red-500/20 active:scale-[0.98]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset for New Filter (Date & Capacity)</span>
        </motion.button>

        <button
          type="button"
          onClick={onNavigateToDashboard}
          className="flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-slate-400 hover:text-sky-300"
        >
          <Layers className="h-3.5 w-3.5 text-sky-400" />
          <span>Manage entries or see who brought water →</span>
        </button>
      </div>
    </div>
  );
};
