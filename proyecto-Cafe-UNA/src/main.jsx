/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { refreshSessionIfNeeded } from './services/apiClient'
import { getActiveSessionUser, touchSession } from './services/sessionService'

const ACTIVITY_THROTTLE_MS = 60_000;
const SESSION_ACTIVITY_EVENTS = ['click', 'keydown', 'scroll', 'mousemove'];

function SessionSync() {
  useEffect(() => {
    getActiveSessionUser();
    const user = getActiveSessionUser();
    if (!user) return undefined;

    let lastActivityAt = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityAt < ACTIVITY_THROTTLE_MS) {
        return;
      }

      lastActivityAt = now;
      if (!getActiveSessionUser()) {
        return;
      }

      touchSession();
      refreshSessionIfNeeded();
    };

    SESSION_ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    const sessionIntervalId = window.setInterval(() => {
      getActiveSessionUser();
      refreshSessionIfNeeded();
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
