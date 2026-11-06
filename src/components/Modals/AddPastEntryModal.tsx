import React, { useState } from 'react';
import { PlusCircle, X, Calendar, Clock, User } from 'lucide-react';
import { FilterCycle } from '../../types';

interface AddPastEntryModalProps {
  isOpen: boolean;
  cycles: FilterCycle[];
  activeCycleId: string;
  people: string[];
  defaultPerson?: string;
  onClose: () => void;
  onAddEntry: (
    volume: number,
    options: {
      timestamp: string;
      cycleId: string;
      person?: string;
      note?: string;
      source: 'retroactive';
    }
  ) => void;
}

export const AddPastEntryModal: React.FC<AddPastEntryModalProps> = ({
  isOpen,
  cycles,
  activeCycleId,
  people,
  defaultPerson = 'Me',
  onClose,
  onAddEntry,
}) => {
  const [date, setDate] = useState(() => {
    const d = new Date(Date.now() - 86400000);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('12:00');
  const [volume, setVolume] = useState<number>(5);
  const [person, setPerson] = useState(defaultPerson || 'Me');
  const [note, setNote] = useState('');
  const [cycleId, setCycleId] = useState(activeCycleId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let timestamp: string;
    try {
      const [y, m, d] = date.split('-').map(Number);
      const [hours, mins] = time.split(':').map(Number);
      const dateObj = new Date(y, m - 1, d, hours, mins, 0);
      timestamp = dateObj.toISOString();
    } catch {
      timestamp = new Date().toISOString();
    }

    onAddEntry(Number(volume) || 5, {
      timestamp,
      cycleId: cycleId || activeCycleId,
      person: person.trim() || undefined,
      note: note.trim() || undefined,
      source: 'retroactive',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-[#0e172a] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Log Past / Retroactive Entry</h3>
              <p className="text-xs text-slate-400">Record water filtered on an earlier date</p>
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

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
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
            <label className="text-xs font-bold text-slate-300">When was this water filtered?</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-sky-400" /> Date
                </label>
                <input
                  type="date"
                  required
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
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-0.5 w-full rounded-xl border border-slate-700 bg-[#070d18] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Volume Preset and Input */}
          <div>
            <label className="text-xs font-bold text-slate-300">Volume (Liters)</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="0.1"
                required
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-[#070d18] px-3 py-2 text-sm font-bold text-white focus:border-sky-500 focus:outline-none"
              />
              <span className="text-sm font-extrabold text-sky-400">L</span>
            </div>
            {/* Quick volume buttons */}
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {[1, 2, 5, 10].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVolume(v)}
                  className={`rounded-xl py-1 text-xs font-bold transition ${
                    volume === v
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  +{v}L
                </button>
              ))}
            </div>
          </div>

          {/* Assigned Cycle */}
          <div>
            <label className="text-xs font-bold text-slate-300">Assign to Cycle</label>
            <select
              value={cycleId}
              onChange={(e) => setCycleId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-[#070d18] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.id === activeCycleId ? '(Current Active)' : '(Archived)'}
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
              placeholder="e.g. Forgot to log yesterday's pitcher fill"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-[#070d18] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:brightness-110 active:scale-95"
            >
              Save Past Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
