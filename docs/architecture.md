# Architecture and protocol working notes

## Present scaffold

One Bun process owns Elysia HTTP and WebSocket endpoints. In development, Vite
serves React and proxies all `/api` traffic, including upgrades, to that process.
In production, `@elysia/static` serves compiled UI assets and explicit GET routes
for `/`, `/host`, and `/play` return the SPA entry file. Unknown paths, unknown APIs,
and missing assets stay 404. When adding a client route, add its production entry
route in `src/server/production.ts` too. The fallback never matches `/api/ws`.

`createApp()` has no listener or state; `index.ts` owns process startup. The Eden
client's type import of `App` is erased by the build. Client and server share an
origin, so Eden uses HTTP/WS locally and HTTPS/WSS on Render. No CORS or public
backend URL is needed for this deployment model.

The shared schema module contains only public protocol data. Neither the client
helper nor importing the UI opens a socket. Future components can call
`createTransport()`, then `health()` or `connect()`. Register socket `open`, `error`,
and `close` handlers, send only after `open`, subscribe to messages, and call
`close()` during component cleanup. Do not start asynchronous work without handling
its rejection; do not treat a connection failure as a game outcome.

## Implemented transport contract

Endpoint: `/api/ws`. Text JSON messages, limited to 1024 bytes at the WebSocket
server. Both incoming `body` and outgoing `response` use Elysia schemas.

| Direction       | Shape                                   | Meaning                         |
| --------------- | --------------------------------------- | ------------------------------- |
| Client → server | `{"type":"ping","requestId":"probe-1"}` | Probe the application transport |
| Server → client | `{"type":"pong","requestId":"probe-1"}` | Echo the request ID             |

IDs contain 1–64 characters. Extra properties are rejected by the contract. These
messages are application JSON, separate from WebSocket ping/pong control frames.
Elysia handles malformed/invalid messages with its validation-error response; it
is not an application `pong` or a future game error. There is no version negotiation,
authentication, room authorization, retry policy, or reconnect state yet.

## Fill in before gameplay

Use a short entry like this for each proposed message:

```text
Name / direction:
Motivation and example:
Schema and protocol version:
Allowed sender and game state:
Server validation and authoritative state transition:
Success event(s), error shape, duplicate/late-message behavior:
Ordering / reconnect / retry policy:
Timeout / size / rate limits:
Tests and evaluation evidence:
```

Decide room and player IDs, host ownership, game phases, answer submission, server
deadlines, scoring, and disconnect behavior before implementing them. Keep answers
and clocks authoritative on the server; clients must not set scores or answer keys.
If room state is eventually stored only in memory, every restart, deploy, or free
service spin-down loses all games. This scaffold does not provide persistence.

HTTP/WebSocket are high-level protocols allowed by the assignment. Explain their
tradeoffs and your application message protocol in the report; do not claim to have
implemented TCP, TLS, or WebSocket framing.

API references: [Elysia WebSocket validation](https://elysiajs.com/patterns/websocket),
[Eden sockets](https://elysiajs.com/eden/treaty/websocket),
[Elysia static plugin](https://elysiajs.com/plugins/static), and
[TanStack Vite file routes](https://tanstack.com/router/latest/docs/installation/with-vite).
