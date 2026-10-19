import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "messages.json");

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
  const msg = await request.json();
  const store = await readStore();
  store.push(msg);
  await writeStore(store);
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const { userId, otherId } = await request.json();
  const store: any[] = await readStore();
  for (const m of store) {
    if (m.receiverId === userId && m.senderId === otherId && !m.read) {
      m.read = true;
    }
  }
  await writeStore(store);
  return NextResponse.json({ success: true });
}
