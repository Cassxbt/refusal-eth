# REFUSAL.eth — deny-by-default firewall for AI agents

![Tests](https://img.shields.io/badge/tests-15%20passing-10b981)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Chain](https://img.shields.io/badge/chain-Sepolia%2011155111-1f1f23)

> AI agents holding keys will be prompt-injected into draining themselves, because spending policy lives in readable context and signing is unconditional.

So I built **REFUSAL.eth** — no ALLOW receipt = no signature, ever. Policy evaluates inside Chainlink CRE TEE, identity is an ENSv2 agent namespace, signing gated by policy + human quorum (Privy).

Pipeline: `MINT → SEAL → RESOLVE → EVALUATE → LOCK-SIGN`

Errors: `REF-01 REVOKED_NAME / REF-02 SEALED_LIMIT_BREACH / REF-03 ALLOWLIST_MISS / REF-04 HUMAN_DENIED_TIMEOUT`

## Prize selection (Start Fresh)
1. **ENS Best Use ENSv2 $4.5k** — Permissioned Registry/Resolver + Enhanced Access Control + aliasing on Sepolia, agents as namespaces.
2. **Chainlink Best Confidential Workflow $2k + Liquidation $500** — `handlerInTee` holds limits/allowlist, CLI sim proof, `join()` Sepolia `0x88574e7Cc0027afd04951daa09B64d4441931ba1`.
3. **Privy Best financial flow / B2B $2.5k** — embedded Sepolia wallet + policy/quorum approval as human-in-loop. Replaces hardware gate, no device needed.

Ledger Key Ring: adapter interface-complete (`signer/ledger-ring.ts`), demo uses Privy + local ephemeral signer. Production swaps one line to `wallet-cli ring`. See Honesty table. NOT selected as prize (no hardware for `ring init`).

## Judge path (≤90s, no wallet)
```bash
curl "https://refusal-eth.vercel.app/api/resolve?name=demo.alice.refusal.eth"
curl -X POST https://refusal-eth.vercel.app/api/intent -d '{"from":"demo.alice.refusal.eth","to":"0x000000000000000000000000000000000000dEaD","amount":"1000"}'
# → {"decision":"REFUSE","reasonCode":"REF-02 SEALED_LIMIT_BREACH"} (allowlisted addr, over limit)
curl -X POST https://refusal-eth.vercel.app/api/intent -d '{"from":"demo.alice.refusal.eth","to":"0x1111111111111111111111111111111111111111","amount":"1"}'
# → {"decision":"REFUSE","reasonCode":"REF-03 ALLOWLIST_MISS"}
curl https://refusal-eth.vercel.app/api/proof/<proofId-from-intent>
# + open /proof/<proofId-from-intent> → ENS + CRE sim + explorer
```
Gate order (fixed): REVOKED → ALLOWLIST → PER-TX → DAILY. Non-allowlisted `to` returns REF-03 before limits are checked.
`REF-04 HUMAN_DENIED_TIMEOUT` originates at LOCK-SIGN (Privy quorum/human timeout), not in the enclave.

## Layout
- `contracts/` — RefusalGateway.sol (verdict enforcement, revocation root)
- `cre-workflow/` — CRE confidential workflow (`handlerInTee`)
- `web/` — Next.js proof API + /proof page
- `signer/` — pluggable signer (privy/local/ledger-ring stub)

## Honesty table (verified 2026-09-13 — no LIVE claims until evidence lands)
| Claim | Status |
|---|---|
| ENSv2 mint/revoke/alias Sepolia | TODO — needs Sepolia txs + `/api/resolve` live, no hard-coded values |
| CRE `handlerInTee` + CLI sim log | LOCAL GATE ONLY — `cre-workflow/src/sim.ts` 4-case pass; needs real `cre workflow simulate` transcript + binary hash |
| Privy embedded wallet + policy | TODO — needs funded Sepolia wallet + policy/quorum IDs + tx hash |
| Ledger Ring scoped sign | ADAPTER PLANNED, demo uses Privy/local — no hardware for `ring init`, never faked as Ring tx |
| LLM agent | Thin untrusted demo harness, labeled |

## Tests (15 passing — `make verify` fails if this drifts)
- `contracts/test/RefusalGateway.t.sol` — 5 forge tests: valid verdict executes once, replay reverts, bad verdict reverts, revoked refuses, non-owner revoke reverts.
- `cre-workflow/test/gate.test.ts` — 10 asserts: ALLOW, REF-01/02/03, frozen order (allowlist before limits, revoked first), boundary (amount == limit → ALLOW), case-insensitive allowlist.
- `cre-workflow/test/parity.ts` — web mirror == canonical gate on 20/20 cases.
- `scripts/audit-claims.py` — badge count == executed, LIVE claims need evidence, no dead code.

## Run locally
```bash
pnpm i
pnpm --dir cre-workflow sim
pnpm --dir web dev
```
