// Octoflash YouTube ingest — content script.
//
// Runs on every youtube.com page. Handles ONE request from the
// extension's background worker:
//
//   octoflash-ingest:capture-frames
//     Finds the <video> element, pauses it, seeks to N evenly-spaced
//     timestamps, draws each frame onto a canvas, and toDataURL()s
//     the result. Returns an array of JPEG data URLs.
//     On a tainted-canvas SecurityError (DRM, COEP, etc.), bails out
//     with `{ tainted: true }` so the background can fall back to the
//     YouTube poster thumbnail.
//
// Transcript extraction used to live here, but YouTube's CSP blocks the
// inline-script trick needed to read window.ytInitialPlayerResponse from
// the page's MAIN world. The background now uses
// chrome.scripting.executeScript({world:"MAIN", func:…}) for that.

(function () {
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
