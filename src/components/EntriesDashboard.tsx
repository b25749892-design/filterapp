import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Search,
  PlusCircle,
  Pencil,
  Trash2,
  BarChart2,
  CalendarCheck2,
  User,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FilterCycle, FilterEntry } from '../types';

interface EntriesDashboardProps {
  entries: FilterEntry[];
  cycles: FilterCycle[];
  activeCycle: FilterCycle | null;
  currentLiters: number;
  people: string[];
  onOpenAddPastModal: () => void;
  onOpenEditModal: (entry: FilterEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}

export const EntriesDashboard: React.FC<EntriesDashboardProps> = ({
  entries,
  cycles,
  activeCycle,
  currentLiters,
  people,
  onOpenAddPastModal,
  onOpenEditModal,
  onDeleteEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<
    'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  >('all');
  const [customDate, setCustomDate] = useState('');
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<string>('all');

  // Map cycles for quick lookup
  const cycleMap = useMemo(() => {
    return new Map(cycles.map((c) => [c.id, c.name]));
  }, [cycles]);

  // Calculate high-level metrics
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 7 * 86400000;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const metrics = useMemo(() => {
    let todayVol = 0;
    let weekVol = 0;
    let totalVol = 0;

    for (const e of entries) {
      const t = new Date(e.timestamp).getTime();
      totalVol += e.volume;
      if (t >= todayStart) todayVol += e.volume;
      if (t >= weekStart) weekVol += e.volume;
    }

    const dailyRate = weekVol / 7;
    const target = activeCycle?.targetLiters || 1500;
    const remaining = Math.max(0, target - currentLiters);
    const daysRemaining = dailyRate > 0 ? Math.round(remaining / dailyRate) : null;

    return {
      todayVol,
      weekVol,
      totalVol,
      dailyRate: dailyRate.toFixed(1),
      daysRemaining,
    };
  }, [entries, todayStart, weekStart, activeCycle, currentLiters]);

  // Breakdown of water brought by each person
  const personBreakdown = useMemo(() => {
    const counts: Record<string, { volume: number; fills: number }> = {};
    let total = 0;

    for (const e of entries) {
      const person = e.person || 'Unspecified';
      if (!counts[person]) counts[person] = { volume: 0, fills: 0 };
      counts[person].volume += e.volume;
      counts[person].fills += 1;
      total += e.volume;
    }

    const list = Object.entries(counts).map(([person, data]) => ({
      person,
      volume: data.volume,
      fills: data.fills,
      percentage: total > 0 ? Math.round((data.volume / total) * 100) : 0,
    }));

    // Sort by highest volume first
    list.sort((a, b) => b.volume - a.volume);
    return { list, total };
  }, [entries]);

  // Last 7 days breakdown for mini bar chart
  const last7DaysChart = useMemo(() => {
    const days: { label: string; dateStr: string; volume: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart - i * 86400000);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86400000;
      const label = i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' });
      const dateStr = d.toISOString().split('T')[0];

      let vol = 0;
      for (const e of entries) {
        const t = new Date(e.timestamp).getTime();
        if (t >= dayStart && t < dayEnd) {
          vol += e.volume;
        }
      }
      days.push({ label, dateStr, volume: vol });
    }
    const maxVol = Math.max(10, ...days.map((d) => d.volume));
    return { days, maxVol };
  }, [entries, todayStart]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const t = new Date(entry.timestamp).getTime();

      // Range check
      if (dateRangeFilter === 'today' && t < todayStart) return false;
      if (dateRangeFilter === 'yesterday' && (t < yesterdayStart || t >= todayStart)) return false;
      if (dateRangeFilter === 'week' && t < weekStart) return false;
      if (dateRangeFilter === 'month' && t < monthStart) return false;
      if (dateRangeFilter === 'custom' && customDate) {
        const entryDate = entry.timestamp.split('T')[0];
        if (entryDate !== customDate) return false;
      }

      // Person check
      if (selectedPersonFilter !== 'all') {
        const p = entry.person || 'Unspecified';
        if (p !== selectedPersonFilter) return false;
      }

      // Search check
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const personMatch = entry.person?.toLowerCase().includes(q);
        const noteMatch = entry.note?.toLowerCase().includes(q);
        const volumeMatch = entry.volume.toString().includes(q);
        const cycleMatch = cycleMap.get(entry.cycleId)?.toLowerCase().includes(q);
        const dateMatch = new Date(entry.timestamp).toLocaleDateString().includes(q);
        if (!personMatch && !noteMatch && !volumeMatch && !cycleMatch && !dateMatch) return false;
      }

      return true;
    });
  }, [
    entries,
    dateRangeFilter,
    todayStart,
    yesterdayStart,
    weekStart,
    monthStart,
    customDate,
    selectedPersonFilter,
    searchTerm,
    cycleMap,
  ]);

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return {
        date: d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        time: d.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    } catch {
      return { date: 'Invalid Date', time: '' };
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* Top Action & Headline */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Entry Management Dashboard</h2>
          <p className="text-xs text-slate-400">
            View, retroactively add, and adjust past historical records
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddPastModal}
          className="flex items-center gap-1.5 rounded-2xl border border-sky-400/40 bg-gradient-to-r from-sky-600 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-sky-600/30 transition active:scale-95 hover:brightness-110"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Past Entry</span>
        </button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-slate-800/80 bg-[#0c1424]/80 p-3 text-center backdrop-blur-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today</div>
          <div className="mt-0.5 text-lg font-black text-white">{metrics.todayVol} L</div>
          <div className="text-[10px] text-sky-400 font-semibold">Recorded</div>
        </div>
        <div className="rounded-2xl border border-slate-800/80 bg-[#0c1424]/80 p-3 text-center backdrop-blur-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            7-Day Rate
          </div>
          <div className="mt-0.5 text-lg font-black text-white">~{metrics.dailyRate} L</div>
          <div className="text-[10px] text-slate-400 font-semibold">Per Day</div>
        </div>
        <div className="rounded-2xl border border-slate-800/80 bg-[#0c1424]/80 p-3 text-center backdrop-blur-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Estimate
          </div>
          <div className="mt-0.5 text-lg font-black text-amber-300">
            {metrics.daysRemaining !== null ? `~${metrics.daysRemaining}d` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Until Replace</div>
        </div>
      </div>

      {/* Who Brought the Water Leaderboard & Stats */}
      {personBreakdown.list.length > 0 && (
        <div className="rounded-2xl border border-sky-500/20 bg-[#0c1424]/90 p-3.5 backdrop-blur-md shadow-md">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Award className="h-4 w-4 text-amber-400" />
              <span>Water Brought by Person</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Total: <strong className="text-white">{personBreakdown.total}L</strong>
            </span>
          </div>

          {/* Stacked multi-color progress bar */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900 flex mb-3">
            {personBreakdown.list.map((item, idx) => {
              const colors = [
                'bg-sky-400',
                'bg-blue-500',
                'bg-emerald-400',
                'bg-amber-400',
                'bg-purple-400',
              ];
              const color = colors[idx % colors.length];
              return (
                <div
                  key={item.person}
                  style={{ width: `${item.percentage}%` }}
                  className={`h-full ${color}`}
                  title={`${item.person}: ${item.volume}L (${item.percentage}%)`}
                />
              );
            })}
          </div>

          {/* Individual person cards */}
          <div className="flex flex-wrap gap-2">
            {personBreakdown.list.map((item, idx) => {
              const isSelected = selectedPersonFilter === item.person;
              return (
                <button
                  key={item.person}
                  type="button"
                  onClick={() =>
                    setSelectedPersonFilter(isSelected ? 'all' : item.person)
                  }
                  className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-all active:scale-95 ${
                    isSelected
                      ? 'border-sky-400 bg-sky-500/20 text-white shadow-md'
                      : 'border-slate-800 bg-[#070d18] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-sky-300">
                    {item.person.charAt(0).toUpperCase()}
                  </span>
                  <div className="text-left">
                    <div className="font-extrabold text-white">{item.person}</div>
                    <div className="text-[10px] text-slate-400">
                      {item.volume}L ({item.fills} fills) • {item.percentage}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 7-Day Bar Chart */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0c1424]/80 p-3.5 backdrop-blur-md">
        <div className="mb-2.5 flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4 text-sky-400" />
            <span>Daily Consumption (Last 7 Days)</span>
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            7d Total: <strong className="text-white">{metrics.weekVol}L</strong>
          </span>
        </div>

        <div className="flex h-24 items-end gap-2 pt-2">
          {last7DaysChart.days.map((day, idx) => {
            const heightPercent = Math.max(8, Math.round((day.volume / last7DaysChart.maxVol) * 100));
            const isToday = idx === last7DaysChart.days.length - 1;

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => {
                  setDateRangeFilter('custom');
                  setCustomDate(day.dateStr);
                }}
                className="group flex flex-1 flex-col items-center gap-1.5 focus:outline-none"
                title={`${day.label}: ${day.volume} L`}
              >
                <span className="text-[9px] font-bold text-slate-400 group-hover:text-sky-300">
                  {day.volume > 0 ? `${day.volume}L` : ''}
                </span>
                <div className="relative flex h-14 w-full items-end justify-center rounded-xl bg-[#070d18] p-0.5">
                  <div
                    className={`w-full rounded-lg transition-all duration-300 ${
                      isToday
                        ? 'bg-gradient-to-t from-sky-600 to-sky-400 shadow-md shadow-sky-500/40'
                        : day.volume > 0
                        ? 'bg-gradient-to-t from-slate-600 to-sky-500'
                        : 'bg-slate-800/40'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold ${
                    isToday ? 'font-bold text-sky-400' : 'text-slate-400'
                  }`}
                >
                  {day.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0c1424]/80 p-3 backdrop-blur-md">
        {/* Date Range Chips */}
        <div className="flex flex-wrap gap-1.5 pb-2">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'Last 7 Days' },
            { id: 'month', label: 'This Month' },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setDateRangeFilter(chip.id as any)}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold transition active:scale-95 ${
                dateRangeFilter === chip.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {chip.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDateRangeFilter('custom')}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition active:scale-95 ${
              dateRangeFilter === 'custom'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <CalendarCheck2 className="h-3 w-3" />
            <span>Pick Date</span>
          </button>
        </div>

        {/* Filter by Person Chip Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-0.5">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Person:</span>
          <button
            type="button"
            onClick={() => setSelectedPersonFilter('all')}
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
              selectedPersonFilter === 'all'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            All People
          </button>
          {people.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPersonFilter(p)}
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
                selectedPersonFilter === p
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {dateRangeFilter === 'custom' && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-[#070d18] p-2">
            <span className="text-xs font-semibold text-slate-400">Filter specific day:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search entries (person, note, volume, or date)..."
            className="w-full rounded-xl border border-slate-700/80 bg-[#070d18] py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Entries List Header */}
      <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-400">
        <span>
          Showing {filteredEntries.length} of {entries.length} Records
        </span>
        {(dateRangeFilter !== 'all' || searchTerm || selectedPersonFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setDateRangeFilter('all');
              setSearchTerm('');
              setCustomDate('');
              setSelectedPersonFilter('all');
            }}
            className="text-sky-400 hover:underline"
          >
            Reset All Filters
          </button>
        )}
      </div>

      {/* List of Entries */}
      <div className="flex flex-col gap-2">
        {filteredEntries.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#0c1424]/60 py-10 text-center">
            <Calendar className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-2 text-sm font-bold text-slate-300">No records found</p>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your filter or tap "Add Past Entry" to log water
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const { date, time } = formatDateTime(entry.timestamp);
            const cycleName = cycleMap.get(entry.cycleId) || 'Filter Cycle';
            const personName = entry.person || 'Me';

            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-[#0c1424]/90 p-3 shadow-md backdrop-blur-sm transition hover:border-slate-700"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-sky-950/80 border border-sky-400/30 px-2.5 py-1.5 text-center shadow-sm">
                    <span className="text-sm font-black text-sky-300">+{entry.volume}</span>
                    <span className="text-[10px] font-bold text-sky-400 uppercase">Liters</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white">{date}</span>
                      <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>{time}</span>
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {/* Person Pill */}
                      <span className="flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-400/30 px-2 py-0.5 text-[10px] font-extrabold text-sky-300">
                        <User className="h-3 w-3 text-sky-400" />
                        <span>{personName}</span>
                      </span>

                      <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                        {cycleName}
                      </span>
                      {entry.note && (
                        <span className="text-[11px] text-slate-400 italic">“{entry.note}”</span>
                      )}
                      {entry.source === 'retroactive' && (
                        <span className="rounded bg-amber-950/70 border border-amber-600/30 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                          Retroactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit and Delete Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(entry)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-sky-300 active:scale-95"
                    title="Edit date, time, volume, person, or note"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEntry(entry.id)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-red-950/50 hover:text-red-400 active:scale-95"
                    title="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
