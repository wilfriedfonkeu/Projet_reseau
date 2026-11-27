import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "reservations.json");

async function readStore(): Promise<unknown[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeStore(data: unknown[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store);
}

export async function POST(request: Request) {
  const reservation = await request.json() as { ref?: string };
  if (!reservation.ref) return NextResponse.json({ error: "ref_required" }, { status: 400 });
  const store = await readStore() as Array<{ ref?: string }>;
  if (store.some((r) => r.ref === reservation.ref)) {
    return NextResponse.json({ error: "ref_exists" }, { status: 409 });
  }
  store.unshift(reservation);
  await writeStore(store);
  return NextResponse.json({ success: true });
}

/** Met à jour uniquement le statut d'une réservation (annulation). Les autres champs du billet sont immuables. */
export async function PATCH(request: Request) {
  const { ref, status } = await request.json() as { ref?: string; status?: string };
  if (!ref || !status) return NextResponse.json({ error: "ref_and_status_required" }, { status: 400 });
  const store = await readStore() as Array<{ ref?: string; status?: string }>;
  const index = store.findIndex((r) => r.ref === ref);
  if (index < 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
  store[index] = { ...store[index], status };
  await writeStore(store);
  return NextResponse.json({ success: true });
}

/** Supprime une réservation. Un tombeau conserve l'effacement des réservations intégrées. */
export async function DELETE(request: Request) {
  const { ref } = await request.json();
  const store = await readStore() as Array<{ ref?: string }>;
  const next = store.filter((r) => r.ref !== ref);
  next.push({ ref, _deleted: true } as never);
  await writeStore(next);
  return NextResponse.json({ success: true });
}
