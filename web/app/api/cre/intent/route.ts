import { NextResponse } from "next/server";
import { parseCreIntent } from "@/lib/cre-intent";
import { isRevoked } from "@/lib/store";

const DEFAULT_INTENT = {
  fromENS: "demo.alice.refusal.eth",
  to: "0x000000000000000000000000000000000000dEaD",
  amountUSDC: "2",
};

/**
 * Public intent input for the CRE confidential handler.
 *
 * This route deliberately returns no policy data. The handler retrieves the
 * sealed policy through runtime.getSecret and evaluates this intent inside
 * handlerInTee.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return respond(
    searchParams.get("fromENS") ?? DEFAULT_INTENT.fromENS,
    searchParams.get("to") ?? DEFAULT_INTENT.to,
    searchParams.get("amountUSDC") ?? DEFAULT_INTENT.amountUSDC,
  );
}

function respond(fromRaw: unknown, toRaw: unknown, amountRaw: unknown) {
  const intent = parseCreIntent({ fromENS: fromRaw, to: toRaw, amountUSDC: amountRaw });
  if (!intent) {
    return NextResponse.json(
      { error: "need valid fromENS, to, and positive integer amountUSDC" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      ...intent,
      revoked: isRevoked(intent.fromENS),
      chain: "sepolia",
      chainId: 11155111,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
