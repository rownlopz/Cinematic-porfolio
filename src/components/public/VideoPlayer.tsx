"use client";
import { useState } from "react";
import { parseVideo } from "@/lib/video";

/**
 * Click-to-play player. Nothing heavy loads (no iframe, no video bytes) until the visitor
 * presses play, and playback never starts on its own, so audio is never autoplayed.
 */
export function VideoPlayer({
  url,
  poster,
  title,
  emptyLabel = "No video added yet",
}: {
  url: string | null | undefined;
  poster?: string | null;
  title: string;
  emptyLabel?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const src = parseVideo(url);

  if (!src) {
    return (
      <div className="player player--empty fx-halftone" role="img" aria-label={emptyLabel}>
        <div>
          <p className="display h-md">{emptyLabel}</p>
          <p className="label" style={{ marginTop: 12 }}>Add one in the admin dashboard</p>
        </div>
      </div>
    );
  }

  const posterUrl = poster || (src.kind !== "file" ? src.thumbnail : null);

  return (
    <div className="player">
      {playing ? (
        src.kind === "file" ? (
          <video src={src.url} poster={poster ?? undefined} controls autoPlay playsInline preload="metadata" aria-label={title} />
        ) : (
          <iframe
            src={`${src.embedUrl}${src.embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )
      ) : (
        <button type="button" className="player__poster" onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`}>
          {posterUrl && <img src={posterUrl} alt="" loading="lazy" decoding="async" />}
          <span className="player__btn" aria-hidden>
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </span>
          <span className="player__tc" aria-hidden>PLAY ▸ {title.toUpperCase()}</span>
        </button>
      )}
    </div>
  );
}
