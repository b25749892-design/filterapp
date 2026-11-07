import React, { useState } from 'react';
import {
  ShieldCheck,
  HardDrive,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Copy,
  Check,
  Smartphone,
  Vibrate,
  Users,
  Plus,
  X,
  Package,
  Pencil,
  Sparkles,
  FileCode2,
} from 'lucide-react';
import { AppSettings, FilterCycle, FilterEntry } from '../types';

interface SettingsScreenProps {
  settings: AppSettings;
  cycles: FilterCycle[];
  entries: FilterEntry[];
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExportBackup: () => void;
  onRestoreBackupFile: (file: File) => void;
  onExportCSV: () => void;
  onFactoryReset: () => void;
  onShowToast: (msg: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  cycles,
  entries,
  onUpdateSettings,
  onExportBackup,
  onRestoreBackupFile,
  onExportCSV,
  onFactoryReset,
  onShowToast,
}) => {
  const [appNameInput, setAppNameInput] = useState(settings.appName || 'FilterTap');
  const [newPersonInput, setNewPersonInput] = useState('');
  const [editingPerson, setEditingPerson] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const handleSaveAppName = (e: React.FormEvent) => {
    e.preventDefault();
    if (appNameInput.trim()) {
      onUpdateSettings({ ...settings, appName: appNameInput.trim() });
      onShowToast(`App name updated to "${appNameInput.trim()}"!`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onRestoreBackupFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPersonInput.trim();
    if (!trimmed) return;
    if (settings.savedPeople.includes(trimmed)) {
      onShowToast(`${trimmed} already exists.`);
      return;
    }
    const updated = [...settings.savedPeople, trimmed];
    onUpdateSettings({ ...settings, savedPeople: updated });
    setNewPersonInput('');
    onShowToast(`Added ${trimmed} to water bringers.`);
  };

  const handleSaveRenamePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson || !renameValue.trim()) return;
    const newName = renameValue.trim();
    const updated = settings.savedPeople.map((p) => (p === editingPerson ? newName : p));
    const newLast = settings.lastSelectedPerson === editingPerson ? newName : settings.lastSelectedPerson;
    onUpdateSettings({ ...settings, savedPeople: updated, lastSelectedPerson: newLast });
    setEditingPerson(null);
    onShowToast(`Renamed ${editingPerson} to ${newName}.`);
  };

  const handleRemovePerson = (personName: string) => {
    if (settings.savedPeople.length <= 1) {
      onShowToast('Must have at least one person name.');
      return;
    }
    const updated = settings.savedPeople.filter((p) => p !== personName);
    const newLast = settings.lastSelectedPerson === personName ? updated[0] : settings.lastSelectedPerson;
    onUpdateSettings({ ...settings, savedPeople: updated, lastSelectedPerson: newLast });
    onShowToast(`Removed ${personName}.`);
  };


  return (
    <div className="flex flex-col gap-4">
      {/* Customizable App / Station Name */}
      <div className="rounded-3xl border border-sky-500/25 bg-[#0c1424]/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Pencil className="h-5 w-5 text-sky-400" />
          <h3 className="text-sm font-extrabold text-white">Customize Station & App Name</h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Personalize the header name for your household filter, pitcher, or office water station.
        </p>

        <form onSubmit={handleSaveAppName} className="mt-3 flex gap-2">
          <input
            type="text"
            value={appNameInput}
            onChange={(e) => setAppNameInput(e.target.value)}
            placeholder="e.g. Kitchen Brita, Home RO Station..."
            className="flex-1 rounded-2xl border border-slate-700 bg-[#070d18] px-3.5 py-2 text-xs font-bold text-white focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Save Name</span>
          </button>
        </form>

        {/* Quick Name Presets */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {['FilterTap', 'Kitchen Brita', 'Under-Sink RO', 'Office Cooler', 'Berkey Gravity'].map(
            (preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAppNameInput(preset);
                  onUpdateSettings({ ...settings, appName: preset });
                  onShowToast(`Name set to "${preset}"`);
                }}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  settings.appName === preset
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {preset}
              </button>
            )
          )}
        </div>
      </div>

      {/* Household / People Manager with Rename Support */}
      <div className="rounded-3xl border border-slate-800 bg-[#0c1424]/90 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-400" />
            <h3 className="text-sm font-extrabold text-white">Household Water Bringers</h3>
          </div>
          <span className="text-xs text-slate-400">
            {settings.savedPeople.length} People
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Customize member names or add family and roommates who bring water.
        </p>

        {/* People list chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {settings.savedPeople.map((person) => {
            if (editingPerson === person) {
              return (
                <form
                  key={person}
                  onSubmit={handleSaveRenamePerson}
                  className="flex items-center gap-1 rounded-full border border-sky-400 bg-slate-900 p-0.5"
                >
                  <input
                    type="text"
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="w-20 rounded-full bg-transparent px-2.5 py-0.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-sky-600 p-1 text-white hover:bg-sky-500"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPerson(null)}
                    className="rounded-full bg-slate-800 p-1 text-slate-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </form>
              );
            }

            return (
              <div
                key={person}
                className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-[#070d18] px-3 py-1 text-xs font-bold text-white shadow-sm"
              >
                <span>{person}</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPerson(person);
                    setRenameValue(person);
                  }}
                  className="text-slate-400 hover:text-sky-300"
                  title={`Rename ${person}`}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemovePerson(person)}
                  className="text-slate-400 hover:text-red-400"
                  title={`Remove ${person}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add Person form */}
        <form onSubmit={handleAddPerson} className="mt-3 flex gap-2">
          <input
            type="text"
            value={newPersonInput}
            onChange={(e) => setNewPersonInput(e.target.value)}
            placeholder="Add new person (e.g. Sister, Roommate)..."
            className="flex-1 rounded-2xl border border-slate-700 bg-[#070d18] px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1 rounded-2xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-sky-500 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Local-Only Privacy Guarantee */}
      <div className="rounded-3xl border border-slate-800 bg-[#0c1424]/90 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h3 className="text-sm font-extrabold text-white">Local-Only Offline Storage</h3>
        </div>
        <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
          FilterTap operates entirely on your device using IndexedDB and Service Worker caching.
          Your water consumption logs, timestamps, notes, and filter replacement dates never leave
          your device.
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-2xl bg-[#070d18] p-2">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Cycles</div>
            <div className="mt-0.5 text-sm font-bold text-white">{cycles.length}</div>
          </div>
          <div className="rounded-2xl bg-[#070d18] p-2">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Log Records</div>
            <div className="mt-0.5 text-sm font-bold text-white">{entries.length}</div>
          </div>
          <div className="rounded-2xl bg-[#070d18] p-2">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Network Calls</div>
            <div className="mt-0.5 text-sm font-bold text-emerald-400">0 (Zero)</div>
          </div>
        </div>
      </div>

      {/* Backup & Restore Controls */}
      <div className="rounded-3xl border border-slate-800 bg-[#0c1424]/90 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <HardDrive className="h-5 w-5 text-sky-400" />
          <h3 className="text-sm font-extrabold text-white">Backup & Data Portability</h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Save an offline JSON snapshot of your records or export to CSV spreadsheet.
        </p>

        <div className="mt-3.5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onExportBackup}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-500/30 bg-sky-500/10 py-2.5 text-xs font-bold text-sky-300 transition active:scale-98 hover:bg-sky-500/20"
          >
            <Download className="h-4 w-4" />
            <span>Download Local JSON Backup</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-bold text-slate-200 transition active:scale-98 hover:bg-slate-700"
          >
            <Upload className="h-4 w-4" />
            <span>Restore from Backup File</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={onExportCSV}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#070d18] py-2.5 text-xs font-bold text-slate-300 transition active:scale-98 hover:text-white"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Export Entries to CSV</span>
          </button>
        </div>
      </div>

      {/* App Preferences */}
      <div className="rounded-3xl border border-slate-800 bg-[#0c1424]/90 p-4 backdrop-blur-md">
        <h3 className="text-sm font-extrabold text-white">App Preferences</h3>

        <div className="mt-3 flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Vibrate className="h-4 w-4 text-sky-400" />
            <div>
              <div className="text-xs font-bold text-white">Haptic Vibration</div>
              <div className="text-[11px] text-slate-400">Tactile feel on tap and buttons</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.hapticsEnabled}
            onChange={(e) =>
              onUpdateSettings({ ...settings, hapticsEnabled: e.target.checked })
            }
            className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-sky-600 focus:ring-0"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">Default Filter Capacity</div>
            <div className="text-[11px] text-slate-400">Used for new cycle creation</div>
          </div>
          <select
            value={settings.defaultTargetLiters}
            onChange={(e) =>
              onUpdateSettings({
                ...settings,
                defaultTargetLiters: parseInt(e.target.value, 10),
              })
            }
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
          >
            <option value={1500}>1500 L</option>
            <option value={3000}>3000 L</option>
            <option value={450}>450 L</option>
            <option value={5000}>5000 L</option>
          </select>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-3xl border border-red-500/20 bg-red-950/20 p-4">
        <div className="flex items-center gap-2 text-red-400">
          <Trash2 className="h-4 w-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h3>
        </div>
        <p className="mt-1 text-xs text-red-300/80">
          Reset database to pristine state. All logs and past cycles will be deleted.
        </p>
        <button
          type="button"
          onClick={onFactoryReset}
          className="mt-3 w-full rounded-2xl border border-red-500/40 bg-red-600/30 py-2.5 text-xs font-bold text-red-200 transition active:scale-98 hover:bg-red-600/40"
        >
          Factory Reset Database
        </button>
      </div>
    </div>
  );
};
