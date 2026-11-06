import React from 'react';
import { Download, X, Smartphone, Share2, MoreVertical } from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  isIOS: boolean;
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  isOpen,
  isIOS,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#162032] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Add to Home Screen</h3>
              <p className="text-xs text-slate-400">Install as standalone Android/mobile app</p>
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

        <div className="mt-4 flex flex-col gap-3 text-xs text-slate-300">
          <p className="leading-relaxed">
            FilterTap is engineered to run as a full offline standalone mobile application with zero
            browser address bar distractions:
          </p>

          <div className="rounded-xl bg-[#0b121e] p-3 border border-slate-800 flex flex-col gap-2.5">
            {isIOS ? (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
                    1
                  </span>
                  <span>
                    Tap the <strong className="text-white">Share</strong> button (
                    <Share2 className="inline h-3.5 w-3.5 text-sky-400" />) at the bottom of Safari.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong>.
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
                    1
                  </span>
                  <span>
                    Tap the browser menu (
                    <MoreVertical className="inline h-3.5 w-3.5 text-sky-400" /> three dots at top
                    or bottom of Chrome / Edge).
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
                    2
                  </span>
                  <span>
                    Tap <strong className="text-white">"Add to Home screen"</strong> or{' '}
                    <strong className="text-white">"Install app"</strong>.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/30 hover:bg-sky-500 active:scale-95"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
