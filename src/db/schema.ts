import { pgTable, serial, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";

// Keeps a lightweight history of successful downloads so we can show
// live stats (total downloads, most requested quality, etc.) on the site.
export const downloadLogs = pgTable("download_logs", {
  id: serial("id").primaryKey(),
  videoId: varchar("video_id", { length: 32 }).notNull(),
  title: text("title").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  quality: varchar("quality", { length: 32 }).notNull(),
  mediaType: varchar("media_type", { length: 16 }).notNull(), // "video" | "audio"
  fileSizeBytes: integer("file_size_bytes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
