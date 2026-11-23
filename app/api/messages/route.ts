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
  try {
    const msg = await request.json();
    if (!msg || typeof msg.id !== "string" || typeof msg.senderId !== "string" || typeof msg.receiverId !== "string" || typeof msg.text !== "string" || !msg.text.trim()) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }
    const store = await readStore() as Array<{ id?: string }>;
    if (store.some((item) => item.id === msg.id)) return NextResponse.json({ error: "Duplicate message" }, { status: 409 });
    store.push({ ...msg, text: msg.text.trim() });
    await writeStore(store);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Message could not be saved" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, otherId } = await request.json();
    if (typeof userId !== "string" || typeof otherId !== "string") return NextResponse.json({ error: "Invalid participants" }, { status: 400 });
    const store: any[] = await readStore();
    for (const m of store) {
      if (m.receiverId === userId && m.senderId === otherId && !m.read) m.read = true;
    }
    await writeStore(store);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Conversation could not be updated" }, { status: 500 });
  }
}
