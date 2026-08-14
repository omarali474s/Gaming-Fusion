import YoutubeIcon from "@/components/YoutubeIcon";
import { Zap } from "lucide-react";

const YOUTUBE_CHANNEL_URL = "https://youtube.com/@robloxfriends_?si=YcIojcqRkd9kbzBT";

export default function SiteHeader() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:py-8">
      <div className="flex items-center gap-2.5">
        <div className="neon-border glow-pulse flex h-11 w-11 items-center justify-center rounded-xl bg-black/40">
          <Zap className="h-6 w-6 text-cyan-300" />
        </div>
        <div className="leading-tight">
          <h1 className="font-display text-xl font-black tracking-wide sm:text-2xl">
            <span className="neon-text">Gaming Fusion</span>
          </h1>
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            Veloce Downloader Engine
          </p>
        </div>
      </div>

      <a
        href={YOUTUBE_CHANNEL_URL}
        target="_blank"
        rel="noreferrer"
        className="neon-border hidden items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs font-bold text-slate-200 transition hover:border-pink-400/60 hover:text-pink-300 sm:flex"
      >
        <YoutubeIcon className="h-4 w-4 text-red-500" />
        قناتنا على يوتيوب
      </a>
    </header>
  );
}
