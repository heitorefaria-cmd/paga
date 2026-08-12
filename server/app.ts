import express from 'express';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import matchRoutes from './routes/matches.js';
import chatRoutes from './routes/chat.js';
import reportRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';
import securityRoutes from './routes/security-audit.js';
import { loadDB } from './db.js';
import { botProtectionMiddleware, securityHeadersMiddleware, apiLimiter } from './security.js';

const app = express();

// Pre-load persistent database into memory
loadDB();

// Express JSON Body Parser (supports photo base64 strings up to 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS Middleware for Cross-Domain Requests
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
  res.json({ status: 'ok', app: 'IGNITE TEEN', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', reportRoutes);
app.use('/api/admin', botProtectionMiddleware, adminRoutes);
app.use('/api/security/audit', securityRoutes);

export default app;
