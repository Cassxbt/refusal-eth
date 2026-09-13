import { NextResponse } from "next/server";
import { privyConfigPresent } from "@/lib/privy";
import { readEnsV2Config } from "@/lib/ensv2";

/** Public, non-secret capability report for judges and smoke tests. */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "refusal-eth",
      chain: "sepolia",
      chainId: 11155111,
      capabilities: {
        creSimulation: true,
        creProduction: false,
        ensV2Configured: readEnsV2Config() !== null,
        privyConfigured: privyConfigPresent(),
        persistence: "file-backed demo store",
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
