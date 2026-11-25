import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export interface SubscriptionPlan {
  id: string;
  label: string;
  price: number;
  period: string;
  publications: number;
  popular: boolean;
  save: string | null;
  published: boolean;
}

const DATA_FILE = path.join(process.cwd(), "data", "subscription-plans.json");

const DEFAULT_PLANS: SubscriptionPlan[] = [
  { id: "monthly", label: "Mensuel", price: 25000, period: "mois", publications: 5, popular: false, save: null, published: true },
  { id: "semester", label: "Semestriel", price: 120000, period: "6 mois", publications: 15, popular: true, save: "30 000 FCFA", published: true },
  { id: "yearly", label: "Annuel", price: 200000, period: "an", publications: 50, popular: false, save: "100 000 FCFA", published: true },
];

function normalizePlan(plan: any): SubscriptionPlan {
  return {
    id: String(plan.id ?? `plan_${Date.now()}`),
    label: String(plan.label ?? ""),
    price: Number(plan.price) || 0,
    period: String(plan.period ?? ""),
    publications: Number(plan.publications) || 0,
    popular: Boolean(plan.popular),
    save: plan.save == null || plan.save === "" ? null : String(plan.save),
    published: plan.published !== false,
  };
}

async function readPlans(): Promise<SubscriptionPlan[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return DEFAULT_PLANS;
    return data.map(normalizePlan);
  } catch {
    return DEFAULT_PLANS;
  }
}

async function writePlans(data: SubscriptionPlan[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  const plans = await readPlans();
  return NextResponse.json(plans);
}

export async function POST(request: Request) {
  const plan = normalizePlan(await request.json());
  const plans = await readPlans();
  plan.id = plan.id || `plan_${Date.now()}`;
  plans.unshift(plan);
  await writePlans(plans);
  return NextResponse.json(plan, { status: 201 });
}

export async function PUT(request: Request) {
  const updated: Partial<SubscriptionPlan> & { id: string } = await request.json();
  const plans = await readPlans();
  const idx = plans.findIndex((p) => p.id === updated.id);
  if (idx === -1) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  plans[idx] = { ...plans[idx], ...updated };
  await writePlans(plans);
  return NextResponse.json(plans[idx]);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const plans = await readPlans();
  const filtered = plans.filter((p) => p.id !== id);
  if (filtered.length === plans.length) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  await writePlans(filtered);
  return NextResponse.json({ success: true });
}
