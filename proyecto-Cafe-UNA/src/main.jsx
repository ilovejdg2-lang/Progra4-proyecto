/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { refreshSessionIfNeeded } from './services/apiClient'
import { getActiveSessionUser, isLoggingOut, touchSession } from './services/sessionService'
import { installNativeInvalidFocus } from './lib/formFocus'
import { obtenerNavbar } from './services/informacionService'
import { guardarIdioma, obtenerIdioma } from './lib/idioma'

// Calienta el logo del navbar para loaders (caché localStorage).
void obtenerNavbar().catch(() => {})

// Idioma por defecto: español. Solo se respeta EN si el usuario ya lo eligió.
void (() => {
  try {
    if (localStorage.getItem('cafe-una-idioma')) {
      document.documentElement.lang = obtenerIdioma() === 'en' ? 'en' : 'es'
      return
    }
    guardarIdioma('es')
  } catch {
    document.documentElement.lang = 'es'
  }
})()

const ACTIVITY_THROTTLE_MS = 60_000;
const SESSION_ACTIVITY_EVENTS = ['click', 'keydown', 'scroll'];

function runSessionRefresh() {
  if (isLoggingOut()) return;
  void refreshSessionIfNeeded().catch(() => {});
}

function SessionSync() {
  useEffect(() => installNativeInvalidFocus(), []);

  useEffect(() => {
    if (!getActiveSessionUser()) return undefined;

    let lastActivityAt = 0;
    const handleActivity = () => {
      if (isLoggingOut()) return;

      const now = Date.now();
      if (now - lastActivityAt < ACTIVITY_THROTTLE_MS) {
        return;
      }

      lastActivityAt = now;
      if (!getActiveSessionUser()) {
        return;
      }

      touchSession();
      runSessionRefresh();
    };

    SESSION_ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    const sessionIntervalId = window.setInterval(() => {
      if (isLoggingOut()) return;
      getActiveSessionUser();
      runSessionRefresh();
    }, 30_000);

    return () => {
      SESSION_ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      window.clearInterval(sessionIntervalId);
    };
  }, []);

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SessionSync />
  </StrictMode>,
)
