import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), "public", "k12", "fabric_images_swiper");
    let entries: string[] = [];
    try {
      entries = await fs.readdir(publicDir);
    } catch {
      // Directory may not exist yet
      return NextResponse.json({ images: [] });
    }

    const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);
    const images = entries
      .filter((name) => allowed.has(path.extname(name).toLowerCase()))
      .map((name) => ({
        filename: name,
        url: path.posix.join("/k12/fabric_images_swiper", name),
      }));

    return NextResponse.json({ images });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}


