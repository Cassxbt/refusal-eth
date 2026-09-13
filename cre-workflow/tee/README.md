# REFUSAL.eth confidential workflow

This is the current Chainlink CRE template-shaped integration. The cron
handler runs inside a Nitro TEE, retrieves `SEALED_POLICY` with
`runtime.getSecret`, fetches a public intent envelope, and returns only the
decision and refusal code to the DON report. Policy values and raw HTTP payloads
remain inside the confidential handler.

The repository records a successful `cre workflow simulate` transcript in
`evidence/chainlink-cre-simulation.md`; this satisfies the ETHGlobal simulation
evidence path. Production deployment is not claimed and remains gated by
Chainlink deployment access. Never commit `REFUSAL_SEALED_POLICY_JSON` or any
other secret value.

## Reproduce the simulation

From the repository root, provide an ephemeral environment file containing a
JSON value for `REFUSAL_SEALED_POLICY_JSON`, then run:

```bash
cre workflow simulate tee \
  --project-root cre-workflow \
  --target staging-settings \
  --non-interactive \
  --trigger-index 0 \
  --env /path/to/ephemeral-test-env
```

The staging endpoint is local by design; production configuration points at the
deployed API only after that deployment is verified. The simulator is not a
real TEE and must never receive production secrets.
