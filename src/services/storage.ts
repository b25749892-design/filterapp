import { AppSettings, FilterCycle, FilterEntry, FilterTapBackupData } from '../types';

const DB_NAME = 'FilterTapDB_v2';
const DB_VERSION = 1;
const STORE_SETTINGS = 'settings';
const STORE_CYCLES = 'cycles';
const STORE_ENTRIES = 'entries';

const LOCAL_STORAGE_KEY = 'filtertap_local_cache_v2';

// Canonical Android release signature details ensuring persistent update consistency
export const CANONICAL_ANDROID_SIGNING = {
  packageName: 'com.filtertap.app',
  versionName: '1.4.0',
  versionCode: 140,
  keyAlias: 'filtertap-release-key',
  keyAlgorithm: 'RSA 4096 / SHA256withRSA',
  keyFingerprintSha256:
    '7F:B4:92:1C:88:E2:03:6A:9D:44:B1:5E:20:99:34:F1:C8:51:7A:3D:28:9B:4C:6E:81:04:12:DE:33:AA:59:71',
  keyFingerprintSha1: '4A:D2:78:E1:90:33:C4:F5:6B:19:80:2E:FE:91:D5:AC:3B:88:67:12',
  appIdentifier: 'com.filtertap.app',
};

const DEFAULT_SETTINGS: AppSettings = {
  activeCycleId: 'initial-cycle',
  defaultTargetLiters: 1500,
  quickAmounts: [1, 2, 5, 10],
  hapticsEnabled: true,
  waterUnit: 'L',
  savedPeople: ['Me', 'Dad', 'Mom', 'Alex'],
  lastSelectedPerson: 'Me',
  androidSigning: CANONICAL_ANDROID_SIGNING,
};

function getInitialCycle(): FilterCycle {
  return {
    id: 'initial-cycle',
    name: 'Active Filter #1',
    startDate: new Date().toISOString(),
    endDate: null,
    targetLiters: 1500,
    status: 'active',
    notes: 'Initial filter cycle installation',
  };
}

class StorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async openDB(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;
    if (typeof window === 'undefined' || !window.indexedDB) return null;

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS);
        }
        if (!db.objectStoreNames.contains(STORE_CYCLES)) {
          db.createObjectStore(STORE_CYCLES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
          const entryStore = db.createObjectStore(STORE_ENTRIES, { keyPath: 'id' });
          entryStore.createIndex('cycleId', 'cycleId', { unique: false });
          entryStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.warn('IndexedDB open error, falling back to localStorage:', e);
        resolve(null);
      };
    });
  }

  public async init(): Promise<{
    settings: AppSettings;
    cycles: FilterCycle[];
    entries: FilterEntry[];
  }> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        await this.openDB();
        await this.ensureInitialSeed();
      })();
    }
    await this.initPromise;
    return this.loadAll();
  }

  private async ensureInitialSeed() {
    const data = await this.loadAll();
    if (data.cycles.length === 0) {
      const initialCycle = getInitialCycle();
      const settings = { ...DEFAULT_SETTINGS, activeCycleId: initialCycle.id };
      await this.saveCycles([initialCycle]);
      await this.saveSettings(settings);
      await this.saveEntries([]);
    }
  }

  public async loadAll(): Promise<{
    settings: AppSettings;
    cycles: FilterCycle[];
    entries: FilterEntry[];
  }> {
    const db = await this.openDB();
    if (db) {
      try {
        const tx = db.transaction([STORE_SETTINGS, STORE_CYCLES, STORE_ENTRIES], 'readonly');
        const settingsStore = tx.objectStore(STORE_SETTINGS);
        const cyclesStore = tx.objectStore(STORE_CYCLES);
        const entriesStore = tx.objectStore(STORE_ENTRIES);

        const [settings, cycles, entries] = await Promise.all([
          new Promise<AppSettings | undefined>((resolve) => {
            const req = settingsStore.get('main');
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(undefined);
          }),
          new Promise<FilterCycle[]>((resolve) => {
            const req = cyclesStore.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
          }),
          new Promise<FilterEntry[]>((resolve) => {
            const req = entriesStore.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
          }),
        ]);

        if (cycles && cycles.length > 0) {
          const finalSettings = {
            ...DEFAULT_SETTINGS,
            ...(settings || {}),
            androidSigning: CANONICAL_ANDROID_SIGNING,
          };
          this.mirrorToLocalStorage(finalSettings, cycles, entries);
          return { settings: finalSettings, cycles, entries };
        }
      } catch (err) {
        console.warn('Failed reading from IndexedDB:', err);
      }
    }

    // Fallback to localStorage
    const cached = this.readFromLocalStorage();
    if (cached) {
      return cached;
    }

    const initialCycle = getInitialCycle();
    const defaultData = {
      settings: { ...DEFAULT_SETTINGS, activeCycleId: initialCycle.id },
      cycles: [initialCycle],
      entries: [],
    };
    this.mirrorToLocalStorage(defaultData.settings, defaultData.cycles, defaultData.entries);
    return defaultData;
  }

  private mirrorToLocalStorage(
    settings: AppSettings,
    cycles: FilterCycle[],
    entries: FilterEntry[]
  ) {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ settings, cycles, entries, updatedAt: new Date().toISOString() })
      );
    } catch (e) {
      console.warn('localStorage cache failed:', e);
    }
  }

  private readFromLocalStorage(): {
    settings: AppSettings;
    cycles: FilterCycle[];
    entries: FilterEntry[];
  } | null {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.cycles && parsed.settings) {
          return {
            settings: {
              ...DEFAULT_SETTINGS,
              ...parsed.settings,
              androidSigning: CANONICAL_ANDROID_SIGNING,
            },
            cycles: parsed.cycles,
            entries: parsed.entries || [],
          };
        }
      }
    } catch (e) {
      console.warn('Error reading localStorage cache:', e);
    }
    return null;
  }

  public async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.openDB();
    if (db) {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      tx.objectStore(STORE_SETTINGS).put(settings, 'main');
    }
    const current = await this.loadAll();
    this.mirrorToLocalStorage(settings, current.cycles, current.entries);
  }

  public async saveCycles(cycles: FilterCycle[]): Promise<void> {
    const db = await this.openDB();
    if (db) {
      const tx = db.transaction(STORE_CYCLES, 'readwrite');
      const store = tx.objectStore(STORE_CYCLES);
      store.clear();
      for (const cycle of cycles) {
        store.put(cycle);
      }
    }
    const current = await this.loadAll();
    this.mirrorToLocalStorage(current.settings, cycles, current.entries);
  }

  public async saveEntries(entries: FilterEntry[]): Promise<void> {
    const db = await this.openDB();
    if (db) {
      const tx = db.transaction(STORE_ENTRIES, 'readwrite');
      const store = tx.objectStore(STORE_ENTRIES);
      store.clear();
      for (const entry of entries) {
        store.put(entry);
      }
    }
    const current = await this.loadAll();
    this.mirrorToLocalStorage(current.settings, current.cycles, entries);
  }

  // Add a water log entry (quick or manual or retroactive)
  public async addEntry(
    volume: number,
    cycleId: string,
    options?: {
      timestamp?: string;
      note?: string;
      person?: string;
      source?: 'quick_tap' | 'manual_entry' | 'retroactive';
    }
  ): Promise<FilterEntry> {
    const newEntry: FilterEntry = {
      id: 'entry-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      cycleId,
      volume,
      person: options?.person?.trim() || undefined,
      timestamp: options?.timestamp || new Date().toISOString(),
      note: options?.note?.trim() || undefined,
      source: options?.source || 'quick_tap',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = await this.loadAll();
    const updatedEntries = [newEntry, ...current.entries];
    await this.saveEntries(updatedEntries);
    return newEntry;
  }

  // Modify historical record (date, time, volume, note, person)
  public async updateEntry(
    entryId: string,
    updates: {
      timestamp?: string;
      volume?: number;
      person?: string;
      note?: string;
      cycleId?: string;
    }
  ): Promise<FilterEntry | null> {
    const current = await this.loadAll();
    const index = current.entries.findIndex((e) => e.id === entryId);
    if (index === -1) return null;

    const existing = current.entries[index];
    const updated: FilterEntry = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    current.entries[index] = updated;
    await this.saveEntries(current.entries);
    return updated;
  }

  // Delete an entry
  public async deleteEntry(entryId: string): Promise<boolean> {
    const current = await this.loadAll();
    const filtered = current.entries.filter((e) => e.id !== entryId);
    if (filtered.length !== current.entries.length) {
      await this.saveEntries(filtered);
      return true;
    }
    return false;
  }

  // Modify historical cycle details (start date, end date, target capacity, name)
  public async updateCycle(
    cycleId: string,
    updates: Partial<Omit<FilterCycle, 'id'>>
  ): Promise<FilterCycle | null> {
    const current = await this.loadAll();
    const index = current.cycles.findIndex((c) => c.id === cycleId);
    if (index === -1) return null;

    const updated: FilterCycle = {
      ...current.cycles[index],
      ...updates,
    };

    current.cycles[index] = updated;
    await this.saveCycles(current.cycles);
    return updated;
  }

  // Reset filter cycle - supports resetting NOW or on a custom PAST DATE
  public async resetCycle(options: {
    customResetDate?: string; // If user replaced it 2 days ago, e.g. 2026-11-04
    newTargetLiters?: number;
    newCycleName?: string;
    resetReason?: string;
  }): Promise<{ oldCycle: FilterCycle; newCycle: FilterCycle }> {
    const current = await this.loadAll();
    const resetDate = options.customResetDate || new Date().toISOString();

    const activeCycleIndex = current.cycles.findIndex(
      (c) => c.id === current.settings.activeCycleId && c.status === 'active'
    );

    let activeCycle = activeCycleIndex !== -1 ? current.cycles[activeCycleIndex] : null;

    if (activeCycle) {
      activeCycle.status = 'completed';
      activeCycle.endDate = resetDate;
      activeCycle.resetReason = options.resetReason || 'Manual Reset / Filter Replacement';
    }

    const nextNumber = current.cycles.length + 1;
    const newCycle: FilterCycle = {
      id: 'cycle-' + Date.now(),
      name: options.newCycleName || `Filter #${nextNumber}`,
      startDate: resetDate,
      endDate: null,
      targetLiters:
        options.newTargetLiters ||
        activeCycle?.targetLiters ||
        current.settings.defaultTargetLiters ||
        1500,
      status: 'active',
      notes: `Started on ${new Date(resetDate).toLocaleDateString()}`,
    };

    const updatedCycles = [newCycle, ...current.cycles];
    const updatedSettings: AppSettings = {
      ...current.settings,
      activeCycleId: newCycle.id,
    };

    // If a custom retroactive reset date was chosen, reassign entries that occurred after that reset date to the new cycle!
    const updatedEntries = current.entries.map((entry) => {
      if (new Date(entry.timestamp).getTime() >= new Date(resetDate).getTime()) {
        return { ...entry, cycleId: newCycle.id };
      }
      return entry;
    });

    await this.saveCycles(updatedCycles);
    await this.saveSettings(updatedSettings);
    await this.saveEntries(updatedEntries);

    return { oldCycle: activeCycle || newCycle, newCycle };
  }

  // Export full JSON backup
  public async exportBackup(): Promise<string> {
    const { settings, cycles, entries } = await this.loadAll();
    const backup: FilterTapBackupData = {
      app: 'FilterTap',
      version: 2,
      exportedAt: new Date().toISOString(),
      settings,
      cycles,
      entries,
    };
    return JSON.stringify(backup, null, 2);
  }

  // Restore from JSON backup
  public async restoreBackup(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);

      // Support v1 legacy format from original single file
      if (typeof data.currentLiters === 'number' && typeof data.totalFills === 'number') {
        const cycle = getInitialCycle();
        cycle.targetLiters = data.targetLiters || 1500;
        cycle.startDate = data.lastResetDate || new Date().toISOString();

        const entries: FilterEntry[] = [];
        const singleVolume = 5;
        const count = Math.round(data.currentLiters / singleVolume);
        const startTime = new Date(cycle.startDate).getTime();
        const now = Date.now();
        const interval = count > 1 ? (now - startTime) / count : 0;

        for (let i = 0; i < count; i++) {
          entries.push({
            id: 'legacy-entry-' + i,
            cycleId: cycle.id,
            volume: singleVolume,
            timestamp: new Date(startTime + i * interval).toISOString(),
            source: 'quick_tap',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        const settings: AppSettings = {
          ...DEFAULT_SETTINGS,
          activeCycleId: cycle.id,
          defaultTargetLiters: cycle.targetLiters,
        };

        await this.saveCycles([cycle]);
        await this.saveEntries(entries);
        await this.saveSettings(settings);
        return true;
      }

      // v2 standard format
      if (!data.cycles || !Array.isArray(data.cycles)) {
        throw new Error('Invalid FilterTap backup schema');
      }

      const settings: AppSettings = {
        ...DEFAULT_SETTINGS,
        ...(data.settings || {}),
        androidSigning: CANONICAL_ANDROID_SIGNING,
      };

      await this.saveCycles(data.cycles);
      await this.saveEntries(data.entries || []);
      await this.saveSettings(settings);
      return true;
    } catch (e) {
      console.error('Failed to parse backup:', e);
      return false;
    }
  }

  // Export entries as CSV
  public async exportCSV(): Promise<string> {
    const { cycles, entries } = await this.loadAll();
    const cycleMap = new Map(cycles.map((c) => [c.id, c.name]));

    const headers = ['ID', 'Date', 'Time (ISO)', 'Volume (L)', 'Person', 'Filter Cycle', 'Note', 'Source'];
    const rows = entries.map((entry) => [
      entry.id,
      new Date(entry.timestamp).toLocaleDateString(),
      entry.timestamp,
      entry.volume.toString(),
      `"${(entry.person || 'Unspecified').replace(/"/g, '""')}"`,
      `"${cycleMap.get(entry.cycleId) || 'Unknown'}"`,
      `"${(entry.note || '').replace(/"/g, '""')}"`,
      entry.source,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  // Clear all data (with factory reset)
  public async factoryReset(): Promise<void> {
    const initialCycle = getInitialCycle();
    const settings = { ...DEFAULT_SETTINGS, activeCycleId: initialCycle.id };
    await this.saveCycles([initialCycle]);
    await this.saveEntries([]);
    await this.saveSettings(settings);
  }
}

export const storage = new StorageService();
