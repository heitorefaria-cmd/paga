import express from 'express';
import path from 'path';
import { createServer as createHttpServer } from 'http';
import { createServer as createViteServer } from 'vite';
import app from './server/app.js';
import { setupWebSocket } from './server/websocket.js';

async function startServer() {
  const server = createHttpServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Setup WebSocket Server for Real-Time Chat & Presence
  setupWebSocket(server);

  // Vite Integration (Middleware Mode in Dev, Static Dist in Prod)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 IGNITE TEEN Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
