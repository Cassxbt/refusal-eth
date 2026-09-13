import { NextResponse } from "next/server";
import { normalize } from "viem/ens";
import { setRevoked } from "@/lib/store";

/// POST /api/revoke {name, revoked?} — demo kill-switch (REF-01 path).
/// Production: owner-only `RefusalGateway.revoke()` on Sepolia. This demo route
/// is unauthenticated by design for the 4-min refusal demo; documented, not hidden.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const raw = typeof body?.name === "string" ? body.name : "";
  if (!raw) return NextResponse.json({ error: "need {name}" }, { status: 400 });
  let name: string;
  try {
    name = normalize(raw);
  } catch {
    return NextResponse.json({ error: "invalid ENS name" }, { status: 400 });
  }
  const v = body?.revoked !== false;
  setRevoked(name, v);
  return NextResponse.json({ name, revoked: v });
}
