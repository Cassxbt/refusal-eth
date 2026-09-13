import { NextResponse } from "next/server";
import { getProof } from "@/lib/store";

/// GET /api/proof/:id → stored receipt JSON (re-runnable by judges, no wallet).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = getProof(id);
  if (!r) return NextResponse.json({ error: "unknown proof id" }, { status: 404 });
  return NextResponse.json(r);
}
