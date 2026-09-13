# ETHOnline 2026 Submission Tasklist

This is the execution checklist for the current Start Fresh submission candidate.
Nothing is marked complete without an executable test, public proof, or recorded
artifact. Secrets belong in local/Vercel environment variables only.

## Gate 0 — submission integrity

- [ ] Confirm the project-specific work began after ETHOnline kickoff; preserve the
      existing commit history and do not rewrite timestamps.
- [ ] Push the complete repository to the public GitHub remote; verify the default
      branch, clone, README, and all evidence files from a clean checkout.
- [ ] Add AI-use attribution, prompts, specs, and planning artifacts required by
      ETHGlobal. Remove the ignore rules that currently exclude submission evidence
      and `BUILD_SPEC.md`, then review for secrets before committing.
- [ ] Create the 2–4 minute, 720p human-voiced walkthrough. Show one successful
      path, at least two named refusal paths, and the proof receipt.
- [ ] Select exactly the three partner entries in the ETHGlobal submission form and
      map each selected requirement to a repository file and evidence artifact.

Acceptance: a clean clone contains the source, evidence, AI disclosure, and README;
the video opens and meets the duration/resolution/voice rules.

## Gate 1 — reproducible verification

- [x] Replace the failing `npx tsx` invocations in `Makefile` and
      `scripts/audit-claims.py` with a runner that works in CI and locally.
- [x] Make Foundry verification deterministic without relying on host proxy
      discovery; run the full suite in a clean environment.
- [x] Make the test badge derive from executed results: 5 Solidity tests + 10 gate
      assertions, with parity and claim-audit checks also green.
- [ ] Add CI that runs the same commands used by the README.

Acceptance: `make verify` exits 0 from the current checkout and the reported counts
match the logs. CI remains pending.

## Gate 2 — ENSv2 identity and authority

- [ ] Use the current ENSv2 Sepolia SDK/docs linked from the ETHOnline prize page.
- [ ] Deploy/configure a Permissioned Registry and Permissioned Resolver with
      Enhanced Access Control; create the agent namespace and required aliasing.
- [ ] Record contract addresses, chain ID, transaction hashes, resolver output, and
      role/access-control evidence in `evidence/ensv2.md`.
- [ ] Replace the generic read-only ENS lookup with live ENSv2 resolution and
      revocation checks; normalize to a canonical ENS node representation.
- [ ] Add tests for namespace creation, aliasing, delegated permissions, revoke,
      and mixed-case/canonical-name behavior.

Acceptance: a fresh judge can resolve the real agent namespace on Sepolia, observe
the resolver/role, revoke it, and reproduce REF-01 from the public proof path.

## Gate 3 — Chainlink CRE Confidential Workflow

- [ ] Reconcile the exact current CRE TypeScript SDK/CLI versions from Chainlink’s
      official docs linked on the ETHOnline prize page.
- [ ] Add the real workflow manifest and `@chainlink/cre-sdk` integration.
- [ ] Register `handlerInTee`; fetch at least one sensitive policy input with the
      current secret API; keep limits/allowlist/private intermediates inside the
      enclave.
- [ ] Make the CRE verdict load-bearing: no valid verdict means no downstream
      signing/execution, and the public output reveals only the decision/reason code.
- [ ] Run `cre workflow simulate` (or a live CRE deployment), save the terminal
      transcript and workflow/binary hash in `evidence/cre-sim.log` and
      `evidence/cre-manifest.json`.
- [ ] Add adversarial tests proving secrets and policy values do not leave the
      confidential handler and that refusal order cannot drift.

Acceptance: a judge can inspect the workflow, see a real TEE handler processing a
sensitive value, rerun the simulation, and connect its verdict to the application.

## Gate 4 — Privy wallet, controls, and financial flow

- [ ] Use the current Privy Node SDK/docs linked from the ETHOnline prize page;
      confirm the supplied app ID and secret via environment variables only.
- [ ] Create/use one disposable funded Sepolia Privy wallet.
- [ ] Configure at least one current Privy control (policy, signer, key quorum, or
      intent) enforcing the refusal boundary and human approval path.
- [ ] Implement the live signing/transaction adapter; return REF-04 on denied or
      timed-out approval and never sign without a valid CRE ALLOW verdict.
- [ ] Execute one real Sepolia financial flow and record wallet/policy/quorum IDs
      (redacted where sensitive), transaction hash, and approval evidence in
      `evidence/privy-flow.md`.
- [ ] Add tests for allow, policy rejection, human denial/timeout, replay, and
      missing verdict.

Acceptance: one real Privy-controlled Sepolia transaction completes end to end;
the same path visibly refuses when policy or human approval fails.

## Gate 5 — contract and policy enforcement

- [ ] Wire CRE verdicts and Privy execution to the deployed `RefusalGateway`.
- [ ] Decide and implement the actual asset movement/settlement behavior; an event
      plus proof ID is not a financial flow.
- [ ] Enforce canonical ENS revocation, allowlist, per-transaction, daily limits,
      verdict freshness, and replay protection at the appropriate trust boundary.
- [ ] Emit and expose structured refusal receipts, not only declared unused errors.
- [ ] Use integer-safe token units and strict Ethereum-address validation.

Acceptance: removing or forging any sponsor verdict cannot move funds; allowed and
refused outcomes are independently testable and observable.

## Gate 6 — proof surface and persistence

- [ ] Replace file-backed serverless state with a shared durable store suitable for
      the selected Vercel deployment, or clearly constrain the deployment to a
      persistent host and verify that behavior.
- [ ] Use cryptographically strong proof IDs and bind receipts to chain, contract,
      ENS node, intent, verdict, and transaction.
- [ ] Build `/proof/<id>` to recompute/verify the receipt and show both success and
      refusal, with explorer links or an explicit no-transaction refusal proof.
- [ ] Add a public health endpoint and a hostile/security-lab path that judges can
      trigger in under 90 seconds.

Acceptance: a clean browser or curl session can independently verify a real allow
receipt and at least two refusal receipts without a wallet.

## Gate 7 — deployment and judge packaging

- [ ] Configure only the required Vercel environment variables; never commit `.env`
      files, private keys, app secrets, wallet seeds, or raw approval payloads.
- [ ] Deploy from the verified commit; smoke-test every public route and confirm
      the URL is reachable from a clean browser.
- [ ] Add a README judge packet: failure mode, one mechanism name, live URL, video,
      sponsor integration table with call sites, architecture diagram, evidence
      links, exact tests, and honesty table.
- [ ] Freeze code/evidence after submission if the event or sponsor challenge
      requires no post-submission workflow changes.

Acceptance: a stranger can reach the live app, reproduce the core loop in 60–90
seconds, inspect the source/evidence, and understand every real-vs-pending boundary.

## Final red-team sign-off

- [ ] Independent reviewer reruns the clean-clone verification and public judge path.
- [ ] Independent reviewer attempts ENS case/alias/revoke bypasses.
- [ ] Independent reviewer attempts forged, replayed, stale, missing, and refused
      verdicts against the gateway and Privy adapter.
- [ ] Independent reviewer checks that sponsor SDKs are load-bearing and that the
      project stops working when each selected primitive is removed.
- [ ] Independent reviewer checks README, video, deployed behavior, and evidence
      for claim drift.

Final status: **DO NOT SUBMIT until every unchecked gate above is either completed
with evidence or deliberately removed from the claimed prize scope.**
