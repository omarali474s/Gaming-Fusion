import youtubedl from "youtube-dl-exec";
import type { AudioOption, QualityOption, VideoInfoResult } from "@/types/youtube";

export type { QualityOption, AudioOption, VideoInfoResult };

type RawFormat = {
  format_id: string;
  ext?: string;
  height?: number | null;
  vcodec?: string | null;
  acodec?: string | null;
  fps?: number | null;
  tbr?: number | null;
  abr?: number | null;
  filesize?: number | null;
  filesize_approx?: number | null;
};

type RawInfo = {
  id: string;
  title: string;
  uploader?: string;
  channel?: string;
  duration?: number;
  thumbnail?: string;
  thumbnails?: { url: string; width?: number; height?: number }[];
  formats: RawFormat[];
};

const TIERS: { resolution: number; label: string }[] = [
  { resolution: 2160, label: "4K (2160p)" },
  { resolution: 1440, label: "2K (1440p)" },
  { resolution: 1080, label: "1080p Full HD" },
  { resolution: 720, label: "720p HD" },
  { resolution: 480, label: "480p" },
  { resolution: 360, label: "360p" },
];

function hasVideo(format: RawFormat) {
  return !!format.vcodec && format.vcodec !== "none";
}

function hasAudio(format: RawFormat) {
  return !!format.acodec && format.acodec !== "none";
}

function sizeInMb(format: RawFormat): number | null {
  const bytes = format.filesize ?? format.filesize_approx ?? null;
  if (!bytes) return null;
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
}

function codecScore(format: RawFormat): number {
  const codec = format.vcodec ?? "";
  if (codec.startsWith("avc1")) return 3;
  if (codec.startsWith("av01")) return 2;
  if (codec.startsWith("vp9")) return 1;
  return 0;
}

export function extractVideoId(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        return id && /^[\w-]{11}$/.test(id) ? id : null;
      }
      const parts = url.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live", "v"].includes(parts[0]) && parts[1]) {
        return /^[\w-]{11}$/.test(parts[1]) ? parts[1] : null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchRawInfo(url: string): Promise<RawInfo> {
  const result = await youtubedl.exec(url, {
    dumpSingleJson: true,
    noWarnings: true,
    noCheckCertificates: true,
    preferFreeFormats: true,
    noPlaylist: true,
    ignoreErrors: false,
  });
  return JSON.parse(result.stdout) as RawInfo;
}

export async function fetchVideoInfo(url: string): Promise<VideoInfoResult> {
  const data = await fetchRawInfo(url);

  const audioFormats = data.formats.filter((f) => hasAudio(f) && !hasVideo(f));
  const bestAudio = audioFormats
    .slice()
    .sort((a, b) => (b.abr ?? b.tbr ?? 0) - (a.abr ?? a.tbr ?? 0))[0];

  const qualities: QualityOption[] = [];

  for (const tier of TIERS) {
    const candidates = data.formats.filter((f) => hasVideo(f) && f.height === tier.resolution);
    if (candidates.length === 0) continue;

    const progressive = candidates.find((f) => hasAudio(f));
    const adaptiveSorted = candidates
      .filter((f) => !hasAudio(f))
      .sort((a, b) => codecScore(b) - codecScore(a));

    const chosen = progressive ?? adaptiveSorted[0];
    if (!chosen) continue;

    qualities.push({
      key: `${tier.resolution}p`,
      label: tier.label,
      resolution: tier.resolution,
      itag: chosen.format_id,
      container: chosen.ext ?? "mp4",
      needsMux: !hasAudio(chosen),
      audioItag: hasAudio(chosen) ? null : (bestAudio?.format_id ?? null),
      approxSizeMb: sizeInMb(chosen),
      fps: chosen.fps ?? null,
    });
  }

  qualities.sort((a, b) => b.resolution - a.resolution);

  const audioOptions: AudioOption[] = [
    { key: "audio-320", label: "MP3 - 320kbps (أعلى جودة)", bitrateKbps: 320 },
    { key: "audio-128", label: "MP3 - 128kbps (حجم أصغر)", bitrateKbps: 128 },
  ];

  const bestThumbnail = data.thumbnails?.slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];

  return {
    videoId: data.id,
    title: data.title,
    author: data.uploader ?? data.channel ?? "غير معروف",
    lengthSeconds: data.duration ?? 0,
    thumbnail: bestThumbnail?.url ?? data.thumbnail ?? `https://i.ytimg.com/vi/${data.id}/maxresdefault.jpg`,
    qualities,
    audioOptions,
    bestAudioItag: 0,
  };
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
