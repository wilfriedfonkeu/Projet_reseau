import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "vehicles.json");

interface VehicleData {
  id: string;
  plate: string;
  type: string;
  capacity: number;
  status: string;
  company: string;
  createdAt: string;
}

async function readVehicles(): Promise<VehicleData[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeVehicles(data: VehicleData[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function nextVehicleId(vehicles: VehicleData[]): string {
  const max = vehicles.reduce((acc, v) => {
    const match = /^V-(\d+)$/.exec(v.id ?? "");
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `V-${String(max + 1).padStart(3, "0")}`;
}

export async function GET() {
  return NextResponse.json(await readVehicles());
}

export async function POST(request: Request) {
  const body = await request.json();
  const vehicles = await readVehicles();
  const vehicle: VehicleData = {
    id: nextVehicleId(vehicles),
    plate: String(body.plate ?? "").trim().toUpperCase(),
    type: String(body.type ?? "").trim(),
    capacity: Number(body.capacity) || 0,
    status: "Disponible",
    company: String(body.company ?? "").trim(),
    createdAt: new Date().toISOString(),
  };
  if (!vehicle.plate || !vehicle.type || !vehicle.company || vehicle.capacity <= 0) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }
  vehicles.push(vehicle);
  await writeVehicles(vehicles);
  return NextResponse.json(vehicle, { status: 201 });
}

export async function PUT(request: Request) {
  const { id, updates } = await request.json();
  const vehicles = await readVehicles();
  const index = vehicles.findIndex((v) => v.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });
  }
  vehicles[index] = { ...vehicles[index], ...updates, id };
  await writeVehicles(vehicles);
  return NextResponse.json(vehicles[index]);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const vehicles = await readVehicles();
  const next = vehicles.filter((v) => v.id !== id);
  if (next.length === vehicles.length) {
    return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });
  }
  await writeVehicles(next);
  return NextResponse.json({ success: true });
}
