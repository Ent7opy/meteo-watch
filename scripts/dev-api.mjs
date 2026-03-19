/**
 * Minimal local API server for development.
 * Serves the same handler as the Vercel function at /api/warnings.
 * Run: node scripts/dev-api.mjs
 * Then start Vite separately with: npx vite --port 5174
 * Or use `npm run dev:local` to start both together.
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import handler from '../api/warnings.js';

const API_PORT  = 3001;
const VITE_PORT = 5174;

// Minimal req/res shim so the Vercel handler works with plain Node http
function createRes(nodeRes) {
  nodeRes.setHeader = nodeRes.setHeader.bind(nodeRes);
  nodeRes.status = (code) => { nodeRes.statusCode = code; return nodeRes; };
  nodeRes.json   = (body)  => { nodeRes.setHeader('Content-Type', 'application/json'); nodeRes.end(JSON.stringify(body)); };
  nodeRes.end    = nodeRes.end.bind(nodeRes);
  return nodeRes;
}

const server = createServer(async (req, res) => {
  if (req.url === '/api/warnings' || req.url === '/api/warnings/') {
    try {
      await handler(req, createRes(res));
    } catch (err) {
      console.error('[dev-api] handler error:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  } else {
    res.statusCode = 404;
    res.end();
  }
});

server.listen(API_PORT, () => {
  console.log(`\n[dev-api] API server → http://localhost:${API_PORT}/api/warnings`);

  const vite = spawn('npx', ['vite', '--port', String(VITE_PORT)], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  });

  vite.on('close', () => {
    server.close();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    vite.kill();
    server.close();
    process.exit(0);
  });
});
