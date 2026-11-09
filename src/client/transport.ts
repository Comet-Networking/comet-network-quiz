import { treaty } from '@elysia/eden';

import type { App } from '../server/app';

// Vite proxies /api locally. On Render, HTTP and WS share this origin.
// Eden derives wss:// from an https:// origin. No deployment URL is baked in.
export function createTransport(origin = window.location.origin) {
  const api = treaty<App>(origin);
  return {
    health: () => api.api.health.get(),
    // The caller owns open/error/message handlers and must close on cleanup.
    connect: () => api.api.ws.subscribe(),
  };
}
