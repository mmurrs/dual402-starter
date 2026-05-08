# dual402-starter

Paid HTTP API template for AI agents. Accepts both **x402** (Base mainnet USDC) and **MPP** (Tempo USDC) on every route. Deploys to **EigenCompute** with a verifiable build.

Built on [`dual402`](https://github.com/mmurrs/dual402).

## Why use this

Your service gets monetized automatically. No API keys, no billing dashboard, no user accounts — every paid route returns a 402 challenge and the client pays per call in USDC. You set the price per endpoint; you get paid per request to your own wallet. Both x402 (Coinbase) and MPP (Tempo) clients just work on day one, so you don't have to pick a side.

On top of that, deploying on EigenCompute gives agents and counterparties something they can't get from AWS or Vercel:

- **Source code verifiability.** The running binary is cryptographically linked to a specific commit in your public repo. Agents can audit exactly what they're paying.
- **Public attestations.** `[BOOT]` log, `/verify` endpoint, and `verify.eigencloud.xyz` dashboard expose commit SHA, facilitator, and payee wallet as third-party-auditable proof.
- **Agent commerce primitives.** Your service pays for its own compute, inference, and upstream tool calls (x402/MPP, onchain), with every settlement logged and traceable.
- **Encrypted memory.** TEE-sealed secrets (CDP keys, upstream API keys) are released only to the measured boot image — your code can read them, no one else can.
- **Programmatic payouts.** Funds move on rules the counterparty can inspect: fixed per-request price, verifiable settlement hash, fresh merchant wallet scoped to the service.

If you'd be fine on AWS, you probably don't need this. If your service needs to prove to an agent or counterparty that the code charging them is exactly what's on GitHub, this is the fastest path.

## Quickstart

```bash
# 1. Use this template on GitHub (green "Use this template" button), or:
git clone https://github.com/mmurrs/dual402-starter my-api
cd my-api && rm -rf .git && git init

# 2. One-time setup — generates a fresh merchant wallet + MPP secret
./scripts/init.sh

# 3. Fill in the rest in .env.mainnet:
#      CDP_API_KEY_ID, CDP_API_KEY_SECRET  (portal.cdp.coinbase.com)
#      SERVICE_NAME, BASE_URL

# 4. Push to GitHub (public repo required for verifiable builds)
gh repo create <user>/my-api --public --source=. --push

# 5. Deploy fresh app to EigenCompute mainnet-alpha
./scripts/deploy.sh --fresh

# 6. Further deploys (after code changes + git push):
./scripts/deploy.sh
```

## What you get out of the box

- Express server with a `/hello` paid route ($0.02 per call) — replace with your own routes
- Dual x402 + MPP middleware via [`dual402`](https://github.com/mmurrs/dual402)
- Auto-generated `/openapi.json` and `/.well-known/x402` discovery
- `/verify` endpoint returning commit SHA, app ID, payee addresses — agent-friendly auditability
- `Dockerfile` with build-time `GIT_SHA` / `BUILD_TIME` args baked into the boot log
- Public-by-default `--log-visibility public` deploy — boot log is third-party proof
- Safe mainnet defaults: CDP facilitator, `USD Coin` (not `USDC`) EIP-712 name, `trust proxy`
- Optional Vercel proxy in `proxy/` for a custom domain + landing page

## Replace the sample route

Edit `server.js`:

1. Define your input/output schemas
2. Replace `chargeHello` + `handleHello` with your own
3. Wire the routes into both `app.post(...)` / `app.get(...)` AND the `routes: [...]` array passed to `dualDiscovery()`

Keep the discovery array in sync with your actual routes — this is what `/openapi.json` and agent clients read.

## Sample: paying for `/hello`

After deploy:

```bash
# See the 402 challenge (both payment headers)
curl -sI "https://your-domain/hello?name=alice" | grep -iE "payment-required|www-authenticate"

# Pay with AgentCash (auto-pays via x402 on Base mainnet)
npx agentcash add https://your-domain
# then in any tool that speaks agentcash:
#   mcp__agentcash__fetch url=https://your-domain/hello?name=alice
```

## Custom domain (optional)

Use the `proxy/` directory to put a Vercel edge + landing page in front of your backend IP:

```bash
cd proxy/
vercel link --yes --project my-api
# Point proxy at ecloud IP (get it from `ecloud compute app info`)
echo "http://<ecloud-ip>:8080" | vercel env add BACKEND_URL production
vercel --prod
```

Add static assets under `proxy/public/` (`index.html`, `llms.txt`, `skill.md`, `favicon.svg`). The proxy rewrites `/` and `/favicon.svg` to the edge; everything else proxies to the backend.

## Gotchas

Critical defaults that prevent hours of debugging:

1. **Fresh merchant wallet, always.** `init.sh` generates one. Never reuse your AgentCash/personal wallet — CDP rejects self-transfers with `invalid_payload`.
2. **Base mainnet needs CDP auth.** The default `X402_FACILITATOR_URL` is CDP's mainnet endpoint. `x402.org/facilitator` is Sepolia-only.
3. **EIP-712 name is `"USD Coin"`, not `"USDC"`.** Handled in `dual402`. Don't override.
4. **Dockerfile `COPY` uses CWD as build context.** `deploy.sh` always `cd`s to the repo root.
5. **Vercel proxy MUST have `bodyParser: false`.** Included — don't remove.
6. **Use your GitHub remote's HTTPS URL.** `deploy.sh` normalizes `git@` to `https://` for ecloud.

## Files

```
server.js              Your routes + dual402 wiring (edit this)
Dockerfile             Builds the backend container
.env.example           Every env var documented
scripts/init.sh        First-time setup — generates wallet + secrets
scripts/deploy.sh      Deploy to EigenCompute (verifiable build)
proxy/                 Optional Vercel edge proxy + landing page
tests/smoke.mjs        Offline smoke (`npm test`)
```

## License

MIT — see [LICENSE](./LICENSE).

Built with [`dual402`](https://github.com/mmurrs/dual402) · Deployed on [EigenCompute](https://eigencloud.xyz).
