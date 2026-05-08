import { test } from "node:test";
import assert from "node:assert/strict";

// Minimal offline smoke — can we at least import the package and boot the
// middleware with mock env? Fuller dual-402 smokes live in mmurrs/dual-402.

test("server module loads with mock env", async () => {
  process.env.MPP_SECRET_KEY = "0".repeat(64);
  process.env.USDC_TEMPO = "0x20C068fa8e3b47B2A6f46c3b40b9537d11c60E8b50";
  process.env.RECIPIENT_WALLET = "0x1111111111111111111111111111111111111111";
  process.env.X402_NETWORK = "eip155:84532";
  process.env.X402_FACILITATOR_URL = "https://x402.org/facilitator";
  process.env.PORT = "0"; // don't actually bind

  // We only verify the import chain works — skip actually listening.
  const { createDual402, dualDiscovery } = await import("dual-402");
  assert.equal(typeof createDual402, "function");
  assert.equal(typeof dualDiscovery, "function");

  const dual = createDual402({
    mpp: {
      currency: process.env.USDC_TEMPO,
      recipient: process.env.RECIPIENT_WALLET,
      secretKey: process.env.MPP_SECRET_KEY,
      testnet: true,
    },
    x402: {
      payTo: process.env.RECIPIENT_WALLET,
      network: process.env.X402_NETWORK,
      facilitatorUrl: process.env.X402_FACILITATOR_URL,
    },
  });
  assert.equal(typeof dual.charge, "function");
});
