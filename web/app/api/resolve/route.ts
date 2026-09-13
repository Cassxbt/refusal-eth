import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { isRevoked } from "@/lib/store";
import { canonicalEnsName } from "@/lib/ensv2";

const RPC = process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

/// GET /api/resolve?name=demo.alice.refusal.eth
/// Live Sepolia ENS lookup (address + resolver) + local revocation flag.
/// Role is DEMO-labeled until the gateway contract deploys on Sepolia.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("name") ?? "";
  if (!raw) return NextResponse.json({ error: "missing ?name=" }, { status: 400 });
  const name = canonicalEnsName(raw);
  if (!name) return NextResponse.json({ error: "invalid ENS name" }, { status: 400 });
  const client = createPublicClient({ chain: sepolia, transport: http(RPC) });
  let address: `0x${string}` | null;
  let resolver: `0x${string}` | null;
  try {
    [address, resolver] = await Promise.all([
      client.getEnsAddress({ name }),
      client.getEnsResolver({ name }),
    ]);
  } catch {
    return NextResponse.json({ error: "ENS resolution unavailable" }, { status: 502 });
  }
  if (!address) return NextResponse.json({ error: "ENS name has no address record" }, { status: 422 });
  const revoked = isRevoked(name);
  return NextResponse.json({
    name,
    address,
    resolver,
    revoked,
    role: "OPERATOR (demo policy — EAC roles land with gateway deploy)",
    chain: "sepolia",
    chainId: 11155111,
  });
}
