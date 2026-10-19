import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "guides.json");

export interface IdDocument {
  type: "cni" | "passport";
  number: string;
  fileUrl: string;
}

export interface GuideData {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  promise: string;
  image: string;
  city: string;
  agencyId: string;
  idDocument?: IdDocument | null;
  photo?: string;
  paymentMethod?: string;
  commission?: number;
}

async function readGuides(): Promise<GuideData[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeGuides(data: GuideData[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const agencyId = url.searchParams.get("agencyId");
  const guides = await readGuides();
  if (agencyId) {
    return NextResponse.json(guides.filter(g => g.agencyId === agencyId));
  }
  return NextResponse.json(guides);
}

export async function POST(request: Request) {
  const guide = await request.json();
  const guides = await readGuides();
  guide.id = guide.id || `g_${Date.now()}`;
  guides.push(guide);
  await writeGuides(guides);
  return NextResponse.json(guide, { status: 201 });
}

export async function PUT(request: Request) {
  const updated = await request.json();
  const guides = await readGuides();
  const idx = guides.findIndex(g => g.id === updated.id);
  if (idx === -1) return NextResponse.json({ error: "Guide not found" }, { status: 404 });
  guides[idx] = { ...guides[idx], ...updated };
  await writeGuides(guides);
  return NextResponse.json(guides[idx]);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const guides = await readGuides();
  const filtered = guides.filter(g => g.id !== id);
  if (filtered.length === guides.length) {
    return NextResponse.json({ error: "Guide not found" }, { status: 404 });
  }
  await writeGuides(filtered);
  return NextResponse.json({ success: true });
}
