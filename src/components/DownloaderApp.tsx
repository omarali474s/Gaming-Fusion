"use client";

import { useCallback, useRef, useState } from "react";
import {
  Clapperboard,
  Download,
  Film,
  Loader2,
  Music4,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { AudioOption, QualityOption, VideoInfoResult } from "@/types/youtube";
import ThankYouToast from "@/components/ThankYouToast";
import YoutubeIcon from "@/components/YoutubeIcon";

const YOUTUBE_CHANNEL_URL = "https://youtube.com/@robloxfriends_?si=YcIojcqRkd9kbzBT";

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

function parseFilenameFromHeader(header: string | null, fallback: string) {
  if (!header) return fallback;
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return fallback;
    }
  }
  const plainMatch = /filename="?([^";]+)"?/i.exec(header);
  return plainMatch ? plainMatch[1] : fallback;
}

type DownloadState = {
  key: string | null;
  progress: number | null;
  phase: "idle" | "preparing" | "downloading" | "ready";
};

export default function DownloaderApp() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfoResult | null>(null);
  const [lastUrl, setLastUrl] = useState("");
  const [download, setDownload] = useState<DownloadState>({
    key: null,
    progress: null,
    phase: "idle",
  });
  const [showToast, setShowToast] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchInfo = useCallback(async () => {
    if (!url.trim()) {
      setError("من فضلك ضع رابط فيديو يوتيوب أولاً.");
      return;
    }
    setLoading(true);
    setError(null);
    setVideoInfo(null);
    try {
      const res = await fetch("/api/video-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "تعذر جلب بيانات الفيديو.");
        return;
      }
      setVideoInfo(data as VideoInfoResult);
      setLastUrl(url);
    } catch {
      setError("تعذر الاتصال بالخادم، تأكد من اتصالك بالإنترنت وحاول مجددًا.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const startDownload = useCallback(
    async (option: QualityOption | AudioOption, type: "video" | "audio") => {
      if (!videoInfo) return;
      const key = option.key;

      const params = new URLSearchParams({
        url: lastUrl || url,
        mode: type,
        title: videoInfo.title,
      });

      if (type === "video") {
        const q = option as QualityOption;
        params.set("itag", String(q.itag));
        params.set("quality", q.label);
        if (q.needsMux && q.audioItag) params.set("audioItag", String(q.audioItag));
      } else {
        const a = option as AudioOption;
        params.set("bitrate", String(a.bitrateKbps));
        params.set("quality", a.label);
      }

      setError(null);
      setDownload({ key, progress: null, phase: "preparing" });

      try {
        const controller = new AbortController();
        abortRef.current = controller;
        const res = await fetch(`/api/download?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "تعذر تجهيز الملف، حاول مرة أخرى.");
          setDownload({ key: null, progress: null, phase: "idle" });
          return;
        }

        const contentLength = Number(res.headers.get("Content-Length") ?? 0);
        const contentType = res.headers.get("Content-Type") ?? "application/octet-stream";
        const fallbackExt = type === "audio" ? "mp3" : "mp4";
        const filename = parseFilenameFromHeader(
          res.headers.get("Content-Disposition"),
          `${videoInfo.title}.${fallbackExt}`,
        );

        setDownload({ key, progress: contentLength ? 0 : null, phase: "downloading" });

        const reader = res.body.getReader();
        const chunks: BlobPart[] = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value as unknown as BlobPart);
            received += value.length;
            if (contentLength) {
              setDownload({
                key,
                progress: Math.min(99, Math.round((received / contentLength) * 100)),
                phase: "downloading",
              });
            }
          }
        }

        const blob = new Blob(chunks, { type: contentType });
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 8000);

        setDownload({ key, progress: 100, phase: "ready" });
        setShowToast(true);
        setTimeout(() => setDownload({ key: null, progress: null, phase: "idle" }), 2200);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("حدث خطأ أثناء التحميل، حاول مرة أخرى.");
        }
        setDownload({ key: null, progress: null, phase: "idle" });
      }
    },
    [videoInfo, lastUrl, url],
  );

  return (
    <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-24">
      {/* Search box */}
      <div className="neon-border neon-card mx-auto rounded-2xl p-5 shadow-2xl sm:p-8">
        <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-300">
          <YoutubeIcon className="h-5 w-5" />
          الصق رابط فيديو يوتيوب هنا
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchInfo()}
            placeholder="https://www.youtube.com/watch?v=..."
            dir="ltr"
            className="w-full flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-left text-base text-slate-100 placeholder:text-slate-500 outline-none ring-cyan-400/40 transition focus:border-cyan-400/60 focus:ring-2"
          />
          <button
            onClick={fetchInfo}
            disabled={loading}
            className="btn-neon flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-display text-sm font-bold text-black transition active:scale-95 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> جاري الجلب...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" /> جلب الفيديو
              </>
            )}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>يدعم جميع الجودات: 360p · 480p · 720p · 1080p · 1440p (2K) · 4K + صوت MP3</span>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Result */}
      {videoInfo && (
        <div className="neon-border neon-card animate-toast-in mt-8 overflow-hidden rounded-2xl shadow-2xl">
          <div className="grid gap-0 md:grid-cols-[minmax(0,320px)_1fr]">
            <div className="relative aspect-video w-full md:aspect-auto md:h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-2 left-2 rounded-md bg-black/80 px-2 py-1 font-display text-xs font-bold text-cyan-300">
                {formatDuration(videoInfo.lengthSeconds)}
              </span>
            </div>
            <div className="p-5 sm:p-6">
              <h2 className="line-clamp-2 text-lg font-bold text-slate-50 sm:text-xl">
                {videoInfo.title}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                <Clapperboard className="h-4 w-4" /> {videoInfo.author}
              </p>

              {/* Video qualities */}
              <div className="mt-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-purple-300">
                  <Film className="h-4 w-4" /> جودات الفيديو
                </h3>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {videoInfo.qualities.map((quality) => (
                    <DownloadTile
                      key={quality.key}
                      isActive={download.key === quality.key}
                      phase={download.key === quality.key ? download.phase : "idle"}
                      progress={download.progress}
                      disabled={download.phase !== "idle" && download.key !== quality.key}
                      title={quality.label}
                      subtitle={[
                        quality.fps && quality.fps > 30 ? `${quality.fps}fps` : null,
                        quality.approxSizeMb ? `${quality.approxSizeMb}MB~` : null,
                        quality.needsMux ? "دمج صوت" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      onClick={() => startDownload(quality, "video")}
                    />
                  ))}
                </div>
              </div>

              {/* Audio qualities */}
              <div className="mt-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-pink-300">
                  <Music4 className="h-4 w-4" /> الصوت فقط (MP3)
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {videoInfo.audioOptions.map((audio) => (
                    <DownloadTile
                      key={audio.key}
                      isActive={download.key === audio.key}
                      phase={download.key === audio.key ? download.phase : "idle"}
                      progress={download.progress}
                      disabled={download.phase !== "idle" && download.key !== audio.key}
                      title={audio.label}
                      subtitle="MP3"
                      accent="pink"
                      onClick={() => startDownload(audio, "audio")}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!videoInfo && !loading && (
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Sparkles, title: "جودة حتى 4K", desc: "من 360p وحتى 4K الترا HD" },
            { icon: Music4, title: "استخراج صوت", desc: "MP3 بجودة 128 أو 320 كيلوبت" },
            { icon: Download, title: "تحميل مباشر", desc: "بدون تحويل لمواقع أخرى" },
          ].map((f) => (
            <div
              key={f.title}
              className="neon-border neon-card rounded-xl p-5 text-center transition hover:-translate-y-1"
            >
              <f.icon className="mx-auto h-7 w-7 text-cyan-300" />
              <h4 className="mt-3 font-display text-sm font-bold text-slate-100">{f.title}</h4>
              <p className="mt-1 text-xs text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      )}

      <ThankYouToast
        show={showToast}
        onClose={() => setShowToast(false)}
        channelUrl={YOUTUBE_CHANNEL_URL}
      />
    </div>
  );
}

function DownloadTile({
  title,
  subtitle,
  onClick,
  disabled,
  isActive,
  phase,
  progress,
  accent = "cyan",
}: {
  title: string;
  subtitle?: string;
  onClick: () => void;
  disabled: boolean;
  isActive: boolean;
  phase: DownloadState["phase"];
  progress: number | null;
  accent?: "cyan" | "pink";
}) {
  const isBusy = isActive && (phase === "preparing" || phase === "downloading");
  const isReady = isActive && phase === "ready";

  const borderColor = accent === "pink" ? "border-pink-400/30" : "border-cyan-400/30";
  const hoverColor = accent === "pink" ? "hover:border-pink-400/70" : "hover:border-cyan-400/70";
  const textColor = accent === "pink" ? "text-pink-300" : "text-cyan-300";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative overflow-hidden rounded-xl border ${borderColor} ${hoverColor} bg-black/30 px-3 py-3 text-right transition disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {isBusy && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-white/10">
          {progress === null ? (
            <div className="animate-indeterminate h-full w-1/3 bg-gradient-to-r from-cyan-400 to-pink-400" />
          ) : (
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-pink-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          )}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className={`font-display text-sm font-bold ${textColor}`}>{title}</span>
        {isBusy ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-300" />
        ) : isReady ? (
          <Download className="h-4 w-4 shrink-0 text-emerald-400" />
        ) : (
          <Download className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-slate-200" />
        )}
      </div>
      <div className="mt-1 h-4 text-[11px] text-slate-500">
        {isBusy
          ? phase === "preparing"
            ? "جاري التحضير..."
            : progress !== null
              ? `جاري التحميل ${progress}%`
              : "جاري التحميل..."
          : isReady
            ? "تنزيل الآن ⬇"
            : subtitle || "\u00A0"}
      </div>
    </button>
  );
}
