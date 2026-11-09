import { createApp } from './app';
import { parsePort } from './config';
import { createProductionApp } from './production';

const production = process.env.NODE_ENV === 'production';
const app = production ? await createProductionApp() : createApp();
app.listen({ hostname: '0.0.0.0', port: parsePort(process.env['PORT']) });
console.info(
  `Comet quiz ${production ? 'production' : 'development'} server ready`,
);
