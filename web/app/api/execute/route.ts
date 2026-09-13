import { NextResponse } from "next/server";
import { executePrivySend } from "@/lib/privy";
import { getProof } from "@/lib/store";

/// POST /api/execute { proofId } → Privy signer boundary.
/// A stored gate receipt is not enough: only a receipt carrying an explicitly
/// verified CRE verdict may reach the signer. No client-supplied verdict flag
/// is trusted here.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const proofId = typeof body?.proofId === "string" ? body.proofId : "";
  if (!proofId) return NextResponse.json({ error: "need {proofId}" }, { status: 400 });

  const receipt = getProof(proofId);
  if (!receipt) return NextResponse.json({ error: "unknown proof id" }, { status: 404 });
  if (receipt.decision !== "ALLOW") {
    return NextResponse.json(
      { decision: "REFUSE", reasonCode: receipt.reasonCode, proofId },
      { status: 409 },
    );
  }

  // `/api/intent` deliberately creates unsigned mirror receipts. Until a
  // server-side CRE verifier attaches a real verdict signature, Privy is never
  // called and the request remains fail-closed.
  if (!receipt.cre.verdictSig) {
    return NextResponse.json(
      { decision: "REFUSE", reasonCode: "REF-02 SEALED_LIMIT_BREACH", proofId, error: "verified CRE verdict required before signing" },
      { status: 409 },
    );
  }

  const userSignature = typeof body?.userSignature === "string" ? body.userSignature.trim() : "";
  if (!userSignature)
    return NextResponse.json({ decision: "REFUSE", reasonCode: "REF-04 HUMAN_DENIED_TIMEOUT", proofId }, { status: 409 });
  const result = await executePrivySend({
    recipient: receipt.intent.to,
    amountUSDC: receipt.intent.amountUSDC,
    userSignature,
    idempotencyKey: typeof body?.idempotencyKey === "string" ? body.idempotencyKey : receipt.id,
  });
  return NextResponse.json({ ...result, proofId }, { status: result.signed ? 200 : 409 });
}
