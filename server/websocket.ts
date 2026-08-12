import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { verifyToken } from './auth.js';
import { loadDB, saveDB } from './db.js';

interface ClientConnection {
  userId: string;
  ws: WebSocket;
  isAlive: boolean;
}

const clients = new Map<string, Set<WebSocket>>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    let authenticatedUserId: string | null = null;

    // Try token from query string ?token=...
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url || '', `http://${host}`);
    const token = url.searchParams.get('token');

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        authenticatedUserId = decoded.userId;
        registerClient(authenticatedUserId, ws);
      }
    }

    ws.on('message', (messageRaw: string) => {
      try {
        const data = JSON.parse(messageRaw.toString());

        if (data.type === 'auth') {
          const decoded = verifyToken(data.token);
          if (decoded) {
            authenticatedUserId = decoded.userId;
            registerClient(authenticatedUserId, ws);
            ws.send(JSON.stringify({ type: 'auth_success', userId: authenticatedUserId }));
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Token WebSocket inválido' }));
          }
          return;
        }

        if (!authenticatedUserId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Não autenticado no WebSocket' }));
          return;
        }

        if (data.type === 'typing') {
          const { recipientId, isTyping } = data;
          sendToUser(recipientId, {
            type: 'typing',
            senderId: authenticatedUserId,
            isTyping: !!isTyping,
          });
        }

        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {
        console.error('WS message error:', err);
      }
    });

    ws.on('close', () => {
      if (authenticatedUserId) {
        unregisterClient(authenticatedUserId, ws);
      }
    });

    ws.on('error', (err) => {
      console.error('WS connection error:', err);
    });
  });

  return wss;
}

function registerClient(userId: string, ws: WebSocket) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId)!.add(ws);

  // Update user online status in database
  const db = loadDB();
  const user = db.users.find((u) => u.id === userId);
  if (user) {
    user.status = 'online';
    user.lastSeen = new Date().toISOString();
    saveDB();
    broadcastPresence(userId, 'online');
  }
}

function unregisterClient(userId: string, ws: WebSocket) {
  const userSockets = clients.get(userId);
  if (userSockets) {
    userSockets.delete(ws);
    if (userSockets.size === 0) {
      clients.delete(userId);
      // Mark user offline in database
      const db = loadDB();
      const user = db.users.find((u) => u.id === userId);
      if (user) {
        user.status = 'offline';
        user.lastSeen = new Date().toISOString();
        saveDB();
        broadcastPresence(userId, 'offline');
      }
    }
  }
}

export function sendToUser(userId: string, payload: any) {
  const userSockets = clients.get(userId);
  if (userSockets && userSockets.size > 0) {
    const jsonStr = JSON.stringify(payload);
    userSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(jsonStr);
      }
    });
    return true;
  }
  return false;
}

export function broadcastPresence(userId: string, status: 'online' | 'offline') {
  const payload = {
    type: 'presence',
    userId,
    status,
    lastSeen: new Date().toISOString(),
  };

  const jsonStr = JSON.stringify(payload);

  clients.forEach((sockets, uid) => {
    if (uid !== userId) {
      sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(jsonStr);
        }
      });
    }
  });
}
