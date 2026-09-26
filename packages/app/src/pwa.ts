import { registerSW } from 'virtual:pwa-register';

// How often to ask the browser to re-check `/sw.js` for a new deploy while the
// app stays open. Installed PWAs can be suspended for days without a page load,
// so relying on the initial registration alone can leave users on a stale build.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Register the service worker and keep it fresh.
 *
 * The Vite PWA config uses `registerType: 'autoUpdate'`, so `registerSW` reloads
 * the page automatically once a new worker has activated. Workbox still
 * precaches the app shell, so the app continues to work offline: update checks
 * only happen when the network is reachable, and a failed check is a no-op.
 */
export function registerServiceWorker(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const checkForUpdate = () => {
        void registration.update();
      };

      setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
    },
  });
}
