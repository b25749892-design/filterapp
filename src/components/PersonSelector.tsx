import React, { useState } from 'react';
import { User, Plus, Check, X, Pencil } from 'lucide-react';
import { motion } from 'motion/react';

interface PersonSelectorProps {
  people: string[];
  selectedPerson: string;
  onSelectPerson: (person: string) => void;
  onAddPerson: (newPerson: string) => void;
  onRenamePerson?: (oldName: string, newName: string) => void;
}

export const PersonSelector: React.FC<PersonSelectorProps> = ({
  people,
  selectedPerson,
  onSelectPerson,
  onAddPerson,
  onRenamePerson,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [editingPerson, setEditingPerson] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersonName.trim()) {
      onAddPerson(newPersonName.trim());
      setNewPersonName('');
      setIsAdding(false);
    }
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPerson && editingNameValue.trim() && onRenamePerson) {
      onRenamePerson(editingPerson, editingNameValue.trim());
      setEditingPerson(null);
    }
  };

  const getAvatarGradient = (isSelected: boolean) => {
    if (isSelected) {
      return 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-sky-500/40 border-sky-300';
    }
    return 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:border-slate-600';
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-sky-500/20 bg-[#0c1424]/90 p-3 shadow-lg shadow-black/40 backdrop-blur-md">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-bold tracking-wide text-slate-300">
          <User className="h-3.5 w-3.5 text-sky-400" />
          <span>Person Bringing the 5L:</span>
        </span>
        <span className="rounded-full bg-sky-500/15 border border-sky-400/30 px-2.5 py-0.5 text-[11px] font-extrabold text-sky-300">
          {selectedPerson || 'Me'}
        </span>
      </div>

      {/* Avatar Pill List */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
        {people.map((person) => {
          const isSelected = person === selectedPerson;
          const initial = person.charAt(0).toUpperCase();

          if (editingPerson === person) {
            return (
              <form key={person} onSubmit={handleSaveRename} className="flex shrink-0 items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={editingNameValue}
                  onChange={(e) => setEditingNameValue(e.target.value)}
                  className="w-24 rounded-full border border-sky-500 bg-slate-900 px-3 py-1 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-white hover:bg-sky-500"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPerson(null)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            );
          }

          return (
            <div key={person} className="relative flex shrink-0 items-center">
              <motion.button
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => onSelectPerson(person)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-200 ${getAvatarGradient(
                  isSelected
                )}`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/30 text-[10px] font-black">
                  {initial}
                </span>
                <span>{person}</span>
                {isSelected && <Check className="h-3 w-3 text-sky-200" />}
              </motion.button>

              {onRenamePerson && isSelected && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPerson(person);
                    setEditingNameValue(person);
                  }}
                  className="ml-1 rounded-full p-1 text-slate-400 hover:text-sky-300"
                  title={`Rename ${person}`}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Person Chip */}
        {!isAdding ? (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-sky-500 hover:text-sky-300 active:scale-95"
            title="Add another person name"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        ) : (
          <form onSubmit={handleAddNew} className="flex shrink-0 items-center gap-1">
            <input
              type="text"
              autoFocus
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              placeholder="Name..."
              className="w-24 rounded-full border border-sky-500 bg-slate-900 px-3 py-1 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm hover:bg-sky-500"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
