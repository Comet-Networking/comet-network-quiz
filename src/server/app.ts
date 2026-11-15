import { Elysia, t } from 'elysia';

import { createLobby } from './lobbies';

function createApi() {
  return new Elysia()
    .get('/health', () => ({ status: 'ok' as const }))
    .post('/echo', ({ body }) => ({ message: body.message }), {
      body: t.Object(
        { message: t.String({ minLength: 1, maxLength: 200 }) },
        { additionalProperties: false },
      ),
    })
    .ws('/ws', {
      // Application JSON, separate from WebSocket control-frame ping/pong.
      // Expand these public schemas before adding handlers; never send answer keys.
      body: t.Union([
        t.Object(
          {
            type: t.Literal('ping'),
            requestId: t.String({ minLength: 1, maxLength: 64 }),
          },
          { additionalProperties: false },
        ),
        t.Object(
          { type: t.Literal('create-lobby') },
          { additionalProperties: false },
        ),
      ]),
      response: t.Union([
        t.Object(
          {
            type: t.Literal('pong'),
            requestId: t.String({ minLength: 1, maxLength: 64 }),
          },
          { additionalProperties: false },
        ),
        t.Object(
          { type: t.Literal('lobby-created'), code: t.String() },
          { additionalProperties: false },
        ),
      ]),
      message(socket, message) {
        if (message.type === 'ping') {
          socket.send({ type: 'pong', requestId: message.requestId });
        } else {
          const lobby = createLobby();
          socket.send({ type: 'lobby-created', code: lobby.code });
        }
      },
    });
}

// No listener or game state here: production composes this app and Eden derives its types.
export function createApp() {
  const app = new Elysia({ websocket: { maxPayloadLength: 1024 } });
  return app.group('/api', (api) => api.use(createApi()));
}

export type App = ReturnType<typeof createApp>;
