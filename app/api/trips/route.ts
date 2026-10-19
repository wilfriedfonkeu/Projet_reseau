import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "trips.json");

interface TripData {
  from: string;
  to: string;
  time: string;
  vehicle: string;
  price: number;
  company: string;
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
  const trip = await request.json();
  const trips = await readTrips();
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
