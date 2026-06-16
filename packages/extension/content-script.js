// Octoflash content script — token bridge.
//
// Runs on every Octoflash web-app page (localhost dev + production domains).
// Supabase JS persists the user's session in localStorage under
// `sb-<project_ref>-auth-token` as JSON. We forward the access_token to
// the extension's background worker so the popup + cookie-sync flows can
// authenticate against the Octoflash backend as the same signed-in user.
//
// This is the "token bridge" half of the design: the user signs in to the
// web app exactly once; the extension piggybacks on that session.

(function () {
  // Supabase keys this format. Hard-coded to the Octoflash project ref so we
  // don't accidentally forward a different app's token.
  const SUPABASE_PROJECT_REF = "ivltxjenpofodwkipvsz";
  const STORAGE_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`;

  function readToken() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Supabase v2 shape: { access_token, refresh_token, expires_at, user, ... }
      return parsed?.access_token || null;
    } catch {
      return null;
    }
  }

  function publishToken() {
    const token = readToken();
    if (!token) return;
    try {
      chrome.runtime.sendMessage(
        { type: "octoflash:auth-token", token, origin: window.location.origin },
        // Ignore response; background just stashes it.
        () => void chrome.runtime.lastError,
      );
    } catch {
      // Extension context invalidated (reloaded) — silently no-op.
    }
  }

  // Publish once on load.
  publishToken();

  // Re-publish whenever Supabase rotates the token (every ~1 hr by default).
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) publishToken();
  });

  // Also poll every 60s as a belt-and-suspenders against single-tab
  // refreshes that don't fire storage events.
  setInterval(publishToken, 60_000);
})();
