import Link from "next/link";
import { headers } from "next/headers";
import { getProof } from "@/lib/store";

/// GET /proof/:id — human-readable receipt with an API fallback for serverless instances.
export default async function ProofPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let receipt = getProof(id);
  if (!receipt) {
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
    if (host) {
      try {
        const response = await fetch(`${protocol}://${host}/api/proof/${encodeURIComponent(id)}`, { cache: "no-store" });
        if (response.ok) receipt = await response.json();
      } catch {
        // Keep the receipt page fail-closed when the API instance is unavailable.
      }
    }
  }
  if (!receipt) {
    return (
      <main className="unknown">
        <div className="panel-kicker">Receipt lookup / failed</div>
        <h1>Unknown proof.</h1>
        <p>No receipt for <code>{id}</code> exists on this instance.</p>
        <Link className="button-quiet" href="/">Return to the gate ↗</Link>
      </main>
    );
  }

  const allowed = receipt.decision === "ALLOW";
  const hasTx = Boolean(receipt.links.explorerTxOrNull);

  return (
    <div className="receipt-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="REFUSAL.eth home">
          <span className="brand-mark" aria-hidden="true">◒</span>
          <span className="brand-name">REFUSAL.eth</span>
          <span className="brand-sub">proof receipt</span>
        </Link>
        <div className="network-pill"><span className="network-dot" /> Sepolia / receipt</div>
      </header>

      <main className="receipt-main">
        <header className={`receipt-header ${allowed ? "allow" : ""}`}>
          <div>
            <div className="panel-kicker">Decision receipt / independently inspectable</div>
            <h1><span>{receipt.decision}</span><br />{receipt.reasonCode}</h1>
          </div>
          <div className="receipt-id">
            <span>RECEIPT ID</span>
            <code>{receipt.id}</code>
            <span>{new Date(receipt.ts).toISOString()}</span>
          </div>
        </header>

        <div className="receipt-summary">
          <strong>{receipt.agentENS}</strong>
          <span>→</span>
          <strong>{receipt.intent.to}</strong>
          <span>{receipt.intent.amountUSDC} USDC · {receipt.intent.chain}</span>
        </div>

        <div className={`receipt-boundary ${allowed ? "allow" : "refuse"}`} role="note">
          <span className="boundary-mark" aria-hidden="true">{allowed ? "✓" : "×"}</span>
          <div>
            <strong>{allowed ? "ALLOW is a policy verdict, not a transaction." : "REFUSE means no transaction was called."}</strong>
            <p>{allowed ? "This receipt authorizes review only. A downstream signer remains a separate, explicit gate." : "The gate stopped this intent before signing; this negative result is the expected proof."}</p>
          </div>
        </div>

        <div className="receipt-layout">
          <div className="receipt-code-wrap">
            <div className="receipt-code-label">Machine receipt / JSON</div>
            <pre className="receipt-code" aria-label="Receipt JSON">
              {JSON.stringify(receipt, null, 2)}
            </pre>
          </div>

          <aside className="receipt-side">
            <section className="receipt-card">
              <h2>What this proves</h2>
              <p>{allowed ? "The policy accepted this intent. Any downstream signer remains a separate, explicit gate." : "The policy stopped this intent before signing. No transaction is the expected result."}</p>
            </section>

            <section className="receipt-card">
              <h2>Evidence chain</h2>
              <dl className="receipt-facts">
                <div><dt>ENS identity</dt><dd>{receipt.ensCheck.address ? "RESOLVED" : "MISSING"}</dd></div>
                <div><dt>CRE engine</dt><dd>{receipt.cre.engine}</dd></div>
                <div><dt>Signer</dt><dd>{receipt.signer.signed ? "SIGNED" : "NOT CALLED"}</dd></div>
                <div><dt>Transaction</dt><dd>{hasTx ? "ONCHAIN" : "NONE"}</dd></div>
              </dl>
            </section>

            <section className="receipt-card receipt-links">
              <h2>Verify externally</h2>
              <Link href={receipt.links.ensSepolia}>ENS Sepolia lookup ↗</Link>
              <Link href={`/api/proof/${receipt.id}`}>Machine-readable receipt ↗</Link>
              <Link href="/api/health">Capability health ↗</Link>
              {hasTx ? <Link href={receipt.links.explorerTxOrNull!}>Open transaction ↗</Link> : <p className="no-tx">No transaction: refusal leaves no funds movement.</p>}
            </section>
          </aside>
        </div>

        <footer className="receipt-footer">
          <Link className="button-quiet" href="/">Run another intent ↗</Link>
          <span>REFUSAL.eth / deny by default</span>
        </footer>
      </main>
    </div>
  );
}
