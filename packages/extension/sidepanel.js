// Octoflash Chrome Extension - Popup

const DEFAULT_API_URL = "https://api-production-9e2a5.up.railway.app";

const DEFAULTS = {
  quality: "720p",
  orientation: "portrait",
  voiceover: "yes",
  length: "120",
};

const els = {
  url: document.getElementById("urlInput"),
  queueBtn: document.getElementById("queueBtn"),
  status: document.getElementById("status"),
  apiUrl: document.getElementById("apiUrl"),
  saveBtn: document.getElementById("saveBtn"),
  quality: document.getElementById("quality"),
  orientation: document.getElementById("orientation"),
  voiceover: document.getElementById("voiceover"),
  length: document.getElementById("length"),
  ytStatus: document.getElementById("ytStatus"),
  connectYtBtn: document.getElementById("connectYtBtn"),
};

// Load persisted settings.
chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL, ...DEFAULTS }, (data) => {
  els.apiUrl.value = data.apiUrl;
  els.quality.value = data.quality;
  els.orientation.value = data.orientation;
  els.voiceover.value = data.voiceover;
  els.length.value = data.length;
});

// Auto-fill current tab URL if it's YouTube.
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (tab?.url && (tab.url.includes("youtube.com") || tab.url.includes("youtu.be"))) {
    els.url.value = tab.url;
  }
});

// Persist dropdown changes immediately (so context-menu queues use them too).
for (const id of ["quality", "orientation", "voiceover", "length"]) {
  els[id].addEventListener("change", () => {
    chrome.storage.sync.set({ [id]: els[id].value });
  });
}

function readOptions() {
  return {
    quality: els.quality.value,
    orientation: els.orientation.value,
    voiceover: els.voiceover.value === "yes",
    length_seconds: Number(els.length.value),
  };
}

// Queue video.
els.queueBtn.addEventListener("click", async () => {
  const url = els.url.value.trim();
  if (!url) {
    showStatus("Please enter a YouTube URL", "error");
    return;
  }

  els.queueBtn.disabled = true;
  els.queueBtn.textContent = "Queuing...";
  els.status.className = "status";

  try {
    const { apiUrl } = await chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL });
    const options = readOptions();
    // Pull the Supabase JWT the content script published so the queued
    // project lands under the signed-in user — otherwise the BE falls
    // through to default_user_id and the per-user YouTube cookies lookup
    // misses.
    const { authToken } = await chrome.storage.local.get(["authToken"]);
    const headers = { "Content-Type": "application/json" };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const res = await fetch(`${apiUrl}/api/v1/projects/from-source`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source_url: url,
        title: null,
        orientation: options.orientation,
        quality: options.quality,
        voiceover: options.voiceover,
        target_duration: options.length_seconds,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.detail || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const projectId = data?.result?.project?.id ?? data?.project?.id ?? "ok";
    showStatus(`Queued! ${projectId}`, "success");
    els.url.value = "";
  } catch (err) {
    showStatus(err.message, "error");
  } finally {
    els.queueBtn.disabled = false;
    els.queueBtn.textContent = "Queue Video";
  }
});

// Save settings.
els.saveBtn.addEventListener("click", () => {
  const apiUrl = els.apiUrl.value.trim().replace(/\/+$/, "") || DEFAULT_API_URL;
  chrome.storage.sync.set({ apiUrl }, () => {
    els.apiUrl.value = apiUrl;
    els.saveBtn.textContent = "Saved!";
    setTimeout(() => (els.saveBtn.textContent = "Save Settings"), 1500);
  });
});

function showStatus(msg, type) {
  els.status.textContent = msg;
  els.status.className = `status ${type}`;
}

// ─── YouTube connection panel ─────────────────────────────────────────

function formatRelative(ts) {
  if (!ts) return "never";
  const seconds = Math.round((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}

function refreshYtStatus() {
  chrome.runtime.sendMessage({ type: "octoflash:get-status" }, (s) => {
    if (chrome.runtime.lastError || !s) {
      els.ytStatus.textContent = "Status unavailable.";
      return;
    }
    if (!s.signedIn) {
      els.ytStatus.textContent =
        "Not signed in. Open the Octoflash web app in another tab, sign in, then reopen this popup.";
      els.connectYtBtn.disabled = true;
      return;
    }
    els.connectYtBtn.disabled = false;
    if (s.cookiesSyncedAt) {
      els.ytStatus.textContent = `Connected. ${s.cookiesCount} cookies synced ${formatRelative(s.cookiesSyncedAt)}.`;
    } else {
      els.ytStatus.textContent = "Signed in to Octoflash. Click below to sync your YouTube cookies.";
    }
  });
}

els.connectYtBtn.addEventListener("click", () => {
  els.connectYtBtn.disabled = true;
  els.connectYtBtn.textContent = "Syncing…";
  chrome.runtime.sendMessage({ type: "octoflash:sync-youtube-cookies" }, (res) => {
    els.connectYtBtn.textContent = "Sync YouTube cookies";
    if (chrome.runtime.lastError || !res) {
      els.ytStatus.textContent = chrome.runtime.lastError?.message || "Sync failed.";
      els.connectYtBtn.disabled = false;
      return;
    }
    if (!res.ok) {
      els.ytStatus.textContent = res.error || "Sync failed.";
      els.connectYtBtn.disabled = false;
      return;
    }
    els.ytStatus.textContent = `Synced ${res.count} cookies just now.`;
    refreshYtStatus();
  });
});

refreshYtStatus();
