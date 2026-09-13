import { getProof } from "@/lib/store";

/// GET /proof/:id — human-readable receipt (server-rendered from the same store).
export default async function ProofPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = getProof(id);
  if (!r)
    return (
      <main style={{ fontFamily: "monospace", padding: 24 }}>
        <h1>REFUSAL.eth — unknown proof</h1>
        <p>No receipt for {id} on this instance.</p>
      </main>
    );
  const ok = r.decision === "ALLOW";
  return (
    <main style={{ fontFamily: "monospace", padding: 24, maxWidth: 760 }}>
      <h1>
        {ok ? "ALLOW" : "REFUSE"} — {r.reasonCode}
      </h1>
      <p>
        {r.agentENS} → {r.intent.to} · {r.intent.amountUSDC} USDC · {r.intent.chain}
      </p>
      <pre style={{ background: "#111", color: "#0f0", padding: 16, overflowX: "auto" }}>
        {JSON.stringify(r, null, 2)}
      </pre>
      <p>
        <a href={r.links.ensSepolia}>ENS Sepolia ↗</a>
        {r.links.explorerTxOrNull ? (
          <>
            {" · "}
            <a href={r.links.explorerTxOrNull}>explorer tx ↗</a>
          </>
        ) : (
          " · no tx (refusal leaves no trace — absence is the proof)"
        )}
      </p>
    </main>
  );
}
