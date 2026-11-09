import { staticPlugin } from '@elysia/static';
import { file } from 'elysia';
import { resolve } from 'node:path';

import { createApp } from './app';

// Serve only compiled UI assets. Never expose the repo or quizzes directory.
export async function createProductionApp() {
  const assets = resolve(import.meta.dir, '../../dist/client');
  if (!(await Bun.file(resolve(assets, 'index.html')).exists())) {
    throw new Error('Missing built UI. Run bun run build before bun start.');
  }

  const app = createApp().use(
    staticPlugin({ assets, prefix: '/', indexHTML: false, alwaysStatic: true }),
  );

  // Explicit SPA entry routes keep unknown APIs/assets at 404 and leave WS alone.
  for (const path of ['/', '/host', '/play']) {
    app.get(path, () => file(resolve(assets, 'index.html')));
  }
  return app;
}
