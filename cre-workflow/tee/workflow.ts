import { cre, hexToBase64, ok, text, type TeeRuntime } from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { z } from "zod";
import { evaluatePolicyInEnclave } from "../src/workflow.js";

export const configSchema = z.object({
  schedule: z.string(),
  intentUrl: z.string().min(1),
  policySecretId: z.string().min(1),
});
type Config = z.infer<typeof configSchema>;

const policySchema = z.object({
  dailyLimitUSDC: z.number().finite().nonnegative(),
  perTxLimitUSDC: z.number().finite().nonnegative(),
  allowlist: z.array(z.string()),
  spentTodayUSDC: z.number().finite().nonnegative(),
});

const intentSchema = z.object({
  fromENS: z.string().min(1),
  to: z.string().min(1),
  amountUSDC: z.number().finite().nonnegative(),
  revoked: z.boolean(),
});

/** Runs over the secret policy and private HTTP response inside the TEE. */
export const onCronTrigger = (runtime: TeeRuntime<Config>): string => {
  const policyRaw = runtime.getSecret({ id: runtime.config.policySecretId }).result().value;
  const policy = policySchema.parse(JSON.parse(policyRaw));
  const response = new cre.capabilities.HTTPClient()
    .sendRequest(runtime, { url: runtime.config.intentUrl, method: "GET" })
    .result();
  if (!ok(response)) throw new Error(`intent request failed: ${response.statusCode}`);

  const intent = intentSchema.parse(JSON.parse(text(response)));
  const verdict = evaluatePolicyInEnclave(intent, policy);
  runtime.log(`confidential gate complete: ${verdict.decision}/${verdict.reasonCode}`);

  const donRuntime = runtime.usingTheDons();
  const encoded = encodeAbiParameters(parseAbiParameters("string decision, string reasonCode"), [
    verdict.decision,
    verdict.reasonCode,
  ]);
  donRuntime
    .report({
      encodedPayload: hexToBase64(encoded),
      encoderName: "evm",
      signingAlgo: "ecdsa",
      hashingAlgo: "keccak256",
    })
    .result();
  return `${verdict.decision}:${verdict.reasonCode}`;
};

export function initWorkflow(config: Config) {
  const cron = new cre.capabilities.CronCapability();
  return [
    cre.handlerInTee(cron.trigger({ schedule: config.schedule }), onCronTrigger, [
      { tee: "nitro", regions: ["us-west-2"] },
    ]),
  ];
}
