# Comet Network Quiz

A runnable infrastructure scaffold for a future multiplayer quiz: quicker correct
answers will earn more points, and wrong answers will earn none. **Gameplay is not
implemented.** The `/`, `/host`, and `/play` pages are explicit placeholders.

Included: a Mantine layout, generated file routes, a health endpoint, validated
WebSocket ping/pong, a typed client helper, strict checks, CI, and one Render Free
service configuration. No rooms, joins, timers, scoring, player state, quiz editor,
accounts, database, or persistence exists.

## Intended future MVP

The planned scope is one active quiz with one host and roughly 2–10 players.
Players join with a nickname before the host starts. The server loads quiz YAML
with four choices per question, runs a fixed question timer, and lets the host
advance between questions; the quiz ends with a final leaderboard. The scoring
formula is still to be finalized. These are future requirements, not implemented
features.

## Run locally

Install [Bun](https://bun.com/docs/installation) **1.4.4** (see `.bun-version` and
`packageManager`). No separate Node installation or environment file is required.

```sh
bun install --frozen-lockfile
bun run dev
```

Open <http://localhost:5173>. Vite runs on Bun and proxies `/api` HTTP and WebSocket
traffic to the Bun/Elysia server on port 3000. The dev command runs both processes;
stop it with Ctrl+C. Keep port 3000 at its default when using this Vite proxy.

```sh
bun run check      # format, lint (zero warnings), types, tests, production build
bun run build      # generate routes, typecheck, build UI
bun run start      # production mode: serves dist/client + HTTP + WS on port 3000
# Optional production port override:
PORT=10000 bun run start
```

Production binds `0.0.0.0`; `PORT` must be an integer from 1 to 65535. Render supplies
it automatically. Health: `GET /api/health` → `{"status":"ok"}`. This measures
process reachability, not gameplay readiness. `/api/ws` accepts
`{"type":"ping","requestId":"probe-1"}` and replies with the matching `pong`.

Other scripts: `lint`, `lint:fix`, `typecheck`, `format`, `format:check`, `test`, and
`routes:generate`. Bun runs tests; there is no absent-test bypass. The CLI generates
routes before standalone lint/typecheck; the Vite plugin updates them during
development/build. `routeTree.gen.ts` is ignored by Git/lint/Prettier, generated
without `@ts-nocheck`, and included in client typechecking.

## Where code belongs

| Directory    | Responsibility                                                          |
| ------------ | ----------------------------------------------------------------------- |
| `src/client` | React UI, file routes, and caller-owned Eden transport                  |
| `src/server` | Elysia endpoints, production static serving, future authoritative rules |
| `src/shared` | Public runtime message schemas and derived types                        |
| `quizzes`    | Server-only hand-authored YAML and format schema, including answer keys |
| `tests`      | HTTP, configuration, and protocol boundary checks with Bun              |
| `docs`       | Deployment, protocol decisions, report/evaluation outline               |

The client imports the server `App` **as a type only**. ESLint forbids server
runtime imports and quiz imports in the browser. The production server exposes
only `dist/client`; quiz files are not public assets. There are no globally opened
sockets or client state dependencies.

## Included libraries and tools

All direct package versions are exact, with one `package.json` and text `bun.lock`.

- Runtime: React/React DOM, Mantine core/hooks, TanStack React Router, Elysia
  **1.4.31 stable**, `@elysia/eden`, and `@elysia/static`.
- Build: Vite with its React plugin; TanStack Router plugin and CLI for file routes.
- Styles: PostCSS, `postcss-preset-mantine`, and `postcss-simple-vars`, configured
  in `postcss.config.cjs` with Mantine's default breakpoint variables. Vite supports
  `*.module.css` files, including Mantine CSS examples that use nesting and mixins.
- Quality: TypeScript, typescript-eslint (`strictTypeChecked` and
  `stylisticTypeChecked`), ESLint and `@eslint/js`, React hooks/refresh and JSX
  accessibility rules/types, globals, Prettier with eslint-config-prettier.
- Types/testing: Bun's built-in runner, Bun/Node/React/React DOM type packages, and
  TypeBox's schema compiler to test the protocol contract.

TypeScript checks client, server, shared schemas, tests, TS tooling configs, and
the static PostCSS config (`checkJs`). Side-effect imports are checked too;
Vite's ambient declarations cover CSS imports.
Browser and Bun type environments are separate. `skipLibCheck` skips third-party
declaration internals, not project source. TS 6 is pinned within typescript-eslint's
supported range; Vite 7/React plugin 5 and ESLint 9 match the installed plugin peer
ranges. ESLint's no-unsafe, no-explicit-any, no-floating-promises (including bare
`void`), and no-misused-promises checks are active. Prettier alone owns formatting.

## Next implementation steps

1. Agree on the game states, public message schemas, IDs, errors, and reconnect
   policy in [the protocol notes](docs/architecture.md).
2. Add server-side quiz loading/validation, room ownership, and authoritative rules.
3. Define answer deadlines and scoring; test duplicates, late answers, and disconnects.
4. Implement small host/player flows against the typed protocol.
5. Evaluate multiple clients, latency, malformed input, and restarts; annotate source
   and write the class report using [the outline](docs/report-outline.md).

See [CONTRIBUTING.md](CONTRIBUTING.md) for teamwork/CI and
[docs/deployment.md](docs/deployment.md) for the manual GitHub and Render setup.

The original [MIT license](LICENSE) is preserved.
