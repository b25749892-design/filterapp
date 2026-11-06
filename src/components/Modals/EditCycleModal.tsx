import React, { useState, useEffect } from 'react';
import { Layers, X, Calendar } from 'lucide-react';
import { FilterCycle } from '../../types';

interface EditCycleModalProps {
  cycle: FilterCycle | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    cycleId: string,
    updates: {
      name?: string;
      startDate?: string;
      endDate?: string | null;
      targetLiters?: number;
      notes?: string;
    }
  ) => void;
}

export const EditCycleModal: React.FC<EditCycleModalProps> = ({
  cycle,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [targetLiters, setTargetLiters] = useState<number>(1500);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (cycle) {
      setName(cycle.name);
      setStartDate(cycle.startDate ? cycle.startDate.split('T')[0] : '');
      setEndDate(cycle.endDate ? cycle.endDate.split('T')[0] : '');
      setIsCompleted(cycle.status === 'completed' || !!cycle.endDate);
      setTargetLiters(cycle.targetLiters || 1500);
      setNotes(cycle.notes || '');
    }
  }, [cycle]);

  if (!isOpen || !cycle) return null;

  const handleSave = () => {
    const finalStartDate = startDate ? new Date(startDate).toISOString() : cycle.startDate;
    const finalEndDate = isCompleted && endDate ? new Date(endDate).toISOString() : null;

    onSave(cycle.id, {
      name: name.trim() || cycle.name,
      startDate: finalStartDate,
      endDate: finalEndDate,
      targetLiters: Number(targetLiters) || cycle.targetLiters,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#162032] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Modify Filter Cycle Dates</h3>
              <p className="text-xs text-slate-400">Adjust cycle start or replacement dates</p>
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
          {/* Cycle Name */}
          <div>
            <label className="text-xs font-bold text-slate-300">Filter Name / Label</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0b121e] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-sky-400" />
              <span>Cycle Start Date</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0b121e] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Change when this filter was installed if you forgot to reset on the exact day.
            </p>
          </div>

          {/* End Date (if completed) */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Replacement / End Date</label>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={(e) => setIsCompleted(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-sky-600"
                />
                <span>Filter Replaced</span>
              </label>
            </div>
            {isCompleted && (
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0b121e] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            )}
          </div>

          {/* Target Capacity */}
          <div>
            <label className="text-xs font-bold text-slate-300">Target Capacity (Liters)</label>
            <input
              type="number"
              step="50"
              value={targetLiters}
              onChange={(e) => setTargetLiters(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0b121e] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-300">Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Brita MAXTRA+ filter, replaced early due to holiday guests"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-[#0b121e] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Action buttons */}
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
            onClick={handleSave}
            className="flex-1 rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/30 hover:bg-sky-500 active:scale-95"
          >
            Save Cycle Details
          </button>
        </div>
      </div>
    </div>
  );
};
