// Octoflash Chrome Extension - Background Service Worker
//
// Two jobs:
//   1. Right-click "Queue in Octoflash" — POST source URL to /projects/from-source.
//   2. YouTube cookie sync — read user's signed-in youtube.com cookies via
//      chrome.cookies, format as Netscape cookies.txt, and PUT to
//      /api/v1/credentials/youtube_cookies. Without this, the backend
//      gets IP-blocked by YouTube whenever it tries to download source video.
//      Auto-refreshes weekly via chrome.alarms so cookies stay current
//      with no user touch.

const DEFAULT_API_URL = "https://api-production-9e2a5.up.railway.app";

const DEFAULT_OPTIONS = {
  quality: "720p",
  orientation: "portrait",
  voiceover: "yes",
  length: "120",
};

// chrome.alarms periodInMinutes — 7 days. Weekly refresh keeps the
// cookies fresh well inside YouTube's rotation window.
const COOKIE_REFRESH_ALARM = "octoflash:youtube-cookies-refresh";
const COOKIE_REFRESH_PERIOD_MINUTES = 7 * 24 * 60;

// ─── install / wake-up ────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "queue-octoflash",
    title: "Queue in Octoflash",
    contexts: ["page", "link", "video"],
    documentUrlPatterns: [
      "*://www.youtube.com/*",
      "*://youtu.be/*",
      "*://m.youtube.com/*",
    ],
  });

  // Idempotent alarm registration — Chrome no-ops if it already exists.
  chrome.alarms.create(COOKIE_REFRESH_ALARM, {
    periodInMinutes: COOKIE_REFRESH_PERIOD_MINUTES,
    delayInMinutes: 1, // run shortly after install too
  });
});

// Open the side panel when the user clicks the toolbar action button.
// Without this, the click is a no-op when no `action.default_popup` is set.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.warn("Octoflash: sidePanel.setPanelBehavior failed:", err));

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== COOKIE_REFRESH_ALARM) return;
  try {
    await syncYouTubeCookies();
  } catch (err) {
    console.warn("Octoflash: scheduled cookie sync failed:", err?.message || err);
  }
});

// ─── context menu (existing) ──────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "queue-octoflash") return;
  const url = info.linkUrl || info.srcUrl || info.pageUrl || tab?.url;
  if (!url) {
    showBadge("ERR", "#dc2626");
    return;
  }
  await queueVideo(url);
});

async function queueVideo(url) {
  try {
    const cfg = await chrome.storage.sync.get({
      apiUrl: DEFAULT_API_URL,
      ...DEFAULT_OPTIONS,
    });
    const headers = { "Content-Type": "application/json", ...(await authHeader()) };
    const body = {
      source_url: url,
      title: null,
      orientation: cfg.orientation,
      quality: cfg.quality,
      voiceover: cfg.voiceover === "yes",
      target_duration: Number(cfg.length),
    };
    const res = await fetch(`${cfg.apiUrl}/api/v1/projects/from-source`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.detail || `HTTP ${res.status}`);
    }
    showBadge("OK", "#16a34a");
  } catch (err) {
    console.error("Octoflash queue failed:", err);
    showBadge("ERR", "#dc2626");
  }
}

function showBadge(text, color) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 3000);
}

// ─── auth bridge ──────────────────────────────────────────────────────
// Content script publishes the Supabase access_token from the Octoflash web
// app's localStorage; we cache it in storage.local so the popup + alarm
// handlers can use it.

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "octoflash:auth-token" && typeof msg.token === "string") {
    chrome.storage.local.set({
      authToken: msg.token,
      authTokenUpdatedAt: Date.now(),
      authTokenOrigin: msg.origin || null,
    });
    sendResponse({ ok: true });
    return false; // sync response
  }
  if (msg?.type === "octoflash:sync-youtube-cookies") {
    // Popup-initiated manual sync. Run async and respond when done.
    (async () => {
      try {
        const out = await syncYouTubeCookies();
        sendResponse({ ok: true, ...out });
      } catch (err) {
        sendResponse({ ok: false, error: err?.message || String(err) });
      }
    })();
    return true; // keep channel open for async sendResponse
  }
  if (msg?.type === "octoflash:get-status") {
    (async () => {
      const { authToken, authTokenUpdatedAt, cookiesSyncedAt, cookiesCount } =
        await chrome.storage.local.get([
          "authToken",
          "authTokenUpdatedAt",
          "cookiesSyncedAt",
          "cookiesCount",
        ]);
      sendResponse({
        signedIn: Boolean(authToken),
        authTokenUpdatedAt: authTokenUpdatedAt || null,
        cookiesSyncedAt: cookiesSyncedAt || null,
        cookiesCount: cookiesCount || 0,
      });
    })();
    return true;
  }
  return false;
});

async function authHeader() {
  const { authToken } = await chrome.storage.local.get(["authToken"]);
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

// ─── YouTube cookie sync ──────────────────────────────────────────────

async function syncYouTubeCookies() {
  const { authToken } = await chrome.storage.local.get(["authToken"]);
  if (!authToken) {
    throw new Error(
      "Not signed in to Octoflash. Open the Octoflash web app in another tab, sign in, then try again."
    );
  }

  // Pull every cookie scoped to any youtube.com domain. chrome.cookies.getAll
  // matches the exact `domain` string; passing `.youtube.com` returns cookies
  // set with that scope. To be exhaustive across subdomain variants, hit a
  // few likely scopes and dedupe.
  const scopes = [
    ".youtube.com",
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "studio.youtube.com",
  ];
  const seen = new Map();
  for (const domain of scopes) {
    const batch = await chrome.cookies.getAll({ domain });
    for (const c of batch) {
      // Dedupe by (name, domain, path).
      const key = `${c.name}\t${c.domain}\t${c.path}`;
      if (!seen.has(key)) seen.set(key, c);
    }
  }
  const cookies = [...seen.values()];

  if (cookies.length === 0) {
    throw new Error(
      "No YouTube cookies found. Open youtube.com in this browser and sign in to your Google account first."
    );
  }

  const cookiesTxt = toNetscapeCookiesTxt(cookies);

  const { apiUrl } = await chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL });
  const res = await fetch(`${apiUrl}/api/v1/credentials/youtube_cookies`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ value: cookiesTxt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `HTTP ${res.status}`);
  }

  await chrome.storage.local.set({
    cookiesSyncedAt: Date.now(),
    cookiesCount: cookies.length,
  });
  return { count: cookies.length };
}

// Netscape cookies.txt — the format yt-dlp expects with `--cookies <file>`.
// One tab-separated row per cookie:
//   domain  TRUE/FALSE  path  TRUE/FALSE  expires  name  value
function toNetscapeCookiesTxt(cookies) {
  const lines = [
    "# Netscape HTTP Cookie File",
    "# https://curl.se/docs/http-cookies.html",
    "# Exported by Octoflash Connector",
  ];
  for (const c of cookies) {
    // Chrome's cookie.domain already starts with "." when host-only is false.
    const domain = c.domain.startsWith(".") || c.hostOnly === false
      ? c.domain
      : c.domain;
    const includeSubdomains = domain.startsWith(".") ? "TRUE" : "FALSE";
    const secureFlag = c.secure ? "TRUE" : "FALSE";
    // Session cookies → 0 in cookies.txt.
    const expires = c.expirationDate ? Math.floor(c.expirationDate) : 0;
    lines.push(
      [domain, includeSubdomains, c.path || "/", secureFlag, expires, c.name, c.value].join("\t"),
    );
  }
  return lines.join("\n") + "\n";
}
