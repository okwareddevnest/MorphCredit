import React from 'react';

export const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const canPrompt = !!deferredPrompt;
  if (!visible || !canPrompt) return null;

  const install = async () => {
    try {
      if (!deferredPrompt) return;
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome !== 'accepted') {
        // user dismissed
      }
      setDeferredPrompt(null);
      setVisible(false);
    } catch {
      setVisible(false);
    }
  };

  return (
    <button
      onClick={install}
      className="hidden md:inline-flex ml-2 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm"
      title="Install app"
    >
      Install App
    </button>
  );
};

export default InstallPWAButton;

