declare module "@chainlink/cre-sdk" {
  export { cre } from "./node_modules/@chainlink/cre-sdk/dist/sdk/cre";
  export { Runner } from "./node_modules/@chainlink/cre-sdk/dist/sdk/wasm/runner";
  export { hexToBase64 } from "./node_modules/@chainlink/cre-sdk/dist/sdk/utils/hex-utils";
  export { ok, text } from "./node_modules/@chainlink/cre-sdk/dist/sdk/utils/capabilities/http/http-helpers";
  export type { TeeRuntime } from "./node_modules/@chainlink/cre-sdk/dist/sdk/runtime";
}
