"use client";

import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import YoutubeIcon from "@/components/YoutubeIcon";

export default function ThankYouToast({
  show,
  onClose,
  channelUrl,
}: {
  show: boolean;
  onClose: () => void;
  channelUrl: string;
}) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:left-4 sm:bottom-6 sm:w-96">
      <div className="animate-toast-in neon-border neon-card glow-pulse relative overflow-hidden rounded-2xl p-5 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute left-3 top-3 text-slate-500 transition hover:text-slate-200"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-400" />
          <div>
            <p className="font-display text-sm font-bold text-slate-50">
              تم بدء التحميل بنجاح! 🎮
            </p>
            <p className="mt-1 text-sm text-slate-300">
              شكرًا لاستخدامك <span className="neon-text font-display font-extrabold">Gaming Fusion</span>
            </p>
            <p className="mt-2 text-xs text-slate-400">
              لا تنسَ متابعتنا على يوتيوب لأحدث المحتوى والألعاب 🚀
            </p>
            <a
              href={channelUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-neon mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-black transition active:scale-95"
            >
              <YoutubeIcon className="h-4 w-4" />
              اشترك في القناة الآن
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
