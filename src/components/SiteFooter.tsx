import YoutubeIcon from "@/components/YoutubeIcon";

const YOUTUBE_CHANNEL_URL = "https://youtube.com/@robloxfriends_?si=YcIojcqRkd9kbzBT";

export default function SiteFooter() {
  return (
    <footer className="relative z-10 mx-auto mt-8 w-full max-w-6xl px-4 pb-10 text-center">
      <div className="mx-auto mb-6 h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      <p className="font-display text-lg font-black">
        <span className="neon-text">Gaming Fusion</span>
      </p>
      <a
        href={YOUTUBE_CHANNEL_URL}
        target="_blank"
        rel="noreferrer"
        className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-bold text-slate-300 transition hover:border-pink-400/60 hover:text-pink-300"
      >
        <YoutubeIcon className="h-4 w-4 text-red-500" />
        لا تنسَ متابعتنا على يوتيوب
      </a>
      <p className="mx-auto mt-5 max-w-xl text-[11px] leading-relaxed text-slate-600">
        هذا الموقع مخصص للاستخدام الشخصي والتعليمي فقط. يرجى احترام حقوق الملكية الفكرية وعدم
        تحميل محتوى محمي إلا بإذن صاحبه. © {new Date().getFullYear()} Gaming Fusion.
      </p>
    </footer>
  );
}
