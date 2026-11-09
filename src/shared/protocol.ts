import { t } from 'elysia';

// Application messages, distinct from WebSocket control-frame ping/pong.
// Expand these schemas before adding handlers; do not send answer keys.
export const clientMessageSchema = t.Object(
  {
    type: t.Literal('ping'),
    requestId: t.String({ minLength: 1, maxLength: 64 }),
  },
  { additionalProperties: false },
);

export const serverMessageSchema = t.Object(
  {
    type: t.Literal('pong'),
    requestId: t.String({ minLength: 1, maxLength: 64 }),
  },
  { additionalProperties: false },
);

export type ClientMessage = typeof clientMessageSchema.static;
export type ServerMessage = typeof serverMessageSchema.static;

export const healthSchema = t.Object({ status: t.Literal('ok') });
