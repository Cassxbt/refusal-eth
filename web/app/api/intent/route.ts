import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { normalize } from "viem/ens";
import { evaluatePolicyInEnclave } from "@/lib/gate";
import { demoPolicy, isRevoked, newProofId, saveProof } from "@/lib/store";
import { parseStrictAddress, parseStrictAmount } from "@/lib/validation";

const RPC = process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

/// POST /api/intent {from, to, amount}
/// RESOLVE (live ENS + local revoke) → EVALUATE (enclave-mirror gate) → receipt.
/// LOCK-SIGN (Privy quorum, REF-04 on timeout) lands with the Privy adapter;
/// this route records the gate verdict and stores the receipt. No signature here.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const from = typeof body?.from === "string" ? body.from : "";
  const to = parseStrictAddress(body?.to);
  const amount = parseStrictAmount(body?.amount);
  if (!from || !to || amount === null)
    return NextResponse.json({ error: "need {from: ENS, to: valid checksummed 0x address, amount: positive USDC}" }, { status: 400 });

  let fromENS: string;
  try {
    fromENS = normalize(from);
  } catch {
    return NextResponse.json({ error: "invalid from ENS" }, { status: 400 });
  }

  const client = createPublicClient({ chain: sepolia, transport: http(RPC) });
  let address: `0x${string}` | null;
  let resolver: `0x${string}` | null;
  try {
    [address, resolver] = await Promise.all([
      client.getEnsAddress({ name: fromENS }),
      client.getEnsResolver({ name: fromENS }),
    ]);
  } catch {
    // An unavailable ENS read must never become an ALLOW decision.
    return NextResponse.json({ error: "ENS resolution unavailable" }, { status: 502 });
  }
  if (!address)
    return NextResponse.json({ error: "ENS name has no address record" }, { status: 422 });
  const revoked = isRevoked(fromENS);
  const { decision, reasonCode } = evaluatePolicyInEnclave(
    { fromENS, to, amountUSDC: amount, revoked },
    demoPolicy(),
  );

  const id = newProofId();
  saveProof({
    id,
    agentENS: fromENS,
    intent: { to, amountUSDC: amount, chain: "sepolia" },
    decision,
    reasonCode,
    ensCheck: {
      address,
      resolver,
      revoked,
      role: "OPERATOR (demo policy — EAC roles land with gateway deploy)",
    },
    cre: { engine: "evaluatePolicyInEnclave (web mirror; CRE handlerInTee simulation evidenced separately)", simHash: null, verdictSig: null },
    signer: { kind: "none-yet (Privy adapter TODO)", human: "not-requested", signed: false, txHash: null },
    links: {
      ensSepolia: `https://sepolia.etherscan.io/enslookup-search?search=${encodeURIComponent(fromENS)}`,
      explorerTxOrNull: null,
    },
    ts: new Date().toISOString(),
  });

  return NextResponse.json({ decision, reasonCode, proofId: id });
}
