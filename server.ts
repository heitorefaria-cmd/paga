import express from 'express';
import path from 'path';
import { createServer as createHttpServer } from 'http';
import { createServer as createViteServer } from 'vite';
import { setupWebSocket } from './server/websocket.js';
import authRoutes from './server/routes/auth.js';
import userRoutes from './server/routes/users.js';
import matchRoutes from './server/routes/matches.js';
import chatRoutes from './server/routes/chat.js';
import reportRoutes from './server/routes/reports.js';
import adminRoutes from './server/routes/admin.js';
import securityRoutes from './server/routes/security-audit.js';
import { loadDB } from './server/db.js';
import { botProtectionMiddleware, securityHeadersMiddleware, apiLimiter } from './server/security.js';

async function startServer() {
  const app = express();
  const server = createHttpServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Pre-load persistent database into memory
  loadDB();

  // Express JSON Body Parser (supports photo base64 strings up to 10MB)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS Middleware for Cross-Domain Requests (e.g., Netlify -> Railway)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Apply Security HTTP Headers Globally
  app.use(securityHeadersMiddleware);

  // Apply Rate Limiter to API routes
  app.use('/api', apiLimiter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'Ignite Match', version: '1.0.0', timestamp: new Date().toISOString() });
  });

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api', reportRoutes);
  app.use('/api/admin', botProtectionMiddleware, adminRoutes);
  app.use('/api/security/audit', securityRoutes);

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
    console.log(`🔥 Ignite Match Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
