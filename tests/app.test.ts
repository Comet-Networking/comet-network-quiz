import { treaty } from '@elysia/eden';
import { describe, expect, test } from 'bun:test';

import { createApp } from '../src/server/app';
import { parsePort } from '../src/server/config';

describe('HTTP boundary', () => {
  test('health is schema-validated and available through Eden', async () => {
    const app = createApp();
    const response = await app.handle(
      new Request('http://localhost/api/health'),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });

    const { data, error } = await treaty(app).api.health.get();
    expect(error).toBeNull();
    expect(data).toEqual({ status: 'ok' });
  });

  test('unknown API endpoints stay 404', async () => {
    const response = await createApp().handle(
      new Request('http://localhost/api/missing'),
    );
    expect(response.status).toBe(404);
  });
});

test('PORT accepts valid ports and rejects malformed deployment configuration', () => {
  expect(parsePort(undefined)).toBe(3000);
  expect(parsePort('10000')).toBe(10000);
  for (const value of ['', '0', '65536', '3.5', '3000oops', '-1', ' 3000']) {
    expect(() => parsePort(value)).toThrow('PORT must be an integer');
  }
});
