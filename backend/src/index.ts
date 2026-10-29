import { Hono } from 'hono';

// Only /api/* reaches the Worker (wrangler run_worker_first); static assets are served by the platform.
// No routes yet: items live in the client until the shared store lands (MVP slice 4).
const app = new Hono().basePath('/api');

// Unmatched /api paths must not fall through to the SPA's HTML.
app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default app;
