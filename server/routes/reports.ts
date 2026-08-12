import { Router, Response } from 'express';
import { loadDB, saveDB, DBReport, DBBlock } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';
import { sanitizeText } from '../security.js';

const router = Router();

// Submit report against user
router.post('/report', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const reporterId = req.user!.userId;
    const { reportedUserId, reason, details } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ error: 'ID do usuário denunciado e motivo são obrigatórios.' });
    }

    if (reporterId === reportedUserId) {
      return res.status(400).json({ error: 'Você não pode denunciar o seu próprio perfil.' });
    }

    const db = loadDB();
    const reportedUser = db.users.find((u) => u.id === reportedUserId);

    if (!reportedUser) {
      return res.status(404).json({ error: 'Usuário denunciado não encontrado.' });
    }

    const now = new Date().toISOString();

    const newReport: DBReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      reporterId,
      reportedUserId,
      reason: sanitizeText(reason),
      details: sanitizeText(details || ''),
      status: 'pending',
      createdAt: now,
    };

    db.reports.push(newReport);
    saveDB();

    return res.status(201).json({ message: 'Denúncia recebida com sucesso. Nossa equipe de moderação irá analisar o caso.' });
  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({ error: 'Erro ao enviar denúncia.' });
  }
});

// Block user
router.post('/block', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const blockerId = req.user!.userId;
    const { blockedUserId } = req.body;

    if (!blockedUserId) {
      return res.status(400).json({ error: 'ID do usuário a bloquear é obrigatório.' });
    }

    if (blockerId === blockedUserId) {
      return res.status(400).json({ error: 'Você não pode bloquear a si mesmo.' });
    }

    const db = loadDB();

    // Check duplicate block
    const existingBlock = db.blocks.find((b) => b.blockerId === blockerId && b.blockedUserId === blockedUserId);
    if (existingBlock) {
      return res.status(400).json({ error: 'Este usuário já está bloqueado.' });
    }

    const now = new Date().toISOString();

    const newBlock: DBBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      blockerId,
      blockedUserId,
      createdAt: now,
    };

    db.blocks.push(newBlock);

    // Remove any active match between them
    db.matches = db.matches.filter(
      (m) => !( (m.userA === blockerId && m.userB === blockedUserId) || (m.userA === blockedUserId && m.userB === blockerId) )
    );

    saveDB();

    return res.json({ message: 'Usuário bloqueado com sucesso. Ele não poderá mais ver seu perfil ou enviar mensagens.' });
  } catch (err) {
    console.error('Block error:', err);
    return res.status(500).json({ error: 'Erro ao bloquear usuário.' });
  }
});

// List blocked users
router.get('/blocks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const db = loadDB();

    const blockedList = db.blocks
      .filter((b) => b.blockerId === currentUserId)
      .map((b) => {
        const u = db.users.find((usr) => usr.id === b.blockedUserId);
        return {
          id: b.id,
          blockedUserId: b.blockedUserId,
          name: u ? u.name : 'Usuário',
          username: u ? u.username : '',
          avatar: u ? u.avatar : '',
          createdAt: b.createdAt,
        };
      });

    return res.json({ blocks: blockedList });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar bloqueios.' });
  }
});

export default router;
