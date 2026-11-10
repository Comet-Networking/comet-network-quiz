import { staticPlugin } from '@elysia/static';
import { file } from 'elysia';
import { resolve } from 'node:path';

import { createApp } from './app';

// Serve only compiled UI assets. Never expose the repo or quizzes directory.
export async function createProductionApp(
  assets = resolve(import.meta.dir, '../../dist/client'),
) {
  const indexPath = resolve(assets, 'index.html');
  if (!(await Bun.file(indexPath).exists())) {
    throw new Error('Missing built UI. Run bun run build before bun start.');
  }

  const app = createApp().use(
    await staticPlugin({
      assets,
      prefix: '/',
      indexHTML: false,
      alwaysStatic: true,
    }),
  );

  // Registered API/asset routes take priority. Bun also uses GET handlers for HEAD.
  app.get('/*', ({ path, request, set, status }) => {
    const namespace = path.split('/')[1];
    // Dots (including encoded dots) reserve file-like URLs for real assets.
    if (
      namespace === 'api' ||
      namespace === 'assets' ||
      /\.|%2e/i.test(path) ||
      request.headers.has('upgrade')
    ) {
      return status(404);
    }
    set.headers['cache-control'] = 'no-cache';
    return file(indexPath);
  });
  return app;
}
