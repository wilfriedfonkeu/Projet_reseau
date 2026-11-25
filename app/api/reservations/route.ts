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
  const reservation = await request.json();
  const store = await readStore();
  store.unshift(reservation);
  await writeStore(store);
  return NextResponse.json({ success: true });
}

/** Met à jour une réservation (annulation). Crée aussi une surcharge pour les réservations intégrées. */
export async function PATCH(request: Request) {
  const reservation = await request.json();
  const store = await readStore() as Array<{ ref?: string }>;
  const index = store.findIndex((r) => r.ref === reservation.ref);
  if (index >= 0) store[index] = reservation;
  else store.push(reservation);
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
