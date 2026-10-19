import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "custom-offers.json");

type Store = { custom: unknown[]; hidden: string[] };

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { custom: parsed, hidden: [] };
    return { custom: parsed.custom ?? [], hidden: parsed.hidden ?? [] };
  } catch {
    return { custom: [], hidden: [] };
  }
}

async function writeStore(store: Store) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store);
}

export async function POST(request: Request) {
  const offer = await request.json();
  const store = await readStore();
  store.custom.unshift(offer);
  await writeStore(store);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const store = await readStore();
  store.custom = store.custom.filter((o: any) => o.id !== id);
  await writeStore(store);
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, hidden } = body;
  const store = await readStore();
  if ("hidden" in body) {
    if (hidden) {
      if (!store.hidden.includes(id)) store.hidden.push(id);
    } else {
      store.hidden = store.hidden.filter((h) => h !== id);
    }
  }
  // Mise à jour des champs de l'offre
  if ("name" in body || "price" in body || "duration" in body || "desc" in body || "category" in body || "image" in body || "location" in body) {
    const idx = store.custom.findIndex((o: any) => o.id === id);
    if (idx !== -1) {
      store.custom[idx] = { ...(store.custom[idx] as Record<string, unknown>), ...body };
    }
  }
  await writeStore(store);
  return NextResponse.json({ success: true });
}
