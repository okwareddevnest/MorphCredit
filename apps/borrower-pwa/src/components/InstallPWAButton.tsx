import React from 'react';

export const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [visible, setVisible] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    );

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Fallback on iOS: no beforeinstallprompt. Show button if not standalone.
    if (/iphone|ipad|ipod/i.test(window.navigator.userAgent) && !(
      window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    )) {
      setVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible) return null;

  const install = async () => {
    try {
      if (deferredPrompt) {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome !== 'accepted') {
          // user dismissed
        }
        setDeferredPrompt(null);
        setVisible(false);
        return;
      }
      // iOS fallback
      if (isIOS && !isStandalone) {
        alert('Install MorphCredit: Tap the Share icon, then "Add to Home Screen".');
      }
    } catch {
      setVisible(false);
    }
  };

  return (
    <button
      onClick={install}
      className="inline-flex ml-2 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm"
      title="Install app"
    >
      Install App
    </button>
  );
};

export default InstallPWAButton;

