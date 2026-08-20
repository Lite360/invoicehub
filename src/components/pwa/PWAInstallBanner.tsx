import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function PWAInstallBanner() {
  const { isInstallable, isIOS, isInstalled, dismissed, install, dismiss } = usePWAInstall();

  // Don't show if already installed or user dismissed
  if (isInstalled || dismissed) return null;
  // Don't show if neither installable nor iOS
  if (!isInstallable && !isIOS) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-700">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-2xl flex-shrink-0">
            📱
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Install InvoiceHub</p>
            {isIOS ? (
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Tap <span className="font-semibold">Share</span> then{' '}
                <span className="font-semibold">Add to Home Screen</span> to install.
              </p>
            ) : (
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Install for faster access and offline support.
              </p>
            )}
          </div>
          <button
            onClick={dismiss}
            className="text-slate-400 hover:text-white transition-colors mt-0.5 flex-shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>

        {!isIOS && isInstallable && (
          <button
            onClick={install}
            className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Install InvoiceHub
          </button>
        )}

        {isIOS && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 bg-slate-800 rounded-xl p-3">
            <span>1. Tap</span>
            <span className="text-emerald-400 font-medium">Share ↑</span>
            <span>2. Select</span>
            <span className="text-emerald-400 font-medium">Add to Home Screen</span>
          </div>
        )}
      </div>
    </div>
  );
}
