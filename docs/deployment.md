# GitHub and Render setup

The scaffold includes CI and a Render Blueprint. It does not connect your Render
account or deploy a service. No deploy hook, deploy token, or GitHub Actions secret
is needed for Render's GitHub integration.

## GitHub (repository administrator)

1. Review and merge the scaffold pull request into
   `Comet-Networking/comet-network-quiz` on `main`. The existing branch rule requires
   one approval; the **Quality** CI check is also required by this setup.
2. Actions is enabled. Confirm **CI / Quality** passes again on the merged `main`
   commit before connecting Render. The workflow uses pinned action commits and
   does not need repository secrets.
3. The committed Dependabot config updates `bun` and `github-actions` weekly once
   it reaches the default branch. GitHub supports the text `bun.lock`, not the old
   binary `bun.lockb`. Review the resulting update PRs before merging them.

## Render (account owner)

1. Sign up/sign in at <https://dashboard.render.com>.
2. Select **New → Blueprint**. Connect GitHub and grant Render access to
   **Comet-Networking/comet-network-quiz** (organization approval may be needed).
   Select that repository. Use the connected GitHub integration rather than a
   public repository URL so automatic deploys and CI integration work.
3. Select **main**, use **render.yaml** as the Blueprint path, and review the plan.
   It must create exactly **one Web Service on the Free plan**. There is no database,
   disk, paid preview environment, or separate static service.
4. Apply/create the Blueprint. Confirm the service branch is **main** and its
   auto-deploy setting is **After CI Checks Pass** (`autoDeployTrigger: checksPass`).
   The first Blueprint application may initiate a first build; later `main` commits
   are gated by CI. Render does not auto-deploy a commit with zero checks or a
   failed check. GitHub Actions checks are supported.
5. Verify the build/start logs and live URL. Render's Node native runtime installs
   Bun **1.4.4** from `.bun-version`; remove any dashboard `BUN_VERSION` override
   that disagrees. Build is `bun install --frozen-lockfile && bun run build`;
   start is `bun run start`; `NODE_ENV=production`. The build needs dev dependencies
   for TypeScript/Vite, so do not add `--production` to the install command.
   Render supplies `PORT`, and the app binds `0.0.0.0`.

No app credentials are needed. If connecting accounts requires authorization, do
it in GitHub/Render's own UI. Do not paste tokens into chat or commit them.

## Verify after deployment

Replace `YOUR-SERVICE` with Render's assigned hostname:

```sh
curl -i https://YOUR-SERVICE.onrender.com/api/health
curl -I https://YOUR-SERVICE.onrender.com/host
curl -I https://YOUR-SERVICE.onrender.com/play
curl -i https://YOUR-SERVICE.onrender.com/api/missing
curl -i https://YOUR-SERVICE.onrender.com/assets/missing.js
```

Health should return 200 JSON `{"status":"ok"}`. Open `/`, `/host`, and `/play`
directly in a browser and confirm the UI loads and navigation works. Unknown API
and missing asset requests must return 404 rather than HTML.

On the deployed page, run this in the browser console to validate the WSS upgrade
and shared-origin transport (not gameplay):

```js
const socket = new WebSocket(`wss://${location.host}/api/ws`);
socket.addEventListener('open', () => {
  socket.send(JSON.stringify({ type: 'ping', requestId: 'render-smoke' }));
});
socket.addEventListener('message', (event) => {
  console.log(event.data); // {"type":"pong","requestId":"render-smoke"}
  socket.close();
});
socket.addEventListener('error', console.error);
```

## Free plan limits for class

Render spins a Free service down after **15 minutes** with no inbound HTTP requests
or WebSocket messages. The next request/connection wakes it; cold start takes
**about one minute**, an estimate rather than a guarantee. Open the site **2–3
minutes before the class demo**, verify health and WSS, and allow extra time if
needed. An idle connected socket alone is not activity. Future in-memory games
reset on restart, deploy, and spin-down; no resume guarantee is implemented.

Free instance hours, bandwidth, and build minutes have usage limits. Keep the
service on Free and leave the workspace without a payment method if you want usage
exhaustion to suspend service/builds instead of billing overages.

References, checked 2026-11-09:
[Blueprint fields](https://render.com/docs/blueprint-spec),
[Bun version selection](https://render.com/docs/bun-version),
[CI integration](https://render.com/docs/deploys#integrating-with-ci),
[Free service limits](https://render.com/docs/free), and
[Dependabot ecosystems](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories).
