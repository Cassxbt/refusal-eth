# AI-use disclosure

## Tool and human involvement

OpenAI Codex was used as an engineering assistant during ETHOnline development.
The project author supplied the product direction, selected the intended prize
tracks, reviewed the implementation, and retains responsibility for all final
code, integrations, transactions, and submission claims. Codex was not used to
generate a demo voiceover or to impersonate a human presenter.

## Where AI assisted

Codex assisted with repository inspection, sponsor-document comparison, and
security review, then proposed or edited the following tracked files:

- `Makefile` and `scripts/audit-claims.py` — deterministic local verification
  and claim-to-test checks.
- `.github/workflows/verify.yml` — CI execution of the same verification path.
- `contracts/`, `cre-workflow/`, `web/`, and `signer/` — implementation and test
  changes reviewed against the project’s security requirements. Any sponsor
  integration remains explicitly marked TODO until its official SDK call site
  and executed evidence exist.
- `README.md` — judge-facing description, limitations, and test instructions.

The author reviewed the resulting diffs and test output. AI assistance does not
constitute evidence that an integration is live: live claims require the
corresponding source, receipt, transaction, or simulation artifact.

## Credentials and private material

No private keys, app secrets, wallet seeds, authorization signatures, or raw
approval payloads are stored in this repository. Any deployment credentials are
entered only into a local or server-side secret store after rotation.

Internal research and planning notes are intentionally kept out of the public
repository; this file is the complete AI-use disclosure for the submission.
