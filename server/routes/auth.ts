import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { loadDB, saveDB, DBUser } from '../db.js';
import { generateToken, requireAuth, sanitizeUser, AuthenticatedRequest } from '../auth.js';
import { loginLimiter, sanitizeText, contentSafetyCheck, isValidImageUrl } from '../security.js';

const router = Router();

// Register new user (No rate limit so user creation is seamless)
router.post('/register', (req, res) => {
  try {
    const { username, name, password, birthDate, gender, lookingFor, bio, location, occupation, avatar } = req.body;

    if (!username || !name || !password || !birthDate) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    if (!avatar || typeof avatar !== 'string' || !avatar.trim()) {
      return res.status(400).json({ error: 'A foto de perfil é obrigatória. Por favor, tire uma foto com a câmera ou envie um arquivo JPG/PNG.' });
    }

    if (!isValidImageUrl(avatar)) {
      return res.status(400).json({ error: 'Formato de imagem inválido. Envie apenas imagem nos formatos JPG ou PNG.' });
    }

    const cleanUsername = sanitizeText(username.trim().toLowerCase());
    const cleanName = sanitizeText(name.trim());

    const bioSafety = contentSafetyCheck(bio || '');
    if (!bioSafety.safe) {
      return res.status(400).json({ error: bioSafety.reason || 'Conteúdo da bio recusado por motivos de segurança.' });
    }

    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'O nome de usuário deve ter pelo menos 3 caracteres.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    // Age validation (14-17 years old only - prohibited 18+)
    const bDate = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - bDate.getFullYear();
    const monthDiff = today.getMonth() - bDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bDate.getDate())) {
      age--;
    }

    if (isNaN(age) || age < 14) {
      return res.status(400).json({ error: 'Mínimo de 14 anos para se cadastrar.' });
    }

    if (age > 17) {
      return res.status(400).json({ error: 'Proibido para maiores de 17 anos. Aplicativo exclusivo para adolescentes de 14 a 17 anos.' });
    }

    const db = loadDB();

    // Check duplicate username
    const existing = db.users.find((u) => u.username === cleanUsername);
    if (existing) {
      return res.status(409).json({ error: 'Nome de usuário já está em uso.' });
    }

    // Hash password with bcrypt
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    const defaultAvatar = avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop`;

    const newUser: DBUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      username: cleanUsername,
      name: cleanName,
      passwordHash,
      birthDate,
      age,
      bio: sanitizeText(bio || 'Olá! Estou no Ignite Match em busca de conexões autênticas.'),
      location: sanitizeText(location || 'São Paulo, SP'),
      gender: gender || 'woman',
      lookingFor: lookingFor || 'everyone',
      avatar: defaultAvatar,
      photos: [defaultAvatar],
      interests: ['Café', 'Cinema', 'Música', 'Viagens'],
      occupation: sanitizeText(occupation || ''),
      role: 'user',
      status: 'online',
      lastSeen: now,
      createdAt: now,
    };

    db.users.push(newUser);

    // Welcome notification
    db.notifications.push({
      id: `notif_${Date.now()}`,
      userId: newUser.id,
      type: 'system',
      title: 'Bem-vindo(a) ao Ignite Match! 🔥',
      content: 'Seu perfil foi criado. Complete suas fotos para aumentar suas chances de match!',
      read: false,
      createdAt: now,
    });

    saveDB();

    const token = generateToken(newUser);

    return res.status(201).json({
      user: sanitizeUser(newUser),
      token,
      message: 'Conta criada com sucesso!'
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Erro interno ao realizar cadastro.' });
  }
});

// Login
router.post('/login', loginLimiter, (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = loadDB();

    const user = db.users.find((u) => u.username === cleanUsername);

    if (!user) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Conta suspensa devido a violações das regras do sistema.' });
    }

    let match = bcrypt.compareSync(password, user.passwordHash);
    if (!match && (password === 'criancas' || password === 'crianças')) {
      match = bcrypt.compareSync('crianças', user.passwordHash);
    }

    if (!match) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    // Update status and lastSeen
    user.status = 'online';
    user.lastSeen = new Date().toISOString();
    saveDB();

    const token = generateToken(user);

    return res.json({
      user: sanitizeUser(user),
      token,
      message: 'Login realizado com sucesso!'
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erro interno no servidor ao realizar login.' });
  }
});

// Get current user session
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !req.user.fullUser) {
    return res.status(401).json({ error: 'Sessão inválida.' });
  }
  return res.json({ user: sanitizeUser(req.user.fullUser) });
});

// Logout
router.post('/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user && req.user.fullUser) {
    const db = loadDB();
    const user = db.users.find((u) => u.id === req.user!.userId);
    if (user) {
      user.status = 'offline';
      user.lastSeen = new Date().toISOString();
      saveDB();
    }
  }
  return res.json({ message: 'Logout efetuado com sucesso.' });
});

export default router;
