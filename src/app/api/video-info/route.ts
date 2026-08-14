import { NextResponse } from "next/server";
import { extractVideoId, fetchVideoInfo } from "@/lib/youtube";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ error: "من فضلك ضع رابط فيديو يوتيوب." }, { status: 400 });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: "الرابط غير صحيح، تأكد أنه رابط فيديو يوتيوب صالح." },
      { status: 400 },
    );
  }

  try {
    const info = await fetchVideoInfo(`https://www.youtube.com/watch?v=${videoId}`);

    if (info.qualities.length === 0) {
      return NextResponse.json(
        { error: "تعذر العثور على أي جودة قابلة للتحميل لهذا الفيديو." },
        { status: 422 },
      );
    }

    return NextResponse.json(info);
  } catch (error) {
    console.error("video-info error", error);
    const message =
      error instanceof Error && /private|age|sign in|unavailable/i.test(error.message)
        ? "هذا الفيديو غير متاح للتحميل (خاص أو مقيد بالعمر أو محذوف)."
        : "حدث خطأ أثناء جلب بيانات الفيديو، حاول مرة أخرى.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
