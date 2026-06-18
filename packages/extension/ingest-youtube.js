// Octoflash YouTube ingest — content script.
//
// Runs on every youtube.com page. Listens for two requests from the
// extension's background worker:
//
//   1. octoflash-ingest:extract-transcript
//        Pulls caption tracks from the page's ytInitialPlayerResponse
//        (the same JSON the YouTube player itself reads from), fetches
//        the timedtext endpoint with the user's signed-in session
//        cookies, and returns a plain-text transcript.
//
//   2. octoflash-ingest:capture-frames
//        Finds the <video> element, pauses it, seeks to N evenly-spaced
//        timestamps, draws each frame onto a canvas, and toDataURL()s
//        the result. Returns an array of JPEG data URLs.
//        On a tainted-canvas SecurityError (DRM, COEP, etc.), bails out
//        with `{ tainted: true }` so the background can fall back to the
//        YouTube poster thumbnail.
//
// Both handlers are sync-respond compatible — they always sendResponse
// once and return `true` to keep the channel open for async work.
//
// The content script never touches the network for anything but the
// timedtext request; the actual upload to the Octoflash backend happens
// in the background service worker so it can use chrome.storage.local
// for the Supabase JWT.

(function () {
  // ── transcript ───────────────────────────────────────────────────

  /** Pull ytInitialPlayerResponse from the page's MAIN world. Content
   * scripts run in an isolated world so we can't reach `window.ytInitialPlayerResponse`
   * directly; inject a <script> that posts the JSON back via DOM, then
   * read it. */
  function readPlayerResponse() {
    return new Promise((resolve) => {
      const slotId = "octoflash-player-slot";
      let slot = document.getElementById(slotId);
      if (!slot) {
        slot = document.createElement("script");
        slot.id = slotId;
        slot.textContent = `
          (function () {
            const send = (payload) => {
              const el = document.getElementById('octoflash-player-slot');
              if (el) el.dataset.payload = JSON.stringify(payload || null);
            };
            try {
              const pr = window.ytInitialPlayerResponse
                || (window.ytplayer && window.ytplayer.config && window.ytplayer.config.args
                    && window.ytplayer.config.args.raw_player_response);
              send(pr || null);
            } catch (e) {
              send({ __error: String(e) });
            }
          })();
        `;
        document.documentElement.appendChild(slot);
      } else {
        // Re-evaluate the script if the slot already exists (SPA navigation).
        // Recreating it forces re-execution.
        slot.remove();
        readPlayerResponse().then(resolve);
        return;
      }
      // Read the JSON we just injected.
      const raw = slot.dataset.payload;
      try {
        resolve(raw ? JSON.parse(raw) : null);
      } catch {
        resolve(null);
      }
    });
  }

  /** Given the player JSON, pick the best caption track URL. Prefers
   * the user's preferred language (UI locale), then English, then the
   * first available track. */
  function pickCaptionTrack(playerResponse) {
    const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!Array.isArray(tracks) || tracks.length === 0) return null;
    const prefer = (navigator.language || "en").slice(0, 2).toLowerCase();
    const byLang = (lang) =>
      tracks.find((t) => (t.languageCode || "").toLowerCase().startsWith(lang));
    return byLang(prefer) || byLang("en") || tracks[0];
  }

  /** Fetch the timedtext endpoint and convert the XML caption blob to
   * plain text. YouTube serves these as XML with <text> nodes; we just
   * decode entities and join. */
  async function fetchTranscript(captionTrack) {
    // Force JSON format — easier than XML parsing.
    const url = new URL(captionTrack.baseUrl);
    url.searchParams.set("fmt", "json3");
    const resp = await fetch(url.toString(), { credentials: "include" });
    if (!resp.ok) throw new Error(`timedtext HTTP ${resp.status}`);
    const data = await resp.json();
    const events = data?.events || [];
    const out = [];
    for (const ev of events) {
      const segs = ev.segs || [];
      for (const seg of segs) {
        const t = seg.utf8;
        if (t && t !== "\n") out.push(t);
      }
    }
    return out.join(" ").replace(/\s+/g, " ").trim();
  }

  // ── frames ───────────────────────────────────────────────────────

  function findVideoElement() {
    return (
      document.querySelector("video.html5-main-video") ||
      document.querySelector("video")
    );
  }

  function videoIdFromUrl() {
    const u = new URL(window.location.href);
    if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2];
    return u.searchParams.get("v") || null;
  }

  /** Wait for the video to seek to `targetTime` and finish painting one
   * frame. Resolves with the video element when ready. */
  function seekTo(video, targetTime) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`seek to ${targetTime}s timed out`));
      }, 5000);
      const onSeeked = () => {
        cleanup();
        // requestAnimationFrame ensures the seeked frame is rendered.
        requestAnimationFrame(() => resolve(video));
      };
      const cleanup = () => {
        clearTimeout(timeout);
        video.removeEventListener("seeked", onSeeked);
      };
      video.addEventListener("seeked", onSeeked, { once: true });
      try {
        video.currentTime = targetTime;
      } catch (e) {
        cleanup();
        reject(e);
      }
    });
  }

  async function captureFrames(maxFrames) {
    const video = findVideoElement();
    if (!video) throw new Error("no <video> element on this page");
    if (!video.duration || !Number.isFinite(video.duration)) {
      throw new Error("video duration unavailable — start playback first");
    }

    const wasPaused = video.paused;
    if (!wasPaused) video.pause();

    const canvas = document.createElement("canvas");
    canvas.width = Math.min(640, video.videoWidth || 640);
    canvas.height = Math.min(
      Math.round(canvas.width * ((video.videoHeight || 360) / (video.videoWidth || 640))),
      720,
    );
    const ctx = canvas.getContext("2d");

    const duration = video.duration;
    const count = Math.max(1, Math.min(24, maxFrames | 0));
    // Sample at 5%, 15%, 25%, ... of duration so we skip intros/outros.
    const stops = [];
    for (let i = 0; i < count; i++) {
      stops.push(duration * ((i + 0.5) / count));
    }

    const frames = [];
    try {
      for (const t of stops) {
        await seekTo(video, t);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        let dataUrl;
        try {
          dataUrl = canvas.toDataURL("image/jpeg", 0.78);
        } catch (e) {
          // SecurityError on tainted canvas (DRM-protected playback).
          // Caller falls back to poster.
          return { tainted: true, frames: [], reason: String(e) };
        }
        frames.push({
          captured_at: t,
          data_url: dataUrl,
          source: "canvas",
        });
      }
    } finally {
      if (!wasPaused) video.play().catch(() => {});
    }
    return { tainted: false, frames };
  }

  function posterFrame() {
    const vid = videoIdFromUrl();
    if (!vid) return null;
    return {
      captured_at: 0,
      // The data_url path is what the BE expects; we deliberately don't
      // download the JPEG here. The BE will accept an http(s) URL too —
      // but to keep the BE side honest and consistent, just emit a
      // marker and let the background fetch it.
      data_url: null,
      image_base64: null,
      source: "poster",
      poster_url: `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`,
    };
  }

  // ── message bus ──────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "octoflash-ingest:extract-transcript") {
      (async () => {
        try {
          const pr = await readPlayerResponse();
          if (!pr) {
            sendResponse({ ok: false, error: "Couldn't read player response from page" });
            return;
          }
          const track = pickCaptionTrack(pr);
          if (!track) {
            sendResponse({ ok: true, transcript: "", missing: true });
            return;
          }
          const transcript = await fetchTranscript(track);
          const meta = pr.videoDetails || {};
          sendResponse({
            ok: true,
            transcript,
            language: track.languageCode || null,
            title: meta.title || null,
            channel: meta.author || null,
            duration: meta.lengthSeconds ? Number(meta.lengthSeconds) : null,
            video_id: meta.videoId || videoIdFromUrl(),
          });
        } catch (e) {
          sendResponse({ ok: false, error: String(e) });
        }
      })();
      return true;
    }

    if (msg?.type === "octoflash-ingest:capture-frames") {
      (async () => {
        try {
          const result = await captureFrames(msg.maxFrames || 10);
          if (result.tainted) {
            const poster = posterFrame();
            sendResponse({
              ok: true,
              tainted: true,
              frames: poster ? [poster] : [],
              reason: result.reason,
            });
          } else {
            sendResponse({ ok: true, tainted: false, frames: result.frames });
          }
        } catch (e) {
          // Final fallback: poster only.
          const poster = posterFrame();
          sendResponse({
            ok: poster ? true : false,
            tainted: false,
            frames: poster ? [poster] : [],
            error: String(e),
          });
        }
      })();
      return true;
    }

    return false;
  });
})();
