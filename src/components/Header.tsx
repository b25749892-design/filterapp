import React, { useState } from 'react';
import { WifiOff, Download, Smartphone, Pencil, Check, X, GitBranch } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  appName: string;
  currentLiters: number;
  targetLiters: number;
  onRenameApp: (newName: string) => void;
  onOpenInstallModal: () => void;
  onOpenApkModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appName,
  currentLiters,
  targetLiters,
  onRenameApp,
  onOpenInstallModal,
  onOpenApkModal,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(appName || 'FilterTap');

  const isLimitReached = currentLiters >= targetLiters;
  const isLow = currentLiters >= targetLiters * 0.85;

  let badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  let dotColor = 'bg-emerald-400';
  let badgeText = 'Active';

  if (isLimitReached) {
    badgeColor = 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse';
    dotColor = 'bg-red-400';
    badgeText = 'REPLACE';
  } else if (isLow) {
    badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    dotColor = 'bg-amber-400';
    badgeText = 'Low Filter';
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) onOpenInstallModal();
    } else {
      onOpenInstallModal();
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedName.trim()) {
      onRenameApp(editedName.trim());
      setIsEditingName(false);
    }
  };

  return (
    <header className="flex items-center justify-between pb-3 pt-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 shadow-lg shadow-sky-600/30 border border-sky-400/30">
          <svg className="h-6 w-6 fill-white drop-shadow-sm" viewBox="0 0 24 24">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </div>

        <div>
          {!isEditingName ? (
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-black tracking-tight text-white line-clamp-1">
                {appName || 'FilterTap'}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setEditedName(appName || 'FilterTap');
                  setIsEditingName(true);
                }}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-sky-300 active:scale-95 transition"
                title="Customize station name"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveName} className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-32 rounded-lg border border-sky-500 bg-slate-900 px-2 py-0.5 text-xs font-bold text-white focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-sky-600 p-1 text-white hover:bg-sky-500"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="rounded-full bg-slate-800 p-1 text-slate-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </form>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            {!isOnline ? (
              <span className="flex items-center gap-1 text-amber-400">
                <WifiOff className="h-3 w-3" /> Offline (Local DB)
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span>100% On-Device</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold">APK & CI/CD Ready</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Android APK download trigger */}
        <button
          onClick={onOpenApkModal}
          type="button"
          className="flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300 transition active:scale-95 hover:bg-emerald-500/25"
          title="Download APK package or inspect GitHub CI/CD"
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>APK</span>
        </button>

        {!isInstalled && (
          <button
            onClick={handleInstallClick}
            type="button"
            className="flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/15 px-2.5 py-1 text-xs font-bold text-sky-300 transition active:scale-95 active:bg-sky-500/25"
            title="Install FilterTap on your Android or home screen"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install</span>
          </button>
        )}

        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${badgeColor}`}
        >
          <span className={`h-2 w-2 rounded-full ${dotColor}`} />
          <span>{badgeText}</span>
        </div>
      </div>
    </header>
  );
};
