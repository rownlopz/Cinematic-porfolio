export type VideoSource =
  | { kind: "youtube"; id: string; embedUrl: string; thumbnail: string }
  | { kind: "vimeo"; id: string; embedUrl: string; thumbnail: string | null }
  | { kind: "file"; url: string }
  | null;

const YT = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const VIMEO = /vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d{6,12})(?:\/([a-f0-9]{8,}))?/;

/** Parse a pasted URL into a safe embed description. Only allow-listed hosts are ever embedded. */
export function parseVideo(url: string | null | undefined): VideoSource {
  if (!url) return null;
  const u = url.trim();
  const yt = u.match(YT);
  if (yt) {
    return {
      kind: "youtube",
      id: yt[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1&playsinline=1`,
      thumbnail: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`,
    };
  }
  const vi = u.match(VIMEO);
  if (vi) {
    const hash = vi[2] ? `&h=${vi[2]}` : "";
    return {
      kind: "vimeo",
      id: vi[1],
      embedUrl: `https://player.vimeo.com/video/${vi[1]}?dnt=1${hash}`,
      thumbnail: `https://vumbnail.com/${vi[1]}.jpg`,
    };
  }
  try {
    const parsed = new URL(u);
    if (parsed.protocol === "https:" && /\.(mp4|webm|mov)$/i.test(parsed.pathname)) {
      return { kind: "file", url: parsed.toString() };
    }
  } catch {
    /* not a URL */
  }
  return null;
}

export function isSupportedVideoUrl(url: string): boolean {
  return parseVideo(url) !== null;
}
