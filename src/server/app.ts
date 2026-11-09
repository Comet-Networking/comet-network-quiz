import { Elysia, t } from 'elysia';

// No listener or game state here: this factory is usable in tests and Eden types.
export function createApp() {
  return new Elysia({ websocket: { maxPayloadLength: 1024 } })
    .get('/api/health', () => ({ status: 'ok' as const }))
    .ws('/api/ws', {
      // Application JSON, separate from WebSocket control-frame ping/pong.
      // Expand these public schemas before adding handlers; never send answer keys.
      body: t.Object(
        {
          type: t.Literal('ping'),
          requestId: t.String({ minLength: 1, maxLength: 64 }),
        },
        { additionalProperties: false },
      ),
      response: t.Object(
        {
          type: t.Literal('pong'),
          requestId: t.String({ minLength: 1, maxLength: 64 }),
        },
        { additionalProperties: false },
      ),
      message(socket, message) {
        socket.send({ type: 'pong', requestId: message.requestId });
      },
    });
}

export type App = ReturnType<typeof createApp>;
