import { NextResponse } from "next/server";
import { normalize } from "viem/ens";
import { setRevoked } from "@/lib/store";

/// POST /api/revoke {name} — demo kill-switch (REF-01 path).
/// Production: owner-only `RefusalGateway.revoke()` on Sepolia. This demo route
/// is intentionally one-way: unauthenticated callers can trigger a refusal, but
/// cannot un-revoke a name. Un-revocation is not supported by the gateway either.
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
  if (body?.revoked === false)
    return NextResponse.json({ error: "un-revoke is not permitted" }, { status: 403 });
  setRevoked(name, true);
  return NextResponse.json({ name, revoked: true });
}
