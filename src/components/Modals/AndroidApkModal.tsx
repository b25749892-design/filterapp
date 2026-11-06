import React, { useState } from 'react';
import { Smartphone, Download, X, Copy, Check, GitBranch, Package, Terminal, FileCode2 } from 'lucide-react';

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
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);

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

  const gitPushCmd = `git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git\ngit branch -M main\ngit push -u origin main`;
  const helperScriptCmd = `./scripts/push-to-github.sh https://github.com/YOUR_USERNAME/YOUR_REPO.git`;

  const copyToClipboard = (text: string, type: 'cmd' | 'script') => {
    navigator.clipboard.writeText(text);
    if (type === 'cmd') setCopiedGitCmd(true);
    if (type === 'script') setCopiedScript(true);
    onShowToast('Copied to clipboard!');
    setTimeout(() => {
      setCopiedGitCmd(false);
      setCopiedScript(false);
    }, 2500);
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
              <h3 className="text-base font-extrabold text-white">Android APK & GitHub CI/CD</h3>
              <p className="text-xs text-slate-400">Native Android project & automated build YAML</p>
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

          {/* GitHub Actions YAML Workflow Card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-emerald-300">
                <FileCode2 className="h-4 w-4" />
                <span>GitHub Actions APK YAML Included</span>
              </span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/40">
                .github/workflows/build-apk.yml
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Every commit pushed to GitHub automatically triggers the workflow to compile both{' '}
              <strong className="text-white">Debug & Release APKs</strong> and attaches them directly as
              downloadable artifacts on GitHub!
            </p>
          </div>

          {/* Push to GitHub Commands */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-[#070d18] p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-white">
                <GitBranch className="h-4 w-4 text-sky-400" />
                <span>Push to Your GitHub Repository:</span>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(gitPushCmd, 'cmd')}
                className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300"
              >
                {copiedGitCmd ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedGitCmd ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="rounded-xl bg-slate-900/90 p-2.5 font-mono text-[10px] text-slate-200 overflow-x-auto border border-slate-800 whitespace-pre-wrap select-all">
              {gitPushCmd}
            </pre>

            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Or run the helper script in terminal:</span>
              <button
                type="button"
                onClick={() => copyToClipboard(helperScriptCmd, 'script')}
                className="font-bold text-sky-400 hover:underline"
              >
                {copiedScript ? 'Copied script' : 'Copy script cmd'}
              </button>
            </div>
            <code className="rounded-lg bg-black/40 p-1.5 font-mono text-[10px] text-sky-300 overflow-x-auto select-all">
              {helperScriptCmd}
            </code>
          </div>

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
