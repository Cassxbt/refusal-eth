# REFUSAL.eth — public submission specification

## Problem

AI agents can be prompt-injected into unsafe spending when policy is readable
context and signing is unconditional. REFUSAL.eth makes refusal the default:
identity, sealed policy, human authorization, and execution are separate gates.

## User-visible flow

`ENS identity → policy decision → human-controlled signer → Sepolia execution`

The public proof surface must show an allow receipt or a named refusal reason;
it must never expose sealed policy values or credentials.

## Non-negotiable invariants

1. Unknown or unavailable identity data fails closed.
2. Invalid, stale, replayed, or missing verdicts cannot authorize execution.
3. Revocation is canonical and one-way at the public demo boundary.
4. Token amounts and recipient addresses are strictly validated.
5. Every live sponsor claim has a source call site and reproducible evidence.

## Acceptance evidence

- deterministic local tests and CI;
- a live ENSv2 Sepolia resolution and revocation proof;
- a real Chainlink CRE confidential-handler simulation or deployment proof;
- a real Privy-controlled Sepolia transaction and refusal path;
- public proof pages linking each result to its receipt or explicit no-tx refusal.

This file intentionally contains only product scope and acceptance criteria;
internal sponsor research and planning notes are not part of the submission.
