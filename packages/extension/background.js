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
  if (msg?.type === "octoflash:ingest-current-youtube-tab") {
    (async () => {
      try {
        const out = await runLocalIngest(msg.options || {});
        sendResponse({ ok: true, ...out });
      } catch (err) {
        sendResponse({ ok: false, error: err?.message || String(err) });
      }
    })();
    return true;
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

// ─── local YouTube ingest orchestrator ───────────────────────────────
// Side panel triggers this when the user clicks "Ingest from this tab".
// We ask the YouTube content script for transcript + sampled frames, then
// POST the bundle to /api/v1/projects/from-local-ingest. Sends per-step
// progress events back to the side panel via chrome.runtime.sendMessage
// so the UI can show "Extracting transcript… / Capturing N frames… / Uploading…".

const YT_HOST_RE = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\//;

async function runLocalIngest({ maxFrames = 10, ingestOptions = {} } = {}) {
  const { authToken } = await chrome.storage.local.get(["authToken"]);
  if (!authToken) {
    throw new Error(
      "Not signed in to Octoflash. Open the Octoflash web app in another tab and sign in.",
    );
  }

  // 1. Find the active YouTube tab.
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.url || !YT_HOST_RE.test(tab.url)) {
    throw new Error("Active tab is not a YouTube page. Open the video first.");
  }

  publishProgress("Reading captions…");
  const meta = await extractYouTubeTranscript(tab.id);
  if (!meta?.ok) {
    throw new Error(meta?.error || "Couldn't read captions from the page.");
  }

  publishProgress(`Sampling up to ${maxFrames} frames…`);
  const framesRes = await sendToTabWithInject(
    tab.id,
    { type: "octoflash-ingest:capture-frames", maxFrames },
    "ingest-youtube.js",
  );
  if (!framesRes?.ok) {
    throw new Error(framesRes?.error || "Frame capture failed.");
  }

  // Poster-fallback: when the canvas was tainted (DRM), the content
  // script returned a {poster_url} marker. Convert it to base64 here so
  // the BE schema (image_base64 / data_url) is satisfied.
  const frames = await Promise.all(
    (framesRes.frames || []).map(async (f) => {
      if (f.source === "poster" && f.poster_url && !f.data_url && !f.image_base64) {
        try {
          const b64 = await fetchAsBase64(f.poster_url);
          return { source: "poster", image_base64: b64, captured_at: 0 };
        } catch {
          return null;
        }
      }
      return f;
    }),
  );
  const cleanFrames = frames.filter(Boolean);

  // 2. POST the bundle.
  publishProgress("Uploading to Octoflash…");
  const { apiUrl } = await chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL });
  const body = {
    source_url: tab.url,
    title: meta.title || null,
    transcript: meta.transcript || "",
    source_duration: meta.duration || null,
    frames: cleanFrames,
    ...ingestOptions,
  };
  const res = await fetch(`${apiUrl}/api/v1/projects/from-local-ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `HTTP ${res.status}`);
  }
  const data = await res.json();
  const projectId = data?.result?.id ?? data?.id ?? "unknown";
  publishProgress(`Done — project ${projectId}.`);
  return {
    projectId,
    transcriptChars: (meta.transcript || "").length,
    frameCount: cleanFrames.length,
    tainted: framesRes.tainted === true,
  };
}

function publishProgress(message) {
  // Fire-and-forget broadcast. Side panel (if open) hears it; nobody
  // else cares.
  try {
    chrome.runtime
      .sendMessage({ type: "octoflash:ingest-progress", message })
      .catch(() => {});
  } catch {
    // Service worker may not allow promise-style; swallow.
  }
}

function sendToTab(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

const _MISSING_RECEIVER_HINTS = [
  "could not establish connection",
  "receiving end does not exist",
  "message port closed",
];

function looksLikeMissingReceiver(errMsg) {
  if (!errMsg) return false;
  const lower = String(errMsg).toLowerCase();
  return _MISSING_RECEIVER_HINTS.some((h) => lower.includes(h));
}

/** Send a message to a tab. If the content script wasn't present
 * (extension was reloaded while the tab stayed open), inject it via
 * chrome.scripting and retry exactly once. */
async function sendToTabWithInject(tabId, message, scriptFile) {
  let res = await sendToTab(tabId, message);
  if (res?.ok !== false || !looksLikeMissingReceiver(res?.error)) return res;
  if (!chrome.scripting || !chrome.scripting.executeScript) return res;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [scriptFile],
    });
  } catch (e) {
    return { ok: false, error: `inject ${scriptFile} failed: ${e?.message || e}` };
  }
  return await sendToTab(tabId, message);
}

/** Pull `ytInitialPlayerResponse` from a YouTube tab's MAIN world.
 * Content scripts run in an isolated world and an inline injected
 * <script> is blocked by YouTube's strict CSP, so we use
 * chrome.scripting.executeScript with world:"MAIN" instead. */
async function getYouTubePlayerResponse(tabId) {
  if (!chrome.scripting?.executeScript) {
    throw new Error("chrome.scripting unavailable (need MV3 + scripting perm)");
  }
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: () => {
      try {
        const pr =
          window.ytInitialPlayerResponse ||
          (window.ytplayer?.config?.args?.raw_player_response &&
            JSON.parse(window.ytplayer.config.args.raw_player_response)) ||
          null;
        if (!pr) return { ok: false, error: "no ytInitialPlayerResponse on window" };
        // Strip down to just what we need — the full object can be huge
        // and structured-clone of the whole thing is wasteful.
        return {
          ok: true,
          captions: pr.captions?.playerCaptionsTracklistRenderer?.captionTracks || [],
          videoDetails: {
            title: pr.videoDetails?.title || null,
            author: pr.videoDetails?.author || null,
            videoId: pr.videoDetails?.videoId || null,
            lengthSeconds: pr.videoDetails?.lengthSeconds
              ? Number(pr.videoDetails.lengthSeconds)
              : null,
          },
        };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    },
  });
  return results?.[0]?.result || { ok: false, error: "no MAIN-world result" };
}

function pickCaptionTrack(tracks, prefer) {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;
  const want = (prefer || "en").slice(0, 2).toLowerCase();
  const byLang = (lang) =>
    tracks.find((t) => (t.languageCode || "").toLowerCase().startsWith(lang));
  return byLang(want) || byLang("en") || tracks[0];
}

async function extractYouTubeTranscript(tabId) {
  let player;
  try {
    player = await getYouTubePlayerResponse(tabId);
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
  if (!player.ok) return { ok: false, error: player.error };

  const meta = player.videoDetails || {};
  const track = pickCaptionTrack(player.captions, navigator.language);
  if (!track) {
    return {
      ok: true,
      transcript: "",
      missing: true,
      title: meta.title,
      duration: meta.lengthSeconds,
      video_id: meta.videoId,
    };
  }
  try {
    const url = new URL(track.baseUrl);
    url.searchParams.set("fmt", "json3");
    const resp = await fetch(url.toString(), { credentials: "include" });
    if (!resp.ok) throw new Error(`timedtext HTTP ${resp.status}`);
    const data = await resp.json();
    const out = [];
    for (const ev of data?.events || []) {
      for (const seg of ev.segs || []) {
        const t = seg.utf8;
        if (t && t !== "\n") out.push(t);
      }
    }
    return {
      ok: true,
      transcript: out.join(" ").replace(/\s+/g, " ").trim(),
      language: track.languageCode || null,
      title: meta.title,
      duration: meta.lengthSeconds,
      video_id: meta.videoId,
    };
  } catch (e) {
    return { ok: false, error: `timedtext fetch failed: ${e?.message || e}` };
  }
}

async function fetchAsBase64(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`poster HTTP ${resp.status}`);
  const blob = await resp.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      // result is `data:image/jpeg;base64,XXX` — strip the prefix.
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}
