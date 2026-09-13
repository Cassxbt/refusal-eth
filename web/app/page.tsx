"use client";

import { FormEvent, useState } from "react";

type GateResult = {
  decision: "ALLOW" | "REFUSE";
  reasonCode: string;
  proofId: string;
};

const refusalScenario = {
  from: "demo.alice.refusal.eth",
  to: "0x1111111111111111111111111111111111111111",
  amount: "1",
};

const limitScenario = {
  from: "demo.alice.refusal.eth",
  to: "0x000000000000000000000000000000000000dEaD",
  amount: "6",
};

export default function Home() {
  const [from, setFrom] = useState(refusalScenario.from);
  const [to, setTo] = useState(refusalScenario.to);
  const [amount, setAmount] = useState(refusalScenario.amount);
  const [demoMode, setDemoMode] = useState(true);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<GateResult | null>(null);

  function loadScenario(scenario: typeof refusalScenario) {
    setFrom(scenario.from);
    setTo(scenario.to);
    setAmount(scenario.amount);
    setDemoMode(true);
    setResult(null);
    setError("");
    setState("idle");
  }

  async function evaluate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setResult(null);
    setError("");
    try {
      const response = await fetch(`/api/intent${demoMode ? "?demo=true" : ""}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from, to, amount }),
      });
      const body = (await response.json()) as Partial<GateResult> & { error?: string };
      if (!response.ok || !body.proofId || !body.decision || !body.reasonCode) {
        throw new Error(body.error ?? "The gate could not complete this evaluation.");
      }
      setResult(body as GateResult);
      setState("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The gate could not complete this evaluation.");
      setState("error");
    }
  }

  const refused = result?.decision === "REFUSE";

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="REFUSAL.eth home">
          <span className="brand-mark" aria-hidden="true">◒</span>
          <span className="brand-name">REFUSAL.eth</span>
          <span className="brand-sub">policy before signing</span>
        </a>
        <div className="network-pill"><span className="network-dot" /> Sepolia / read path</div>
      </header>

      <main className="main" id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">Transaction firewall for agents</div>
            <h1 id="hero-title">Make refusal<br /><em>executable.</em></h1>
            <p className="hero-lede"><strong>Keys should never get the last word.</strong> REFUSAL.eth resolves the agent identity, evaluates a sealed policy, and leaves a receipt before any signer can act.</p>
            <div className="hero-actions">
              <a className="button-primary" href="#evaluate">Run a gate <span aria-hidden="true">↓</span></a>
              <a className="button-quiet" href="#evidence">Inspect the build <span aria-hidden="true">↘</span></a>
            </div>
            <div className="hero-meta" aria-label="Judge shortcuts">
              <span className="hero-meta-label">Judge in 60 sec</span>
              <a href="#evidence">Evidence map ↘</a>
              <a href="/api/health">Health JSON ↗</a>
              <span className="hero-meta-note">No wallet required to inspect a refusal.</span>
            </div>
          </div>

          <aside className="rail-card" aria-label="Decision rail">
            <div className="rail-label">The decision rail / 00—04</div>
            <h2>Act only after<br />a positive proof.</h2>
            <p>A refusal is a first-class outcome. The signer is downstream of the gate, never beside it.</p>
            <ol className="rail-steps">
              <li data-step="01">MINT identity</li>
              <li data-step="02">SEAL policy</li>
              <li data-step="03">RESOLVE name</li>
              <li data-step="04">EVALUATE intent</li>
              <li data-step="05">LOCK-SIGN</li>
            </ol>
          </aside>
        </section>

        <section className="console-grid" id="evaluate" aria-labelledby="console-title">
          <div className="panel">
            <div className="panel-head">
              <div><div className="panel-kicker">Live evaluation / Sepolia</div><h2 className="panel-title" id="console-title">Ask the gate first.</h2></div>
              <span className="panel-id">INTENT_001</span>
            </div>
            <form onSubmit={evaluate}>
              <div className="form-grid">
                <div className="field"><label htmlFor="from">Agent ENS name</label><input id="from" value={from} onChange={(event) => { setFrom(event.target.value); setDemoMode(false); }} placeholder="agent.example.eth" autoComplete="off" required /><span className="field-hint">{demoMode ? "Deterministic public demo identity; no ENS ownership implied." : "Resolved on Sepolia before policy evaluation."}</span></div>
                <div className="field"><label htmlFor="to">Destination address</label><input id="to" value={to} onChange={(event) => setTo(event.target.value)} placeholder="0x…" spellCheck={false} required /></div>
                <div className="field"><label htmlFor="amount">Amount / USDC units</label><input id="amount" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" pattern="[1-9][0-9]*" required /></div>
                <div className="scenario-row" aria-label="Load demo scenarios"><button className="scenario-button" type="button" onClick={() => loadScenario(refusalScenario)}>Load allowlist miss</button><button className="scenario-button" type="button" onClick={() => loadScenario(limitScenario)}>Load limit breach</button></div>
                <div className="submit-row"><button className="button-primary" type="submit" disabled={state === "loading"}>{state === "loading" ? "Evaluating…" : "Evaluate intent →"}</button><span className="form-note">No signer is called by this demo path. A refusal leaves no transaction.</span></div>
              </div>
            </form>

            {state === "error" && <div className="status-box error" role="alert"><div className="status-top"><span className="status-icon">!</span><span className="status-title">GATE UNAVAILABLE</span></div><p className="status-copy">{error}</p></div>}
            {result && <div className={`status-box ${refused ? "refuse" : "allow"}`} role="status" aria-live="polite"><div className="status-top"><span className="status-icon">{refused ? "×" : "✓"}</span><span className="status-title">{result.decision} / {result.reasonCode}</span></div><p className="status-copy">{refused ? "The policy stopped this intent before signing. The receipt is the evidence." : "The policy accepted this intent. Review the receipt before any downstream signer acts."}</p><a className="status-link" href={`/proof/${result.proofId}`}>Open proof receipt ↗</a></div>}
          </div>

          <aside className="panel evidence-panel" id="evidence" aria-labelledby="evidence-title">
            <div className="panel-head"><div><div className="panel-kicker">Judge path / evidence map</div><h2 className="panel-title" id="evidence-title">What is live today.</h2></div></div>
            <p className="evidence-intro">The console shows the current build honestly. Green means verifiable in this checkout; amber means the integration is not yet claimed as live.</p>
            <div className="evidence-list">
              <div className="evidence-row"><span className="evidence-dot" /><div><div className="evidence-name">GATE LOGIC</div><div className="evidence-detail">Frozen order: revoked → allowlist → per-tx → daily.</div></div><span className="evidence-state">TESTED</span></div>
              <div className="evidence-row"><span className="evidence-dot" /><div><div className="evidence-name">ENS PRE-FLIGHT</div><div className="evidence-detail">Read-only ENSv2 deployment and fail-closed config checks; no name ownership implied.</div></div><span className="evidence-state readonly">READ-ONLY</span></div>
              <div className="evidence-row"><span className="evidence-dot" /><div><div className="evidence-name">CHAINLINK CRE</div><div className="evidence-detail">Official CLI simulation verified; production deployment is not claimed.</div></div><span className="evidence-state simulation">SIMULATION</span></div>
              <div className="evidence-row"><span className="evidence-dot pending" /><div><div className="evidence-name">PRIVY LOCK-SIGN</div><div className="evidence-detail">Wallet, quorum, policy, and Sepolia funding verified; live signing flow pending.</div></div><span className="evidence-state pending">PENDING</span></div>
            </div>
            <p className="micro-note">The honest path is the winning path: every claim maps to a test, receipt, or clearly marked next gate.</p>
          </aside>
        </section>

        <section className="sequence" aria-label="How the mechanism works">
          <div className="sequence-step"><div className="sequence-number">01 / IDENTITY</div><div className="sequence-title">Name first.</div><div className="sequence-copy">Resolve the ENS identity on the target network.</div></div>
          <div className="sequence-step"><div className="sequence-number">02 / POLICY</div><div className="sequence-title">Seal rules.</div><div className="sequence-copy">Keep limits and destinations outside agent context.</div></div>
          <div className="sequence-step"><div className="sequence-number">03 / GATE</div><div className="sequence-title">Refuse early.</div><div className="sequence-copy">Evaluate before the signer receives an intent.</div></div>
          <div className="sequence-step"><div className="sequence-number">04 / RECEIPT</div><div className="sequence-title">Prove it.</div><div className="sequence-copy">Make the decision re-runnable for a judge.</div></div>
          <div className="sequence-step"><div className="sequence-number">05 / SIGNER</div><div className="sequence-title">Then act.</div><div className="sequence-copy">Only an explicit ALLOW can move downstream.</div></div>
        </section>

        <footer className="footer"><span>REFUSAL.eth / deny by default</span><span>Built for ETHOnline 2026 / Sepolia</span></footer>
      </main>
    </div>
  );
}
