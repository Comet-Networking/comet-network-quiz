import { treaty } from '@elysia/eden';

import type { App } from '../server/app';

// HTTP and WebSocket connections use the page's origin.
export const client = treaty<App>(window.location.origin).api;
