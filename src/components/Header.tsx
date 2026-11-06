import React from 'react';
import { WifiOff, Download, Smartphone } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  currentLiters: number;
  targetLiters: number;
  onOpenInstallModal: () => void;
  onOpenApkModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLiters,
  targetLiters,
  onOpenInstallModal,
  onOpenApkModal,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, install } = usePWAInstall();

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

  return (
    <header className="flex items-center justify-between pb-3 pt-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 shadow-lg shadow-sky-600/30 border border-sky-400/30">
          <svg className="h-6 w-6 fill-white drop-shadow-sm" viewBox="0 0 24 24">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-black tracking-tight text-white">FilterTap</h1>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-black uppercase text-emerald-400">
              APK Ready
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            {!isOnline ? (
              <span className="flex items-center gap-1 text-amber-400">
                <WifiOff className="h-3 w-3" /> Offline (Local DB)
              </span>
            ) : (
              <span>100% On-Device • No Cloud</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Android APK download trigger */}
        <button
          onClick={onOpenApkModal}
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300 transition active:scale-95 hover:bg-emerald-500/25"
          title="Download or build Android APK"
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>APK</span>
        </button>

        {!isInstalled && (
          <button
            onClick={handleInstallClick}
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/15 px-2.5 py-1 text-xs font-bold text-sky-300 transition active:scale-95 active:bg-sky-500/25"
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
