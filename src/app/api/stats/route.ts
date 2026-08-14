import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { downloadLogs } from "@/db/schema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [row] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(downloadLogs);

    const recent = await db
      .select({
        title: downloadLogs.title,
        quality: downloadLogs.quality,
        mediaType: downloadLogs.mediaType,
        thumbnailUrl: downloadLogs.thumbnailUrl,
        createdAt: downloadLogs.createdAt,
      })
      .from(downloadLogs)
      .orderBy(sql`${downloadLogs.createdAt} desc`)
      .limit(6);

    return NextResponse.json({ total: row?.total ?? 0, recent });
  } catch (error) {
    console.error("stats error", error);
    return NextResponse.json({ total: 0, recent: [] });
  }
}
