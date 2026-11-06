import React from 'react';
import { Calendar, RotateCcw, Pencil, CheckCircle2, History, Layers } from 'lucide-react';
import { FilterCycle, FilterEntry } from '../types';

interface CycleManagerProps {
  cycles: FilterCycle[];
  entries: FilterEntry[];
  activeCycleId: string;
  onOpenResetModal: () => void;
  onOpenEditCycleModal: (cycle: FilterCycle) => void;
}

export const CycleManager: React.FC<CycleManagerProps> = ({
  cycles,
  entries,
  activeCycleId,
  onOpenResetModal,
  onOpenEditCycleModal,
}) => {
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Active Now';
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

  const getCycleStats = (cycle: FilterCycle) => {
    const cycleEntries = entries.filter((e) => e.cycleId === cycle.id);
    const totalVolume = cycleEntries.reduce((acc, curr) => acc + curr.volume, 0);

    const startTime = new Date(cycle.startDate).getTime();
    const endTime = cycle.endDate ? new Date(cycle.endDate).getTime() : Date.now();
    const durationDays = Math.max(1, Math.round((endTime - startTime) / (1000 * 60 * 60 * 24)));
    const avgPerDay = (totalVolume / durationDays).toFixed(1);

    return {
      totalVolume,
      entryCount: cycleEntries.length,
      durationDays,
      avgPerDay,
    };
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Filter Replacement Cycles</h2>
          <p className="text-xs text-slate-400">
            View cycles, modify start/replacement dates, and review historical filter life
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenResetModal}
          className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-600/20 px-3 py-2 text-xs font-bold text-red-300 shadow-sm transition active:scale-95 hover:bg-red-600/30"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>New Reset</span>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {cycles.map((cycle) => {
          const isActive = cycle.id === activeCycleId && cycle.status === 'active';
          const stats = getCycleStats(cycle);
          const percentUsed = Math.min(100, Math.round((stats.totalVolume / cycle.targetLiters) * 100));

          return (
            <div
              key={cycle.id}
              className={`rounded-2xl border p-4 shadow-md transition ${
                isActive
                  ? 'border-sky-500/40 bg-[#131f36]'
                  : 'border-slate-800 bg-[#131c2e]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-white">{cycle.name}</h3>
                    {isActive ? (
                      <span className="flex items-center gap-1 rounded-full bg-sky-500/20 border border-sky-400/30 px-2 py-0.5 text-[10px] font-bold text-sky-300 uppercase">
                        <CheckCircle2 className="h-3 w-3" /> Active Filter
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        Archived Cycle
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-sky-400" />
                    <span>
                      {formatDate(cycle.startDate)} → {formatDate(cycle.endDate)}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span>{stats.durationDays} days</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenEditCycleModal(cycle)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-sky-300 active:scale-95"
                  title="Modify cycle start/end dates or target capacity"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              {/* Progress and Metrics */}
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[#0b121e] p-2.5 text-center">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Filtered</div>
                  <div className="mt-0.5 text-sm font-black text-white">
                    {stats.totalVolume} / {cycle.targetLiters}L
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Usage</div>
                  <div
                    className={`mt-0.5 text-sm font-black ${
                      percentUsed >= 100 ? 'text-red-400' : 'text-sky-400'
                    }`}
                  >
                    {percentUsed}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Daily Avg</div>
                  <div className="mt-0.5 text-sm font-black text-white">
                    {stats.avgPerDay} L/d
                  </div>
                </div>
              </div>

              {cycle.notes && (
                <div className="mt-2.5 text-xs text-slate-400 italic">
                  Note: {cycle.notes}
                </div>
              )}
              {cycle.resetReason && (
                <div className="mt-1 text-[11px] text-slate-500">
                  Reset Reason: {cycle.resetReason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
