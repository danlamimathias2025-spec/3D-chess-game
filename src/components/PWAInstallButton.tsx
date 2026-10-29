import React, { useState } from 'react';
import { usePWAInstall } from '../usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="hud-btn pwa-install-btn"
        title="Install Wizard Chess 3D on your device"
      >
        <span className="pwa-btn-icon">⚡</span> Install App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="hud-btn pwa-install-btn"
          title="Install Wizard Chess 3D on iPhone / iPad"
        >
          <span className="pwa-btn-icon">📱</span> Install on iOS
        </button>

        {showIOSGuide && (
          <div className="pwa-modal-overlay" onClick={() => setShowIOSGuide(false)}>
            <div className="pwa-modal-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="pwa-modal-title">Install on iPhone / iPad</h3>
              <p className="pwa-modal-text">
                To play <strong>Wizard Chess 3D</strong> fullscreen offline:
              </p>
              <ol className="pwa-modal-steps">
                <li>Tap the <strong>Share</strong> button <span className="ios-share-icon">⎋</span> in your Safari toolbar.</li>
                <li>Scroll down and select <strong>Add to Home Screen</strong> <span className="ios-add-icon">➕</span>.</li>
                <li>Launch <strong>Wizard Chess</strong> from your Home Screen!</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="hud-btn primary pwa-modal-close"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback button if beforeinstallprompt hasn't fired yet or desktop browser
  return (
    <button
      type="button"
      onClick={() => alert('To install Wizard Chess 3D: Use your browser menu (⋮ or ⚙️) and select "Install Wizard Chess" or "Add to Home Screen".')}
      className="hud-btn pwa-install-btn"
      title="Install Wizard Chess 3D"
    >
      <span className="pwa-btn-icon">📲</span> Install App
    </button>
  );
};
