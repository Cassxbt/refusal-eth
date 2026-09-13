# REFUSAL.eth — deny-by-default firewall for AI agents

![Tests](https://img.shields.io/badge/tests-26%20passing-10b981)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Chain](https://img.shields.io/badge/chain-Sepolia%2011155111-1f1f23)

> AI agents holding keys will be prompt-injected into draining themselves, because spending policy lives in readable context and signing is unconditional.

So I built **REFUSAL.eth** — no ALLOW receipt = no signature, ever. The
submission target is a Chainlink CRE TEE policy gate, an ENSv2 agent
namespace, and a Privy human-quorum signer; the honesty table below separates
implemented local behavior from evidence-backed live integrations.

Pipeline: `MINT → SEAL → RESOLVE → EVALUATE → LOCK-SIGN`

Errors: `REF-01 REVOKED_NAME / REF-02 SEALED_LIMIT_BREACH / REF-03 ALLOWLIST_MISS / REF-04 HUMAN_DENIED_TIMEOUT`

## Prize selection (Start Fresh)
1. **ENS Best Use ENSv2 $4.5k** — Permissioned Registry/Resolver + Enhanced Access Control + aliasing on Sepolia, agents as namespaces.
2. **Chainlink Best Confidential Workflow $2k + Liquidation $500** — `handlerInTee` holds limits/allowlist, CLI sim proof, `join()` Sepolia `0x88574e7Cc0027afd04951daa09B64d4441931ba1`.
3. **Privy Best financial flow / B2B $2.5k** — embedded Sepolia wallet + policy/quorum approval as human-in-loop. Replaces hardware gate, no device needed.

Ledger Key Ring: adapter interface-complete (`signer/ledger-ring.ts`), demo uses Privy + local ephemeral signer. Production swaps one line to `wallet-cli ring`. See Honesty table. NOT selected as prize (no hardware for `ring init`).

## Judge path (≤90s, no wallet)
```bash
curl https://refusal-eth.vercel.app/api/health
curl "https://refusal-eth.vercel.app/api/resolve?name=demo.alice.refusal.eth" # live ENS path; 422 until a real name is configured
curl -X POST 'https://refusal-eth.vercel.app/api/intent?demo=true' -H 'content-type: application/json' -d '{"from":"demo.alice.refusal.eth","to":"0x000000000000000000000000000000000000dEaD","amount":"1000"}'
# → {"decision":"REFUSE","reasonCode":"REF-02 SEALED_LIMIT_BREACH"} (allowlisted addr, over limit)
curl -X POST 'https://refusal-eth.vercel.app/api/intent?demo=true' -H 'content-type: application/json' -d '{"from":"demo.alice.refusal.eth","to":"0x1111111111111111111111111111111111111111","amount":"1"}'
# → {"decision":"REFUSE","reasonCode":"REF-03 ALLOWLIST_MISS"}
curl -X POST https://refusal-eth.vercel.app/api/execute -H 'content-type: application/json' -d '{"proofId":"<proofId-from-an-ALLOW-intent>"}'
# → REF-02 until a server-verified CRE verdict is attached; Privy is never called
curl https://refusal-eth.vercel.app/api/proof/<proofId-from-intent>
# + open /proof/<proofId-from-intent> → ENS + CRE sim + explorer
```
Gate order (fixed): REVOKED → ALLOWLIST → PER-TX → DAILY. Non-allowlisted `to` returns REF-03 before limits are checked.
`REF-04 HUMAN_DENIED_TIMEOUT` originates at LOCK-SIGN (Privy quorum/human timeout), not in the enclave.

The `demo=true` query is an explicit synthetic-identity mode for judgeability; it
does not claim ENS ownership or bypass the default live ENS resolution path.

## Layout
- `contracts/` — RefusalGateway.sol (verdict enforcement, revocation root)
- `cre-workflow/` — CRE confidential workflow (`handlerInTee`)
- `web/` — Next.js proof API + /proof page
- `signer/` — pluggable signer (privy/local/ledger-ring stub)

## Audit artifacts
- [AI_DISCLOSURE.md](AI_DISCLOSURE.md) — AI-use attribution and evidence rules.
- [SUBMISSION_SPEC.md](SUBMISSION_SPEC.md) — concise public scope and acceptance
  criteria (internal research notes are excluded).
- [AI_PROMPTS.md](AI_PROMPTS.md) — sanitized prompt index for reproducibility.

## Honesty table (verified 2026-09-13 — no LIVE claims until evidence lands)
| Claim | Status |
|---|---|
| Gateway verdict signature expiry/replay protection | LOCAL — legacy `execute` selector is disabled; use deadline+nonce-bound `executeWithDeadline` |
| ENSv2 mint/revoke/alias Sepolia | TODO — needs Sepolia txs + `/api/resolve` live, no hard-coded values |
| CRE `handlerInTee` + CLI sim log | VERIFIED — official `cre workflow simulate` transcript and binary/config hashes in [`evidence/chainlink-cre-simulation.md`](evidence/chainlink-cre-simulation.md); production deployment remains pending |
| Privy embedded wallet + policy | ADAPTER READY — current Node SDK request path and fail-closed signer tests are present; funded wallet, policy/quorum IDs, user approval, and tx hash remain pending |
| Ledger Ring scoped sign | ADAPTER PLANNED, demo uses Privy/local — no hardware for `ring init`, never faked as Ring tx |
| LLM agent | Thin untrusted demo harness, labeled |

## Tests (26 passing — `make verify` fails if this drifts)
- `contracts/test/RefusalGateway.t.sol` — 11 forge tests: deadline+nonce-bound verdicts, replay/expiry/invalid-key/empty-name reverts, case-insensitive revocation, and legacy selector disablement.
- `cre-workflow/test/gate.test.ts` — 15 asserts: ALLOW, REF-01/02/03, frozen order (allowlist before limits, revoked first), boundary (amount == limit → ALLOW), case-insensitive allowlist, and malformed-input refusal.
- `cre-workflow/test/parity.ts` — web mirror == canonical gate on 20/20 cases.
- `cre-workflow/test/web-validation.ts` — strict address and integer amount validation, including boolean, exponent, fractional, NaN, and unsafe-number rejection.
- `scripts/audit-claims.py` — badge count == executed, LIVE claims need evidence, no dead code.

## Run locally
```bash
pnpm i
pnpm --dir cre-workflow sim
pnpm --dir web dev
# Read-only ENSv2 deployment and optional parent-name preflight (never broadcasts)
node web/scripts/ensv2-preflight.mjs
```

## Privy bootstrap (local-only, no transaction)

The bootstrap utility discovers or creates exactly one active Ethereum wallet
for a stable `external_id`. It prints only the wallet ID, address, owner ID,
and policy IDs; the app secret is never written to disk or included in output.

Set the two app credentials in your local process environment, then run:

```bash
export PRIVY_APP_ID='your-app-id'
export PRIVY_APP_SECRET='your-app-secret'
node web/scripts/privy-bootstrap.mjs
```

Optional configuration is supplied as environment variables:

- `PRIVY_WALLET_EXTERNAL_ID` (default: `refusal-eth-agent-sepolia`)
- `PRIVY_WALLET_DISPLAY_NAME` (default: `REFUSAL agent — Sepolia`)
- `PRIVY_OWNER_ID` **or** `PRIVY_POLICY_ID` (attach an already-created Privy owner or policy)

The command is idempotent: rerunning it returns the existing active wallet for
the same external ID. It never signs, sends, exports, or moves funds. After it
prints the wallet address, fund it with Sepolia ETH and USDC, then record the
wallet ID and address in local/Vercel secrets only. Create the policy in Privy
Dashboard → Wallet infrastructure → Policies with default deny and an allow
rule restricted to `eth_sendTransaction`, chain `11155111`, and the Sepolia
USDC contract `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`; copy its policy ID
before creating a new wallet if you want the policy attached at creation time.
