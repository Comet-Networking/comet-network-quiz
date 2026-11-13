import { Elysia, t } from 'elysia';

import { lanAddresses } from './network';

const strict = { additionalProperties: false } as const;
const Id = t.String({ minLength: 1, maxLength: 64 });

const Pong = t.Object({ type: t.Literal('pong'), requestId: Id }, strict);
const Said = t.Object({ type: t.Literal('said'), text: t.String()}, strict);

function createApi() {
  return new Elysia()
    .get('/health', () => ({ status: 'ok' as const }))
    .get('/info', () => ({ addresses: lanAddresses() }))
    .post('/echo', ({ body }) => ({ message: body.message }), {
      body: t.Object(
        { message: t.String({ minLength: 1, maxLength: 200 }) },
        { additionalProperties: false },
      ),
    })
    .ws('/ws', {
      body: t.Union([
        t.Object({ type: t.Literal('ping'), requestId: Id }, strict),
        t.Object({ type: t.Literal('say'), text: t.String({ minLength: 1, maxLength: 24 })}, strict),
      ]),
      response: t.Union([Pong, Said]),
      open(socket) {
        socket.subscribe('lobby');
      },
      message(socket, message) {
        if (message.type === 'ping') {
          socket.send({ type: 'pong', requestId: message.requestId });
          return;
        }
        const out = {
          type: 'said' as const,
          text: message.text,
        };
        socket.send(out);
        socket.publish('lobby', out);
      },
    });
}

// No listener or game state here: production composes this app and Eden derives its types.
export function createApp() {
  const app = new Elysia({ websocket: { maxPayloadLength: 1024 } });
  return app.group('/api', (api) => api.use(createApi()));
}

export type App = ReturnType<typeof createApp>;