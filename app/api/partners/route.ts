import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { PartnerData } from "@/src/lib/njangui-data";

const DATA_FILE = path.join(process.cwd(), "data", "partners.json");

async function readPartners(): Promise<PartnerData[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writePartners(data: PartnerData[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const agencyId = url.searchParams.get("agencyId");
  const partners = await readPartners();
  if (agencyId) {
    return NextResponse.json(partners.filter(p => p.agencyId === agencyId));
  }
  return NextResponse.json(partners);
}

export async function POST(request: Request) {
  const partner: PartnerData = await request.json();
  const partners = await readPartners();
  partner.id = partner.id || `par_${Date.now()}`;
  partners.unshift(partner);
  await writePartners(partners);
  return NextResponse.json(partner, { status: 201 });
}

export async function PUT(request: Request) {
  const updated: Partial<PartnerData> = await request.json();
  const partners = await readPartners();
  const idx = partners.findIndex(p => p.id === updated.id);
  if (idx === -1) return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  partners[idx] = { ...partners[idx], ...updated };
  await writePartners(partners);
  return NextResponse.json(partners[idx]);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const partners = await readPartners();
  const filtered = partners.filter(p => p.id !== id);
  if (filtered.length === partners.length) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }
  await writePartners(filtered);
  return NextResponse.json({ success: true });
}
