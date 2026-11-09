import { describe, expect, test } from 'bun:test';
import { TypeCompiler } from '@sinclair/typebox/compiler';

import {
  clientMessageSchema,
  serverMessageSchema,
} from '../src/shared/protocol';

describe('transport protocol boundary', () => {
  const client = TypeCompiler.Compile(clientMessageSchema);
  const server = TypeCompiler.Compile(serverMessageSchema);

  test('accepts only the directional ping/pong contract', () => {
    expect(client.Check({ type: 'ping', requestId: 'probe-1' })).toBe(true);
    expect(server.Check({ type: 'pong', requestId: 'probe-1' })).toBe(true);
    expect(client.Check({ type: 'pong', requestId: 'probe-1' })).toBe(false);
    expect(server.Check({ type: 'ping', requestId: 'probe-1' })).toBe(false);
  });

  test('rejects missing, oversized, and extra fields', () => {
    for (const invalid of [
      null,
      'ping',
      { type: 'ping' },
      { type: 'ping', requestId: '' },
      { type: 'ping', requestId: 'x'.repeat(65) },
      { type: 'ping', requestId: 'probe-1', answer: 0 },
    ]) {
      expect(client.Check(invalid)).toBe(false);
    }
  });
});
