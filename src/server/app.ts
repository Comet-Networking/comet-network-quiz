import { Elysia } from 'elysia';

import {
  clientMessageSchema,
  healthSchema,
  serverMessageSchema,
} from '../shared/protocol';

// No listener or game state here: this factory is usable in tests and Eden types.
export function createApp() {
  return new Elysia({ websocket: { maxPayloadLength: 1024 } })
    .get('/api/health', () => ({ status: 'ok' as const }), {
      response: healthSchema,
    })
    .ws('/api/ws', {
      body: clientMessageSchema,
      response: serverMessageSchema,
      message(socket, message) {
        socket.send({ type: 'pong', requestId: message.requestId });
      },
    });
}

export type App = ReturnType<typeof createApp>;
