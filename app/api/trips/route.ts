import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "trips.json");

interface TripData {
  id?: string;
  from: string;
  to: string;
  date: string;
  time: string;
  vehicle: string;
  price: number;
  company: string;
  createdAt?: string;
}

async function readTrips(): Promise<TripData[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeTrips(data: TripData[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  const trips = await readTrips();
  return NextResponse.json(trips);
}

export async function POST(request: Request) {
  const body = await request.json();
  const trips = await readTrips();
  const trip: TripData = {
    id: String(body.id ?? `trip_${Date.now()}`),
    from: String(body.from ?? "").trim(),
    to: String(body.to ?? "").trim(),
    date: String(body.date ?? "").trim(),
    time: String(body.time ?? "").trim(),
    vehicle: String(body.vehicle ?? "").trim(),
    price: Number(body.price) || 0,
    company: String(body.company ?? "").trim(),
    createdAt: String(body.createdAt ?? new Date().toISOString()),
  };
  if (!trip.from || !trip.to || !trip.date || !trip.time || !trip.vehicle || trip.price <= 0 || !trip.company) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }
  trips.push(trip);
  await writeTrips(trips);
  return NextResponse.json(trip, { status: 201 });
}

export async function DELETE(request: Request) {
  const { index } = await request.json();
  const trips = await readTrips();
  if (index < 0 || index >= trips.length) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }
  trips.splice(index, 1);
  await writeTrips(trips);
  return NextResponse.json({ success: true });
}
