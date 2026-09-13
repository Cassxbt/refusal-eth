.PHONY: verify gate-sim parity forge-test audit

verify: gate-sim parity forge-test audit

gate-sim:
	cd cre-workflow && npx tsx src/sim.ts

parity:
	cd cre-workflow && npx tsx test/parity.ts

forge-test:
	cd contracts && forge test

audit:
	python3 scripts/audit-claims.py
