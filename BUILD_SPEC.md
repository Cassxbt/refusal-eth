# REFUSAL.eth — Build Spec (frozen for build)

## 0. Goal
Win ETHOnline 2026 Start Fresh: Finalist + 3 partner prizes with one demoable gate.
Failure mode: AI agents holding keys get prompt-injected into draining themselves, because policy lives in readable context and signing is unconditional.
Product: REFUSAL.eth — no ALLOW receipt = no signature, ever.
Mechanism: REFUSE-FIRST GATE — `MINT → SEAL → RESOLVE → EVALUATE → LOCK-SIGN`.
Errors: `REF-01 REVOKED_NAME / REF-02 SEALED_LIMIT_BREACH / REF-03 ALLOWLIST_MISS / REF-04 HUMAN_DENIED_TIMEOUT`.

## 1. Prize selection (exactly 3, all Start Fresh eligible)
1. ENS Best Use ENSv2 $4.5k — Permissioned Registry + Permissioned Resolver + Enhanced Access Control + aliasing on Sepolia. Agents as namespaces. Functional demo, no hard-coded values, OSS + video/live.
2. Chainlink Best Confidential Workflow $2k + Liquidation Challenge $500 — CRE `handlerInTee`, ≥1 sensitive input in enclave, core-integrated, CLI sim or live deploy + evidence. Challenge: `join()` Sepolia `0x88574e7Cc0027afd04951daa09B64d4441931ba1`.
3. Privy Best financial flow $2.5k — ≥1 Privy embedded wallet, ≥1 live functional flow, working demo + source, explain UX win.

Non-goals: Ledger prize (no hardware — adapter only, honestly labeled), World Selfie, Aqua/Uniswap/Arc/Hedera/Graph/Bazantic. No second product.

## 2. Architecture (solo-buildable)
```
Attacker prompt → Agent harness (untrusted, labeled)
 → resolve agent ENS (viem, Sepolia ENSv2) → check revoked/role/alias
 → POST intent → CRE handlerInTee (sealed limits/allowlist, returns ALLOW/REFUSE + reasonCode, no limit values leak)
 → Privy policy/quorum approval (human-in-loop for ALLOW over threshold)
 → Sepolia tx or REFUSE with receipt
 → /proof/:id (ENS record + CRE sim hash + Privy log + explorer link or null-tx proof)
```
Signer abstraction: `signer/{privy,local,ledger-ring-stub}.ts`. Ledger stub interface-complete only.

## 3. Repo layout
```
contracts/RefusalGateway.sol (owner, verdictKey, revoke, execute+ecrecover, REF_01..04/BAD_VERDICT/REPLAY, YieldAllowed/YieldRefused events)
cre-workflow/src/workflow.ts (evaluatePolicyInEnclave pure gate; SDK `handlerInTee` wiring next) + sim.ts (4-case proof)
web/ (Next.js: /api/resolve, /api/intent, /api/proof, /proof/[id] page)
signer/ (privy adapter, local ephemeral, ledger-ring stub)
evidence/ (sim.log, Sepolia txs, ENS records)
FEEDBACK captures (ENS/CRE/Privy notes for judges)
```

## 4. Judge path (≤90s, no wallet)
1. `curl "/api/resolve?name=demo.alice.refusal.eth"` → role, resolver, revoked=false
2. `curl POST /api/intent {to: 0x0000...dEaD (allowlisted), amount: 1000}` → REFUSE REF-02
3. `curl POST /api/intent {to: 0x1111...1111, amount: 1}` → REFUSE REF-03 (allowlist checked before limits)
4. Open `/proof/:id` → ENS + CRE sim + explorer

## 5. Verification rules (no assumptions)
- Every SDK version, contract address, RPC, chain ID verified from docs or onchain before use.
- Every gate decision reproduced by an agent running sim/tests independently.
- Every sponsor claim mapped to exact qualification bullet + file:line.
- Honesty table updated whenever a stub exists. Never fake Ring/TEE/mainnet.
- No step marked done without executed output (test log, curl, tx hash).
