import React, { useState } from 'react';
import { RotateCcw, Calendar, Check, X, AlertCircle } from 'lucide-react';

interface ResetFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (options: {
    customResetDate?: string;
    newTargetLiters: number;
    newCycleName: string;
    resetReason?: string;
  }) => void;
  defaultTarget: number;
  currentCycleCount: number;
}

export const ResetFilterModal: React.FC<ResetFilterModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  defaultTarget,
  currentCycleCount,
}) => {
  const [resetType, setResetType] = useState<'now' | 'custom'>('now');
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customTime, setCustomTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [targetLiters, setTargetLiters] = useState(defaultTarget || 1500);
  const [cycleName, setCycleName] = useState(`Filter #${currentCycleCount + 1}`);
  const [reason, setReason] = useState('Standard filter cartridge replacement');

  if (!isOpen) return null;

  const handleConfirm = () => {
    let finalResetDate: string | undefined = undefined;
    if (resetType === 'custom') {
      try {
        const [year, month, day] = customDate.split('-').map(Number);
        const [hours, mins] = customTime.split(':').map(Number);
        const dateObj = new Date(year, month - 1, day, hours, mins, 0);
        finalResetDate = dateObj.toISOString();
      } catch {
        finalResetDate = new Date().toISOString();
      }
    }

    onConfirmReset({
      customResetDate: finalResetDate,
      newTargetLiters: Number(targetLiters) || 1500,
      newCycleName: cycleName.trim() || `Filter #${currentCycleCount + 1}`,
      resetReason: reason,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#162032] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Reset for New Filter</h3>
              <p className="text-xs text-slate-400">Archive current cycle & start fresh</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3.5">
          {/* Reset Date Mode Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300">Replacement Date & Time</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResetType('now')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                  resetType === 'now'
                    ? 'border-sky-500 bg-sky-600/30 text-white'
                    : 'border-slate-800 bg-[#0b121e] text-slate-400 hover:text-white'
                }`}
              >
                <Check className={`h-3.5 w-3.5 ${resetType === 'now' ? 'opacity-100' : 'opacity-0'}`} />
                <span>Reset Right Now</span>
              </button>
              <button
                type="button"
                onClick={() => setResetType('custom')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                  resetType === 'custom'
                    ? 'border-sky-500 bg-sky-600/30 text-white'
                    : 'border-slate-800 bg-[#0b121e] text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Custom Past Date</span>
              </button>
            </div>
          </div>

          {/* Custom Date Pickers if selected */}
          {resetType === 'custom' && (
            <div className="rounded-xl border border-sky-500/30 bg-[#0b121e] p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Retroactive Replacement Date</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Did you swap the filter a few days ago? Set the exact date here. Water logged since
                that date will transfer to this new cycle.
              </p>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400">Date</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400">Time</label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* New Cycle Target Capacity */}
          <div>
            <label className="text-xs font-bold text-slate-300">New Filter Capacity</label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {[1500, 3000, 450].map((liters) => (
                <button
                  key={liters}
                  type="button"
                  onClick={() => setTargetLiters(liters)}
                  className={`rounded-xl border py-2 text-xs font-bold transition ${
                    targetLiters === liters
                      ? 'border-sky-500 bg-sky-600/30 text-white'
                      : 'border-slate-800 bg-[#0b121e] text-slate-400 hover:text-white'
                  }`}
                >
                  {liters} L
                </button>
              ))}
            </div>
          </div>

          {/* Cycle Label */}
          <div>
            <label className="text-xs font-bold text-slate-300">Cycle Name / Model</label>
            <input
              type="text"
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value)}
              placeholder="e.g. Brita Standard, Filter #2"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0b121e] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="text-xs font-bold text-slate-300">Reason / Notes (Optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Taste degraded, replaced with OEM"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0b121e] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 active:scale-95"
          >
            Confirm Reset
          </button>
        </div>
      </div>
    </div>
  );
};
