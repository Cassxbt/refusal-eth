# Chainlink CRE Confidential Workflow simulation

Status: verified by the official CRE CLI on 2026-09-13.

Command:

```bash
cre workflow simulate tee \
  --project-root cre-workflow \
  --target staging-settings \
  --non-interactive \
  --trigger-index 0 \
  --env /path/to/ephemeral-test-env
```

The environment file contained a disposable staging policy under
`REFUSAL_SEALED_POLICY_JSON`. Its value is intentionally not recorded.

Result:

```text
✓ Workflow compiled
✓ Simulation limits enabled
Trigger requested TEE Execution
- AWS Nitro in us-west-2
[USER LOG] confidential gate complete: ALLOW/ALLOW
✓ Workflow Simulation Result:
"ALLOW:ALLOW"
Simulation complete!
```

Build identifiers:

- Binary hash: `fe98f771a094191a463e3567c7e7f1d421bf18b8b30c929fad1b02fe13602276`
- Config hash: `5e6adc22b1813c0065bdd287deca99257c7c4a0845bcecda868432092497ca9b`

This is a CRE CLI simulation, not a production CRE deployment. The simulator
itself warns that it is not a real TEE; production deployment remains a
separate, optional evidence path requiring Chainlink deployment access.

The simulated confidential path is load-bearing: the handler retrieves the
sealed policy with `runtime.getSecret`, fetches the intent through the TEE
runtime, evaluates the policy in the enclave, and reports only the decision and
reason code after crossing back to the DON runtime.
