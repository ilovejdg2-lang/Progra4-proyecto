/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { getActiveSessionUser } from './services/sessionService'

function SessionSync() {
  useEffect(() => {
    getActiveSessionUser();
    const sessionIntervalId = window.setInterval(getActiveSessionUser, 30_000);
    return () => window.clearInterval(sessionIntervalId);
  }, []);

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SessionSync />
  </StrictMode>,
)
