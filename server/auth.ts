import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { loadDB, DBUser } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ignite_super_secret_jwt_key_2026_change_in_production';

export interface JwtPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { fullUser?: DBUser };
}

export function generateToken(user: DBUser): string {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Não autorizado. Token não fornecido.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }

  const db = loadDB();
  const user = db.users.find((u) => u.id === decoded.userId);

  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Conta suspensa/bloqueada por violação das diretrizes.' });
  }

  req.user = {
    ...decoded,
    fullUser: user,
  };

  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Requer privilégios administrativos.' });
    }
    next();
  });
}

export function sanitizeUser(user: DBUser): Omit<DBUser, 'passwordHash'> {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}
