import React from 'react';
import { Smartphone, Download, X, CheckCircle2, Terminal, Package, Sparkles } from 'lucide-react';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const handleDownloadZip = () => {
    const a = document.createElement('a');
    a.href = '/FilterTap-Android-APK-Package.zip';
    a.download = 'FilterTap-Android-APK-Package.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast('Downloading FilterTap Android APK Project (.zip)!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-sky-500/30 bg-[#0e172a] p-5 shadow-2xl shadow-black">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-600 text-white shadow-lg shadow-emerald-500/20">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Android APK Package</h3>
              <p className="text-xs text-slate-400">Native standalone Android APK distribution</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3.5 text-xs">
          {/* Main Download Button */}
          <button
            type="button"
            onClick={handleDownloadZip}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-sky-400/40 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 py-3.5 text-sm font-black text-white shadow-xl shadow-sky-600/40 transition active:scale-[0.98] hover:brightness-110"
          >
            <Download className="h-5 w-5" />
            <span>Download Android Studio APK Project (.zip)</span>
          </button>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-[#070d18] p-2.5">
              <div className="text-[10px] font-bold uppercase text-slate-400">Package Name</div>
              <div className="font-mono font-bold text-sky-400">com.filtertap.app</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#070d18] p-2.5">
              <div className="text-[10px] font-bold uppercase text-slate-400">Signing Consistency</div>
              <div className="font-mono font-bold text-emerald-400">Verified Keystore</div>
            </div>
          </div>

          {/* 3 Simple Ways to Build the APK */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-[#070d18] p-3.5">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Package className="h-4 w-4 text-sky-400" />
              <span>How to Build your APK:</span>
            </div>

            <div className="mt-1 flex flex-col gap-2 text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-[10px] font-bold text-sky-400">
                  1
                </span>
                <div>
                  <strong className="text-white">Android Studio:</strong> Unzip the download, click{' '}
                  <em>Open Project</em>, select the <code className="text-sky-300">android/</code> folder,
                  and click <em>Build &gt; Build APK(s)</em>.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-[10px] font-bold text-sky-400">
                  2
                </span>
                <div>
                  <strong className="text-white">Gradle CLI:</strong> Run{' '}
                  <code className="rounded bg-slate-900 px-1 py-0.5 text-sky-300">
                    ./gradlew assembleDebug
                  </code>{' '}
                  in the project directory.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-[10px] font-bold text-sky-400">
                  3
                </span>
                <div>
                  <strong className="text-white">Direct on Phone (WebAPK / Standalone):</strong> Tap{' '}
                  <em>"Install"</em> in the top header to run as a full screen native app on Android
                  instantly with zero installation barriers!
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
