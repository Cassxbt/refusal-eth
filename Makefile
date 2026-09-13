.PHONY: verify gate-sim parity forge-test audit

verify: gate-sim parity forge-test audit

gate-sim:
	cd cre-workflow && node --import tsx src/sim.ts

parity:
	cd cre-workflow && node --import tsx test/parity.ts

forge-test:
	cd contracts && forge test --offline --no-auto-detect

audit:
	python3 scripts/audit-claims.py
