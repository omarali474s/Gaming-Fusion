import { sql } from "drizzle-orm";
import { db } from "@/db";
import { downloadLogs } from "@/db/schema";
import NeonBackground from "@/components/NeonBackground";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import DownloaderApp from "@/components/DownloaderApp";
import { Gamepad2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function getTotalDownloads() {
  try {
    const [row] = await db.select({ total: sql<number>`count(*)::int` }).from(downloadLogs);
    return row?.total ?? 0;
  } catch {
    return 0;
  }
}

export default async function HomePage() {
  const total = await getTotalDownloads();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <NeonBackground />
      <SiteHeader />

      <section className="relative z-10 mx-auto w-full max-w-5xl px-4 pt-4 pb-10 text-center sm:pt-10">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs font-bold text-emerald-300">
          <Gamepad2 className="h-4 w-4" />
          {total.toLocaleString("ar-EG")} تحميل تم بنجاح حتى الآن
        </div>
        <h2 className="font-display text-[clamp(1.8rem,5vw,3.4rem)] font-black leading-[1.15] text-slate-50">
          حمّل فيديوهات <span className="neon-text">يوتيوب</span> بأي جودة
          <br className="hidden sm:block" /> من 360p وحتى 4K
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400 sm:text-base">
          الصق رابط الفيديو، اختر الجودة، واضغط تنزيل — يبدأ التحميل مباشرة على جهازك بدون أي
          إعلانات مزعجة أو تحويل لمواقع أخرى.
        </p>
      </section>

      <DownloaderApp />
      <SiteFooter />
    </main>
  );
}
