import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { normalize } from "viem/ens";
import { isRevoked } from "@/lib/store";

const RPC = process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

/// GET /api/resolve?name=demo.alice.refusal.eth
/// Live Sepolia ENS lookup (address + resolver) + local revocation flag.
/// Role is DEMO-labeled until the gateway contract deploys on Sepolia.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("name") ?? "";
  if (!raw) return NextResponse.json({ error: "missing ?name=" }, { status: 400 });
  let name: string;
  try {
    name = normalize(raw);
  } catch {
    return NextResponse.json({ error: "invalid ENS name" }, { status: 400 });
  }
  const client = createPublicClient({ chain: sepolia, transport: http(RPC) });
  const [address, resolver] = await Promise.all([
    client.getEnsAddress({ name }).catch(() => null),
    client.getEnsResolver({ name }).catch(() => null),
  ]);
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
