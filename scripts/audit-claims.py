#!/usr/bin/env python3
"""audit-claims: README prose must match executed reality. Non-zero exit on any lie.
Checks:
  1. tests-N badge == forge passing + gate asserts (runs both suites)
  2. word LIVE in README requires evidence artifacts (cre-sim.log or *-tx.*)
  3. web/TS mirror parity holds (20/20)
  4. no dead `void <ident>;` lines in web/
Usage: python3 scripts/audit-claims.py  (run from repo root via `make verify`)
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
fails: list[str] = []


def run(cmd: list[str], cwd: Path) -> str:
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=600)
    return (p.stdout or "") + (p.stderr or "")


# 1. test counts
forge_out = run(["forge", "test"], ROOT / "contracts")
m = re.search(r"(\d+) tests passed", forge_out)
forge_n = int(m.group(1)) if m else 0
if forge_n == 0:
    fails.append("forge: 0 tests passed")

gate_out = run(["npx", "tsx", "test/gate.test.ts"], ROOT / "cre-workflow")
m = re.search(r"PASS: (\d+) gate asserts", gate_out)
gate_n = int(m.group(1)) if m else 0
if gate_n == 0:
    fails.append(f"gate asserts failed:\n{gate_out[-800:]}")

readme = (ROOT / "README.md").read_text()
m = re.search(r"tests-(\d+)%20passing|tests-(\d+) passing", readme)
badge_n = int(m.group(1) or m.group(2)) if m else -1
if badge_n != forge_n + gate_n:
    fails.append(f"badge tests-{badge_n} != executed {forge_n}+{gate_n}={forge_n + gate_n}")

# 2. LIVE status cells need evidence (a table row claiming LIVE without artifacts is a lie;
#    prose mentioning LIVE, e.g. this script's own description, is not a claim)
live_cells = [ln for ln in readme.splitlines() if re.match(r"^\|.*\|\s*LIVE\b", ln)]
if live_cells:
    ev = list((ROOT / "evidence").glob("*"))
    names = " ".join(p.name for p in ev)
    if "cre-sim.log" not in names and not [p for p in ev if "-tx." in p.name or p.suffix == ".json"]:
        fails.append("README claims LIVE but evidence/ has no sim log or tx artifacts")

# 3. parity
par_out = run(["npx", "tsx", "test/parity.ts"], ROOT / "cre-workflow")
if "20/20" not in par_out:
    fails.append(f"mirror parity broken:\n{par_out[-800:]}")

# 4. dead void lines
for ts in list((ROOT / "web").rglob("*.ts")) + list((ROOT / "web").rglob("*.tsx")):
    if "node_modules" in ts.parts or ".next" in ts.parts:
        continue
    for i, line in enumerate(ts.read_text().splitlines(), 1):
        if re.match(r"^\s*void \w+;\s*$", line):
            fails.append(f"dead code {ts.relative_to(ROOT)}:{i}: {line.strip()}")

if fails:
    print("AUDIT FAIL:")
    for f in fails:
        print(f" - {f}")
    sys.exit(1)
print(f"AUDIT PASS: badge tests-{badge_n} == {forge_n} forge + {gate_n} gate; parity 20/20; no dead code; LIVE claims backed.")
