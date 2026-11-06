import React, { useState, useEffect } from 'react';
import { Pencil, X, Calendar, Clock, Trash2, User } from 'lucide-react';
import { FilterCycle, FilterEntry } from '../../types';

interface EditEntryModalProps {
  entry: FilterEntry | null;
  cycles: FilterCycle[];
  people: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    entryId: string,
    updates: {
      timestamp: string;
      volume: number;
      person?: string;
      note?: string;
      cycleId?: string;
    }
  ) => void;
  onDelete: (entryId: string) => void;
}

export const EditEntryModal: React.FC<EditEntryModalProps> = ({
  entry,
  cycles,
  people,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [volume, setVolume] = useState<number>(5);
  const [person, setPerson] = useState('Me');
  const [note, setNote] = useState('');
  const [cycleId, setCycleId] = useState('');

  useEffect(() => {
    if (entry) {
      try {
        const d = new Date(entry.timestamp);
        setDate(d.toISOString().split('T')[0]);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        setTime(`${hh}:${mm}`);
      } catch {
        setDate(new Date().toISOString().split('T')[0]);
        setTime('12:00');
      }
      setVolume(entry.volume);
      setPerson(entry.person || 'Me');
      setNote(entry.note || '');
      setCycleId(entry.cycleId);
    }
  }, [entry]);

  if (!isOpen || !entry) return null;

  const handleSave = () => {
    let finalTimestamp = entry.timestamp;
    try {
      const [y, m, d] = date.split('-').map(Number);
      const [hours, mins] = time.split(':').map(Number);
      const dateObj = new Date(y, m - 1, d, hours, mins, 0);
      finalTimestamp = dateObj.toISOString();
    } catch {
      finalTimestamp = entry.timestamp;
    }

    onSave(entry.id, {
      timestamp: finalTimestamp,
      volume: Number(volume) || entry.volume,
      person: person.trim() || undefined,
      note: note.trim() || undefined,
      cycleId: cycleId || entry.cycleId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-[#0e172a] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Adjust Historical Entry</h3>
              <p className="text-xs text-slate-400">Modify recorded date, volume, person, or note</p>
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
          {/* Person Who Brought the Water */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-sky-400" />
              <span>Person Who Brought the Water</span>
            </label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {people.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPerson(p)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    person === p
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="Or enter custom name (e.g. Dad, Alex, Roommate)..."
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#070d18] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Date & Time Picker */}
          <div>
            <label className="text-xs font-bold text-slate-300">Recorded Date & Time</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-sky-400" /> Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-0.5 w-full rounded-xl border border-slate-700 bg-[#070d18] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-sky-400" /> Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-0.5 w-full rounded-xl border border-slate-700 bg-[#070d18] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Volume input */}
          <div>
            <label className="text-xs font-bold text-slate-300">Water Volume (Liters)</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-[#070d18] px-3 py-2 text-sm font-bold text-white focus:border-sky-500 focus:outline-none"
              />
              <span className="text-sm font-extrabold text-sky-400">Liters</span>
            </div>
            {/* Quick volume chips */}
            <div className="mt-1.5 flex gap-1.5">
              {[1, 2, 5, 10].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVolume(v)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                    volume === v
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {v}L
                </button>
              ))}
            </div>
          </div>

          {/* Filter Cycle assignment */}
          <div>
            <label className="text-xs font-bold text-slate-300">Assigned Filter Cycle</label>
            <select
              value={cycleId}
              onChange={(e) => setCycleId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-[#070d18] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.status === 'active' ? 'Active' : 'Archived'})
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-slate-300">Note / Purpose (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Kettle, Pitcher refill, Coffee maker"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-[#070d18] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/20 active:scale-95"
            title="Delete this entry permanently"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/30 hover:brightness-110 active:scale-95"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
