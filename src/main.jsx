import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ─────────────────────────────────────────────────────────────────
// CACHE BUSTER
// Increment APP_VERSION whenever you need to force all browsers
// (especially mobile) to drop stale Supabase sessions and localStorage
// data from previous builds. Currently bumped to '2' to clear the
// old per-user login sessions from the auth-gated version.
// ─────────────────────────────────────────────────────────────────
const APP_VERSION = '2';

(function clearStaleCache() {
  try {
    const stored = localStorage.getItem('swin-app-version');
    if (stored !== APP_VERSION) {
      // Remove every key related to Supabase auth or old SWIN sessions
      const keysToRemove = Object.keys(localStorage).filter((key) =>
        key.startsWith('swin-')   ||   // our custom storageKey prefix
        key.startsWith('sb-')     ||   // default supabase-js prefix
        key.startsWith('supabase')     // older supabase-js versions
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Also clear sessionStorage entirely
      sessionStorage.clear();

      // Stamp the new version so we don't clear again until next bump
      localStorage.setItem('swin-app-version', APP_VERSION);

      console.info(`[SWIN] Cache cleared for version ${APP_VERSION}`);
    }
  } catch (e) {
    // Private browsing or storage blocked — safe to ignore
  }
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
