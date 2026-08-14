import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { createReadStream } from "node:fs";
import { mkdtemp, rm, stat, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";
import youtubedl from "youtube-dl-exec";
import ffmpegPath from "ffmpeg-static";
import { extractVideoId, sanitizeFileName } from "@/lib/youtube";
import { db } from "@/db";
import { downloadLogs } from "@/db/schema";

export const runtime = "nodejs";

// YouTube periodically restricts certain "player clients" per network/IP.
// We try a short list of clients until one of them actually succeeds.
const PLAYER_CLIENTS = [undefined, "android", "ios", "tv_embedded", "web_embedded"] as const;

const CONTENT_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mkv: "video/x-matroska",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
};

async function cleanup(dir: string) {
  try {
    await rm(dir, { recursive: true, force: true });
  } catch {
    // best effort
  }
}

async function findOutputFile(dir: string): Promise<string | null> {
  const entries = await readdir(dir);
  const candidate = entries.find(
    (name) => name.startsWith("out.") && !name.endsWith(".part") && !name.endsWith(".ytdl"),
  );
  return candidate ? join(dir, candidate) : null;
}

async function runWithFallback(
  videoUrl: string,
  buildFlags: (client: string | undefined, workDir: string) => Record<string, unknown>,
): Promise<{ workDir: string; filePath: string }> {
  let lastError: unknown = null;

  for (const client of PLAYER_CLIENTS) {
    const workDir = await mkdtemp(join(tmpdir(), "veloce-"));
    try {
      const flags = buildFlags(client, workDir);
      await youtubedl.exec(videoUrl, flags);
      const filePath = await findOutputFile(workDir);
      if (!filePath) throw new Error("لم يتم إنتاج أي ملف.");
      return { workDir, filePath };
    } catch (error) {
      lastError = error;
      await cleanup(workDir);
    }
  }

  throw lastError ?? new Error("تعذر تحميل الفيديو من يوتيوب.");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") ?? "";
  const mode = searchParams.get("mode"); // "video" | "audio"
  const itag = searchParams.get("itag");
  const audioItag = searchParams.get("audioItag");
  const bitrateParam = searchParams.get("bitrate");
  const title = sanitizeFileName(searchParams.get("title") ?? "video");
  const qualityLabel = searchParams.get("quality") ?? "";

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json({ error: "رابط الفيديو غير صالح." }, { status: 400 });
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    if (mode === "audio") {
      const bitrate = bitrateParam === "128" ? "128" : "320";

      const { workDir, filePath } = await runWithFallback(videoUrl, (client, dir) => ({
        extractAudio: true,
        audioFormat: "mp3",
        postprocessorArgs: `ffmpeg:-b:a ${bitrate}k`,
        ffmpegLocation: ffmpegPath as unknown as string,
        output: join(dir, "out.%(ext)s"),
        noPlaylist: true,
        noWarnings: true,
        noCheckCertificates: true,
        ...(client ? { extractorArgs: `youtube:player_client=${client}` } : {}),
      }));

      const stats = await stat(filePath);
      const ext = extname(filePath).slice(1) || "mp3";
      const fileName = `${title} [${bitrate}kbps].mp3`;

      void db
        .insert(downloadLogs)
        .values({
          videoId,
          title,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          quality: `${bitrate}kbps`,
          mediaType: "audio",
          fileSizeBytes: stats.size,
        })
        .catch(() => undefined);

      const nodeStream = createReadStream(filePath);
      nodeStream.on("close", () => void cleanup(workDir));
      nodeStream.on("error", () => void cleanup(workDir));

      return new NextResponse(Readable.toWeb(nodeStream) as unknown as ReadableStream, {
        headers: {
          "Content-Type": CONTENT_TYPES[ext] ?? "audio/mpeg",
          "Content-Length": String(stats.size),
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
          "Cache-Control": "no-store",
        },
      });
    }

    // mode === "video"
    if (!itag) {
      return NextResponse.json({ error: "الجودة المطلوبة غير صحيحة." }, { status: 400 });
    }

    const formatSelector = audioItag ? `${itag}+${audioItag}` : itag;

    const { workDir, filePath } = await runWithFallback(videoUrl, (client, dir) => ({
      format: formatSelector,
      mergeOutputFormat: "mp4",
      ffmpegLocation: ffmpegPath as unknown as string,
      output: join(dir, "out.%(ext)s"),
      noPlaylist: true,
      noWarnings: true,
      noCheckCertificates: true,
      ...(client ? { extractorArgs: `youtube:player_client=${client}` } : {}),
    }));

    const stats = await stat(filePath);
    const ext = extname(filePath).slice(1) || "mp4";
    const fileName = `${title} [${qualityLabel || "video"}].${ext}`;

    void db
      .insert(downloadLogs)
      .values({
        videoId,
        title,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        quality: qualityLabel || "unknown",
        mediaType: "video",
        fileSizeBytes: stats.size,
      })
      .catch(() => undefined);

    const nodeStream = createReadStream(filePath);
    nodeStream.on("close", () => void cleanup(workDir));
    nodeStream.on("error", () => void cleanup(workDir));

    return new NextResponse(Readable.toWeb(nodeStream) as unknown as ReadableStream, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "video/mp4",
        "Content-Length": String(stats.size),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("download error", error);
    const message = error instanceof Error ? error.message : "";
    const isBlocked = /403|Forbidden|not available|sign in/i.test(message);
    return NextResponse.json(
      {
        error: isBlocked
          ? "يوتيوب رفض هذا الطلب مؤقتًا (قيود من الخادم)، جرّب جودة أخرى أو حاول بعد قليل."
          : "حدث خطأ أثناء تجهيز الملف للتحميل، حاول مرة أخرى.",
      },
      { status: 500 },
    );
  }
}
