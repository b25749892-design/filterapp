/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Droplets,
  Layers,
  History,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, FilterCycle, FilterEntry, TabType } from './types';
import { storage } from './services/storage';
import { Header } from './components/Header';
import { MainTracker } from './components/MainTracker';
import { EntriesDashboard } from './components/EntriesDashboard';
import { CycleManager } from './components/CycleManager';
import { SettingsAndAndroid } from './components/SettingsAndAndroid';
import { ResetFilterModal } from './components/Modals/ResetFilterModal';
import { EditEntryModal } from './components/Modals/EditEntryModal';
import { AddPastEntryModal } from './components/Modals/AddPastEntryModal';
import { EditCycleModal } from './components/Modals/EditCycleModal';
import { AndroidKeyModal } from './components/Modals/AndroidKeyModal';
import { AndroidApkModal } from './components/Modals/AndroidApkModal';
import { InstallGuideModal } from './components/Modals/InstallGuideModal';
import { Toast } from './components/Toast';
import { usePWAInstall } from './hooks/usePWAInstall';

export default function App() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cycles, setCycles] = useState<FilterCycle[]>([]);
  const [entries, setEntries] = useState<FilterEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('tracker');

  // Track last tap for undo capability
  const [lastTapInfo, setLastTapInfo] = useState<{
    id: string;
    timestamp: number;
    volume: number;
    person?: string;
  } | null>(null);

  // Modals state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAddPastModalOpen, setIsAddPastModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FilterEntry | null>(null);
  const [editingCycle, setEditingCycle] = useState<FilterCycle | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Toast state
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { isIOS } = usePWAInstall();

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2400);
  }, []);

  const triggerVibrate = useCallback(
    (pattern: number | number[]) => {
      if (settings?.hapticsEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(pattern);
        } catch {
          // ignore
        }
      }
    },
    [settings?.hapticsEnabled]
  );

  // Load state from local storage on mount
  const refreshData = useCallback(async () => {
    const data = await storage.init();
    // Ensure savedPeople and lastSelectedPerson exist
    const safeSettings: AppSettings = {
      ...data.settings,
      savedPeople:
        data.settings.savedPeople && data.settings.savedPeople.length > 0
          ? data.settings.savedPeople
          : ['Me', 'Dad', 'Mom', 'Alex'],
      lastSelectedPerson: data.settings.lastSelectedPerson || 'Me',
    };
    setSettings(safeSettings);
    setCycles(data.cycles);
    setEntries(data.entries);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handle URL shortcut params (e.g. from PWA shortcuts)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'entries') {
      setActiveTab('dashboard');
    }
  }, []);

  // Compute active cycle
  const activeCycle = useMemo(() => {
    if (!settings) return null;
    return cycles.find((c) => c.id === settings.activeCycleId) || cycles[0] || null;
  }, [cycles, settings]);

  // Compute current cycle metrics
  const { currentLiters, totalFills } = useMemo(() => {
    if (!activeCycle) return { currentLiters: 0, totalFills: 0 };
    const cycleEntries = entries.filter((e) => e.cycleId === activeCycle.id);
    const currentLiters = cycleEntries.reduce((sum, e) => sum + e.volume, 0);
    return {
      currentLiters,
      totalFills: cycleEntries.length,
    };
  }, [activeCycle, entries]);

  // Actions: Person selection and addition
  const handleSelectPerson = async (person: string) => {
    if (!settings) return;
    const updated = { ...settings, lastSelectedPerson: person };
    setSettings(updated);
    await storage.saveSettings(updated);
    triggerVibrate(15);
  };

  const handleAddPerson = async (newPerson: string) => {
    if (!settings) return;
    const updatedList = settings.savedPeople.includes(newPerson)
      ? settings.savedPeople
      : [...settings.savedPeople, newPerson];
    const updated = {
      ...settings,
      savedPeople: updatedList,
      lastSelectedPerson: newPerson,
    };
    setSettings(updated);
    await storage.saveSettings(updated);
    showToast(`Added ${newPerson} to household members.`);
    triggerVibrate(20);
  };

  // Actions: Log volume (with person name)
  const handleLogVolume = async (volume: number, note?: string, personName?: string) => {
    if (!activeCycle) return;
    const person = personName || settings?.lastSelectedPerson || 'Me';
    const newEntry = await storage.addEntry(volume, activeCycle.id, {
      note,
      person,
      source: 'quick_tap',
    });

    setLastTapInfo({
      id: newEntry.id,
      timestamp: Date.now(),
      volume,
      person,
    });

    triggerVibrate(volume >= 5 ? [45, 30, 45] : 30);
    showToast(`+${volume}L logged by ${person}!`);
    await refreshData();
  };

  // Actions: Undo last tap
  const handleUndoLastTap = async () => {
    if (!lastTapInfo) return;
    const ok = await storage.deleteEntry(lastTapInfo.id);
    if (ok) {
      triggerVibrate(25);
      showToast(`Undone -${lastTapInfo.volume}L by ${lastTapInfo.person || 'Me'}`);
      setLastTapInfo(null);
      await refreshData();
    }
  };

  // Actions: Update active cycle target
  const handleUpdateTarget = async (newTarget: number) => {
    if (!activeCycle) return;
    await storage.updateCycle(activeCycle.id, { targetLiters: newTarget });
    if (settings) {
      await storage.saveSettings({ ...settings, defaultTargetLiters: newTarget });
    }
    triggerVibrate(25);
    showToast(`Filter target updated to ${newTarget}L`);
    await refreshData();
  };

  // Actions: Reset Cycle (Immediate or Retroactive)
  const handleConfirmReset = async (options: {
    customResetDate?: string;
    newTargetLiters: number;
    newCycleName: string;
    resetReason?: string;
  }) => {
    await storage.resetCycle(options);
    setIsResetModalOpen(false);
    setLastTapInfo(null);
    triggerVibrate([60, 40, 80]);
    showToast(`Filter reset! New cycle "${options.newCycleName}" started.`);
    await refreshData();
  };

  // Actions: Add Past / Retroactive Entry
  const handleAddPastEntry = async (
    volume: number,
    options: {
      timestamp: string;
      cycleId: string;
      person?: string;
      note?: string;
      source: 'retroactive';
    }
  ) => {
    await storage.addEntry(volume, options.cycleId, {
      timestamp: options.timestamp,
      person: options.person,
      note: options.note,
      source: 'retroactive',
    });
    setIsAddPastModalOpen(false);
    triggerVibrate(30);
    showToast(`Retroactive entry (+${volume}L by ${options.person || 'Me'}) saved!`);
    await refreshData();
  };

  // Actions: Save Entry Updates (Modify date, time, volume, person, note)
  const handleSaveEntryUpdates = async (
    entryId: string,
    updates: {
      timestamp: string;
      volume: number;
      person?: string;
      note?: string;
      cycleId?: string;
    }
  ) => {
    await storage.updateEntry(entryId, updates);
    setEditingEntry(null);
    triggerVibrate(30);
    showToast('Entry record updated.');
    await refreshData();
  };

  // Actions: Delete Entry
  const handleDeleteEntry = async (entryId: string) => {
    const ok = window.confirm('Are you sure you want to delete this historical entry?');
    if (!ok) return;
    await storage.deleteEntry(entryId);
    if (editingEntry?.id === entryId) setEditingEntry(null);
    triggerVibrate(25);
    showToast('Entry removed.');
    await refreshData();
  };

  // Actions: Save Cycle Updates
  const handleSaveCycleUpdates = async (
    cycleId: string,
    updates: {
      name?: string;
      startDate?: string;
      endDate?: string | null;
      targetLiters?: number;
      notes?: string;
    }
  ) => {
    await storage.updateCycle(cycleId, updates);
    setEditingCycle(null);
    triggerVibrate(30);
    showToast('Filter cycle dates & details updated.');
    await refreshData();
  };

  // Actions: Settings update
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    await storage.saveSettings(newSettings);
    setSettings(newSettings);
    showToast('Settings saved.');
  };

  // Actions: Export backup JSON
  const handleExportBackup = async () => {
    const jsonStr = await storage.exportBackup();
    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtertap_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerVibrate(35);
    showToast('Local JSON backup saved to your device!');
  };

  // Actions: Restore backup file
  const handleRestoreBackupFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const success = await storage.restoreBackup(text);
        if (success) {
          triggerVibrate([50, 40, 80]);
          showToast('Backup restored successfully!');
          await refreshData();
        } else {
          alert('Could not parse backup file. Please verify it is a valid FilterTap backup.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to read file.');
      }
    };
    reader.readAsText(file);
  };

  // Actions: Export CSV
  const handleExportCSV = async () => {
    const csvStr = await storage.exportCSV();
    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtertap_entries_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerVibrate(35);
    showToast('CSV export downloaded!');
  };

  // Actions: Factory Reset
  const handleFactoryReset = async () => {
    const confirm1 = window.confirm(
      'WARNING: This will permanently wipe all filter cycles, water logs, and custom settings stored on this device. Continue?'
    );
    if (!confirm1) return;

    await storage.factoryReset();
    triggerVibrate([80, 50, 100]);
    showToast('Database reset to factory default.');
    await refreshData();
  };

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070a12] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-sky-400 border-t-transparent shadow-lg shadow-sky-500/30" />
          <span className="text-xs font-bold text-slate-300">Loading FilterTap local database...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-[#070a12] px-4 pt-3 pb-24 text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-200">
      <div className="w-full max-w-[430px]">
        {/* Header */}
        <Header
          currentLiters={currentLiters}
          targetLiters={activeCycle?.targetLiters || 1500}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          onOpenApkModal={() => setIsApkModalOpen(true)}
        />

        {/* Eye-Soothing Animated Screen Transitions with Motion */}
        <main className="mt-2">
          <AnimatePresence mode="wait">
            {activeTab === 'tracker' && (
              <motion.div
                key="tracker"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <MainTracker
                  currentLiters={currentLiters}
                  activeCycle={activeCycle}
                  totalFills={totalFills}
                  lastTapTimestamp={lastTapInfo?.timestamp || null}
                  lastTapVolume={lastTapInfo?.volume || 5}
                  lastTapPerson={lastTapInfo?.person}
                  people={settings.savedPeople}
                  selectedPerson={settings.lastSelectedPerson}
                  onSelectPerson={handleSelectPerson}
                  onAddPerson={handleAddPerson}
                  onLogVolume={handleLogVolume}
                  onUndoLastTap={handleUndoLastTap}
                  onOpenResetModal={() => setIsResetModalOpen(true)}
                  onUpdateTarget={handleUpdateTarget}
                  onNavigateToDashboard={() => setActiveTab('dashboard')}
                />
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <EntriesDashboard
                  entries={entries}
                  cycles={cycles}
                  activeCycle={activeCycle}
                  currentLiters={currentLiters}
                  people={settings.savedPeople}
                  onOpenAddPastModal={() => setIsAddPastModalOpen(true)}
                  onOpenEditModal={(entry) => setEditingEntry(entry)}
                  onDeleteEntry={handleDeleteEntry}
                />
              </motion.div>
            )}

            {activeTab === 'cycles' && (
              <motion.div
                key="cycles"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <CycleManager
                  cycles={cycles}
                  entries={entries}
                  activeCycleId={settings.activeCycleId}
                  onOpenResetModal={() => setIsResetModalOpen(true)}
                  onOpenEditCycleModal={(cycle) => setEditingCycle(cycle)}
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <SettingsAndAndroid
                  settings={settings}
                  cycles={cycles}
                  entries={entries}
                  onUpdateSettings={handleUpdateSettings}
                  onExportBackup={handleExportBackup}
                  onRestoreBackupFile={handleRestoreBackupFile}
                  onExportCSV={handleExportCSV}
                  onFactoryReset={handleFactoryReset}
                  onOpenKeyModal={() => setIsKeyModalOpen(true)}
                  onOpenApkModal={() => setIsApkModalOpen(true)}
                  onShowToast={showToast}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Eye-soothing Android Bottom Navigation Bar with Spring Physics */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-800/80 bg-[#070c18]/90 px-3 py-2 shadow-2xl backdrop-blur-xl pb-safe">
        {[
          { id: 'tracker', label: 'Tracker', icon: Droplets },
          { id: 'dashboard', label: 'Entries', icon: Layers },
          { id: 'cycles', label: 'Cycles', icon: History },
          { id: 'settings', label: 'Settings & APK', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                triggerVibrate(15);
              }}
              className={`relative flex flex-col items-center gap-1 rounded-2xl px-3 py-1.5 transition-colors ${
                isActive ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 rounded-2xl bg-sky-500/15 border border-sky-400/30 -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Modals */}
      <ResetFilterModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleConfirmReset}
        defaultTarget={activeCycle?.targetLiters || 1500}
        currentCycleCount={cycles.length}
      />

      <EditEntryModal
        entry={editingEntry}
        cycles={cycles}
        people={settings.savedPeople}
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={handleSaveEntryUpdates}
        onDelete={handleDeleteEntry}
      />

      <AddPastEntryModal
        isOpen={isAddPastModalOpen}
        cycles={cycles}
        activeCycleId={settings.activeCycleId}
        people={settings.savedPeople}
        defaultPerson={settings.lastSelectedPerson}
        onClose={() => setIsAddPastModalOpen(false)}
        onAddEntry={handleAddPastEntry}
      />

      <EditCycleModal
        cycle={editingCycle}
        isOpen={!!editingCycle}
        onClose={() => setEditingCycle(null)}
        onSave={handleSaveCycleUpdates}
      />

      <AndroidKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onShowToast={showToast}
      />

      <AndroidApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        onShowToast={showToast}
      />

      <InstallGuideModal
        isOpen={isInstallModalOpen}
        isIOS={isIOS}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Toast */}
      <Toast message={toastMsg} />
    </div>
  );
}
