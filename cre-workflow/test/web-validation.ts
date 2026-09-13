import { parseStrictAddress, parseStrictAmount } from "../../web/lib/validation.ts";

const check = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`PASS: ${label}`);
};

check("valid checksum address", parseStrictAddress("0x000000000000000000000000000000000000dEaD") !== null);
check("invalid address rejected", parseStrictAddress("0x1234") === null);
check("positive integer amount", parseStrictAmount("125") === 125);
check("zero amount rejected", parseStrictAmount("0") === null);
check("fractional amount rejected", parseStrictAmount("1.25") === null);
check("exponent amount rejected", parseStrictAmount("1e3") === null);
check("NaN amount rejected", parseStrictAmount(Number.NaN) === null);
check("boolean amount rejected", parseStrictAmount(true) === null);
check("unsafe integer rejected", parseStrictAmount(Number.MAX_SAFE_INTEGER + 1) === null);
