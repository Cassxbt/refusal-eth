export default function Home() {
  return (
    <main style={{ fontFamily: "monospace", padding: 24, maxWidth: 760 }}>
      <h1>REFUSAL.eth</h1>
      <p>
        AI agents holding keys get prompt-injected into draining themselves, because policy lives in
        readable context and signing is unconditional.
      </p>
      <p>
        <strong>No ALLOW receipt = no signature, ever.</strong> Pipeline: MINT → SEAL → RESOLVE →
        EVALUATE → LOCK-SIGN.
      </p>
      <pre style={{ background: "#111", color: "#0f0", padding: 16, overflowX: "auto" }}>
{`curl /api/resolve?name=demo.alice.refusal.eth
curl -X POST /api/intent -d '{"from":"demo.alice.refusal.eth","to":"0x000000000000000000000000000000000000dEaD","amount":1000}'
# → REFUSE REF-02 SEALED_LIMIT_BREACH
curl -X POST /api/intent -d '{"from":"demo.alice.refusal.eth","to":"0x1111111111111111111111111111111111111111","amount":1}'
# → REFUSE REF-03 ALLOWLIST_MISS`}
      </pre>
      <p>Gate order: REVOKED → ALLOWLIST → PER-TX → DAILY. REF-04 comes from LOCK-SIGN (Privy quorum timeout).</p>
    </main>
  );
}
