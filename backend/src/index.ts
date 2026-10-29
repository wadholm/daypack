import { Hono } from 'hono';
import { getItems, parseLang } from './items';

// Only /api/* reaches the Worker (wrangler run_worker_first); static assets are served by the platform.
const app = new Hono().basePath('/api');

app.get('/items', (c) => c.json({ items: getItems(parseLang(c.req.query('lang'))) }));

export default app;
