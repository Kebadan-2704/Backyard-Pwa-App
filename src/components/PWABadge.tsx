import { useRegisterSW } from 'virtual:pwa-register/react';
import { useAppStore } from '../store/appStore';
import { Download, RefreshCw, X } from 'lucide-react';
import './PWABadge.css';

export default function PWABadge() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const deferredPrompt = useAppStore(s => s.deferredInstallPrompt);
  const installDismissed = useAppStore(s => s.installDismissed);
  const dismissInstall = useAppStore(s => s.dismissInstall);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      (deferredPrompt as any).prompt();
      const { outcome } = await (deferredPrompt as any).userChoice;
      if (outcome === 'accepted') {
        dismissInstall();
      }
    } catch (err) {
      console.error('Install prompt error', err);
    }
  };

  return (
    <div className="pwa-container" role="alert">
      {/* Update/Offline Ready Notification */}
      {(offlineReady || needRefresh) && (
        <div className="pwa-toast">
          <div className="pwa-toast-message">
            {offlineReady ? (
              <span>App is ready to work offline</span>
            ) : (
              <span>New content available, click on reload button to update.</span>
            )}
          </div>
          <div className="pwa-toast-buttons">
            {needRefresh && (
              <button className="pwa-btn primary" onClick={() => updateServiceWorker(true)}>
                <RefreshCw size={14} style={{ marginRight: 6 }} /> Reload
              </button>
            )}
            <button className="pwa-btn" onClick={close}>
              <X size={14} style={{ marginRight: 6 }} /> Close
            </button>
          </div>
        </div>
      )}

      {/* Install App Prompt */}
      {deferredPrompt && !installDismissed && (
        <div className="pwa-toast install-prompt">
          <div className="pwa-toast-message">
            <strong>Install Backyard Cricket</strong>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              Add to your home screen for quick offline access and full screen mode!
            </div>
          </div>
          <div className="pwa-toast-buttons" style={{ marginTop: 12 }}>
            <button className="pwa-btn primary" onClick={handleInstall}>
              <Download size={14} style={{ marginRight: 6 }} /> Install App
            </button>
            <button className="pwa-btn" onClick={dismissInstall}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
