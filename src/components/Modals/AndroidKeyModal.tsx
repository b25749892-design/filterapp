import React, { useState } from 'react';
import { Smartphone, X, Copy, Check, ShieldCheck, Download, Code2 } from 'lucide-react';
import { CANONICAL_ANDROID_SIGNING } from '../../services/storage';

interface AndroidKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const AndroidKeyModal: React.FC<AndroidKeyModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const keytoolCmd = `keytool -genkeypair -v -keystore filtertap-release.keystore -alias filtertap-release-key -keyalg RSA -keysize 4096 -validity 10000 -dname "CN=FilterTap, OU=App, O=FilterTap, C=US"`;

  const gradleSnippet = `// android/app/build.gradle.kts
android {
    namespace = "${CANONICAL_ANDROID_SIGNING.packageName}"
    compileSdk = 35

    defaultConfig {
        applicationId = "${CANONICAL_ANDROID_SIGNING.packageName}"
        minSdk = 24
        targetSdk = 35
        versionCode = ${CANONICAL_ANDROID_SIGNING.versionCode}
        versionName = "${CANONICAL_ANDROID_SIGNING.versionName}"
    }

    signingConfigs {
        create("release") {
            storeFile = file("filtertap-release.keystore")
            storePassword = System.getenv("KEYSTORE_PASSWORD") ?: "filtertap-key"
            keyAlias = "${CANONICAL_ANDROID_SIGNING.keyAlias}"
            keyPassword = System.getenv("KEY_PASSWORD") ?: "filtertap-key"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            signingConfig = signingConfigs.getByName("release")
        }
    }
}`;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    onShowToast('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const downloadSigningSpec = () => {
    const spec = {
      app: 'FilterTap',
      applicationId: CANONICAL_ANDROID_SIGNING.packageName,
      versionCode: CANONICAL_ANDROID_SIGNING.versionCode,
      versionName: CANONICAL_ANDROID_SIGNING.versionName,
      keystoreFilename: 'filtertap-release.keystore',
      keyAlias: CANONICAL_ANDROID_SIGNING.keyAlias,
      algorithm: CANONICAL_ANDROID_SIGNING.keyAlgorithm,
      sha256Certificate: CANONICAL_ANDROID_SIGNING.keyFingerprintSha256,
      sha1Certificate: CANONICAL_ANDROID_SIGNING.keyFingerprintSha1,
      updateCompatibilityRule:
        'MUST retain the same certificate SHA-256 for all APK/AAB updates to prevent INSTALL_FAILED_UPDATE_INCOMPATIBLE.',
      digitalAssetLinks: [
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: CANONICAL_ANDROID_SIGNING.packageName,
            sha256_cert_fingerprints: [CANONICAL_ANDROID_SIGNING.keyFingerprintSha256],
          },
        },
      ],
    };

    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'android-release-signing-spec.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('android-release-signing-spec.json downloaded!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-[#162032] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Android Signing & Updates</h3>
              <p className="text-xs text-slate-400">Continuous update consistency across all devices</p>
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

        <div className="mt-4 flex flex-col gap-4 text-xs">
          <div className="rounded-xl bg-[#0b121e] p-3 text-slate-300 leading-relaxed border border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-sky-300 mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Android Key Consistency Rule</span>
            </div>
            Android OS strictly enforces that updates for an installed package (
            <code>{CANONICAL_ANDROID_SIGNING.packageName}</code>) can only succeed if the new APK
            is signed with the <strong>exact same private key</strong> as the previous version. If
            the keystore changes, Android denies the installation with{' '}
            <code className="text-red-300">INSTALL_FAILED_UPDATE_INCOMPATIBLE</code>.
          </div>

          {/* Keytool Generator Command */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-white">1. Keytool Generation Command:</span>
              <button
                type="button"
                onClick={() => copyText(keytoolCmd, 'cmd')}
                className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300"
              >
                {copiedKey === 'cmd' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>Copy Command</span>
              </button>
            </div>
            <pre className="rounded-xl bg-[#0b121e] p-2.5 font-mono text-[11px] text-slate-200 overflow-x-auto border border-slate-800 whitespace-pre-wrap select-all">
              {keytoolCmd}
            </pre>
          </div>

          {/* Gradle Signing Block */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-white">2. Android Gradle (build.gradle.kts):</span>
              <button
                type="button"
                onClick={() => copyText(gradleSnippet, 'gradle')}
                className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300"
              >
                {copiedKey === 'gradle' ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>Copy Gradle Code</span>
              </button>
            </div>
            <pre className="rounded-xl bg-[#0b121e] p-2.5 font-mono text-[10px] text-slate-300 overflow-x-auto border border-slate-800 max-h-48 select-all">
              {gradleSnippet}
            </pre>
          </div>

          {/* Download JSON Spec */}
          <button
            type="button"
            onClick={downloadSigningSpec}
            className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-600/20 py-2.5 font-bold text-sky-300 hover:bg-sky-600/30 active:scale-98"
          >
            <Download className="h-4 w-4" />
            <span>Download android-release-signing-spec.json</span>
          </button>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
