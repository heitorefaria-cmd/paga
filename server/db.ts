import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface DBUser {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  birthDate: string;
  age: number;
  bio: string;
  location: string;
  gender: 'man' | 'woman' | 'nonbinary';
  lookingFor: 'man' | 'woman' | 'everyone';
  avatar: string;
  photos: string[];
  interests: string[];
  occupation?: string;
  role: 'user' | 'admin';
  status: 'online' | 'offline' | 'suspended';
  lastSeen: string;
  createdAt: string;
}

export interface DBLike {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: 'like' | 'pass' | 'superlike';
  createdAt: string;
}

export interface DBMatch {
  id: string;
  userA: string;
  userB: string;
  createdAt: string;
}

export interface DBConversation {
  id: string;
  participantIds: string[];
  createdAt: string;
}

export interface DBMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

export interface DBNotification {
  id: string;
  userId: string;
  type: 'match' | 'message' | 'like' | 'system';
  title: string;
  content: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface DBReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  createdAt: string;
}

export interface DBBlock {
  id: string;
  blockerId: string;
  blockedUserId: string;
  createdAt: string;
}

export interface DBAdminLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  target: string;
  details?: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: DBUser[];
  likes: DBLike[];
  matches: DBMatch[];
  conversations: DBConversation[];
  messages: DBMessage[];
  notifications: DBNotification[];
  reports: DBReport[];
  blocks: DBBlock[];
  adminLogs: DBAdminLog[];
}

let dbMemory: DatabaseSchema | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function calculateAge(birthDateStr: string): number {
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(12, age);
}

function getSeedData(): DatabaseSchema {
  const now = new Date().toISOString();
  const adminPasswordHash = bcrypt.hashSync('crianças', 10);

  const seedUsers: DBUser[] = [
    {
      id: 'usr_admin',
      username: 'segredo',
      name: 'IGNITE TEEN',
      passwordHash: adminPasswordHash,
      birthDate: '2014-01-01',
      age: calculateAge('2014-01-01'),
      bio: 'Conta oficial de administração e suporte IGNITE TEEN.',
      location: 'São Paulo, SP',
      gender: 'man',
      lookingFor: 'everyone',
      avatar: 'https://www.malwarebytes.com/wp-content/uploads/sites/2/2025/03/Profile-Cloning.jpg?w=1024',
      photos: [
        'https://www.malwarebytes.com/wp-content/uploads/sites/2/2025/03/Profile-Cloning.jpg?w=1024'
      ],
      interests: ['Segurança', 'Tecnologia', 'Design'],
      occupation: 'Gerente da Plataforma',
      role: 'admin',
      status: 'online',
      lastSeen: now,
      createdAt: now,
    }
  ];

  return {
    users: seedUsers,
    likes: [],
    matches: [],
    conversations: [],
    messages: [],
    notifications: [],
    reports: [],
    blocks: [],
    adminLogs: [
      {
        id: 'log_seed',
        adminId: 'usr_admin',
        adminUsername: 'segredo',
        action: 'INITIALIZE_SYSTEM',
        target: 'System Database',
        details: 'Banco de dados reinicializado limpo. Apenas conta administradora ativa.',
        createdAt: now,
      }
    ]
  };
}

export function loadDB(): DatabaseSchema {
  if (dbMemory) return dbMemory;
  try {
    ensureDataDir();
  } catch (e) {
    // ignore dir creation error
  }

  if (!fs.existsSync(DB_FILE)) {
    const seed = getSeedData();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not write database file, running in-memory mode:', e);
    }
    dbMemory = seed;
    return dbMemory;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    if (!raw || !raw.trim()) {
      const seed = getSeedData();
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
      } catch (e) {
        console.warn('Could not write database file:', e);
      }
      dbMemory = seed;
      return dbMemory;
    }
    dbMemory = JSON.parse(raw);
    if (!dbMemory) throw new Error('DB parse error');

    // Clean up old fake profiles if present
    const fakeIds = ['usr_sofia', 'usr_asaph', 'usr_beatriz', 'usr_lucas', 'usr_camila'];
    dbMemory.users = dbMemory.users.filter((u) => !fakeIds.includes(u.id));

    // Ensure admin user exists, is active (online) and has correct password/credentials
    let adminUser = dbMemory.users.find((u) => u.id === 'usr_admin' || u.role === 'admin');
    if (adminUser) {
      adminUser.username = 'segredo';
      adminUser.name = 'IGNITE TEEN';
      adminUser.avatar = 'https://www.malwarebytes.com/wp-content/uploads/sites/2/2025/03/Profile-Cloning.jpg?w=1024';
      adminUser.photos = ['https://www.malwarebytes.com/wp-content/uploads/sites/2/2025/03/Profile-Cloning.jpg?w=1024'];
      adminUser.birthDate = '2014-01-01';
      adminUser.age = calculateAge('2014-01-01');
      adminUser.passwordHash = bcrypt.hashSync('crianças', 10);
      adminUser.role = 'admin';
      adminUser.status = 'online'; // Unsuspend admin
      saveDB();
    } else {
      const seed = getSeedData();
      dbMemory = seed;
      saveDB();
    }

    return dbMemory;
  } catch (err) {
    console.error('Failed to read database file, generating new seed:', err);
    const seed = getSeedData();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not write database file:', e);
    }
    dbMemory = seed;
    return dbMemory;
  }
}

export function saveDB(): void {
  if (!dbMemory) return;
  try {
    ensureDataDir();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dbMemory, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

export function resetDB(): DatabaseSchema {
  try {
    ensureDataDir();
  } catch (e) {}
  const seed = getSeedData();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
  } catch (e) {}
  dbMemory = seed;
  return dbMemory;
}
