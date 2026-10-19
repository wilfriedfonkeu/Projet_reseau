import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const agency = (formData.get("agency") as string) || "unknown";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const slug = agency.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "agence";
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "images", "agency-uploads", slug);
  const filepath = path.join(dir, filename);

  await fs.mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  const url = `/images/agency-uploads/${slug}/${filename}`;
  return NextResponse.json({ url });
}
