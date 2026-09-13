.PHONY: verify gate-sim parity ensv2-test forge-test audit

verify: gate-sim parity ensv2-test forge-test audit

gate-sim:
	cd cre-workflow && node --import tsx src/sim.ts

parity:
	cd cre-workflow && node --import tsx test/parity.ts

ensv2-test:
	cd cre-workflow && node --import tsx test/ensv2-config.ts

forge-test:
	cd contracts && forge test --offline --no-auto-detect

audit:
	python3 scripts/audit-claims.py
