export interface FilterEntry {
  id: string;
  cycleId: string;
  timestamp: string; // ISO string (e.g. 2026-11-06T13:45:00.000Z)
  volume: number; // in Liters
  person?: string; // Person who brought / filled the water (e.g. "Dad", "Me", "Sarah")
  note?: string;
  source: 'quick_tap' | 'manual_entry' | 'retroactive';
  createdAt: string;
  updatedAt: string;
}

export interface FilterCycle {
  id: string;
  name: string; // e.g. "Filter #1", "Kitchen Brita", "Under-Sink Carbon"
  startDate: string; // ISO string
  endDate?: string | null; // ISO string when replaced/reset
  targetLiters: number; // e.g. 1500, 3000
  status: 'active' | 'completed';
  notes?: string;
  resetReason?: string;
}

export interface AppSettings {
  activeCycleId: string;
  defaultTargetLiters: number;
  quickAmounts: number[];
  hapticsEnabled: boolean;
  waterUnit: 'L' | 'gal';
  savedPeople: string[]; // Household / office members who bring water
  lastSelectedPerson: string; // Currently active person for 1-tap logging
  androidSigning: {
    packageName: string;
    versionName: string;
    versionCode: number;
    keyAlias: string;
    keyAlgorithm: string;
    keyFingerprintSha256: string;
    keyFingerprintSha1: string;
    appIdentifier: string;
  };
}

export interface FilterTapBackupData {
  app: string;
  version: number;
  exportedAt: string;
  settings: AppSettings;
  cycles: FilterCycle[];
  entries: FilterEntry[];
}

export type TabType = 'tracker' | 'dashboard' | 'cycles' | 'settings';
