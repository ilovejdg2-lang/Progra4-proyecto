import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'

function AppStartupGate() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const timeoutId = window.setTimeout(() => {
      if (mounted) setReady(true);
    }, 2500);

    const waitForWindowLoad = new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
        return;
      }
      window.addEventListener('load', resolve, { once: true });
    });

    const waitForFonts = document.fonts?.ready?.catch(() => undefined) ?? Promise.resolve();

    Promise.all([waitForWindowLoad, waitForFonts]).finally(() => {
      window.clearTimeout(timeoutId);
      if (mounted) setReady(true);
    });

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) {
    return (
      <div className="app-loading-screen" role="status" aria-live="polite">
        <img src="/logo.webp" alt="Café UNA" className="app-loading-screen__logo" />
        <span className="app-loading-screen__spinner" aria-hidden="true" />
        <p>Cargando Café UNA...</p>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppStartupGate />
  </StrictMode>,
)