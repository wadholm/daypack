import { Hono } from 'hono';
import type { AppEnv } from './auth';
import { household } from './routes/household';
import { sync } from './routes/sync';

// Only /api/* reaches the Worker (wrangler run_worker_first); static assets are served by the platform.
const app = new Hono<AppEnv>().basePath('/api');

app.route('/', household);
app.route('/', sync);

// Unmatched /api paths must not fall through to the SPA's HTML.
app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default app;
