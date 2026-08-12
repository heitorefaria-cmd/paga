import { Router, Response } from 'express';
import { loadDB, saveDB, resetDB, DBAdminLog } from '../db.js';
import { requireAdmin, sanitizeUser, AuthenticatedRequest } from '../auth.js';
import { sanitizeText } from '../security.js';

const router = Router();

// Admin stats
router.get('/stats', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = loadDB();

    const totalUsers = db.users.filter((u) => u.status !== 'suspended').length;
    const onlineUsers = db.users.filter((u) => u.status === 'online').length;
    const totalMatches = db.matches.length;
    const totalMessages = db.messages.length;
    const totalReports = db.reports.length;
    const pendingReports = db.reports.filter((r) => r.status === 'pending').length;

    return res.json({
      stats: {
        totalUsers,
        onlineUsers,
        totalMatches,
        totalMessages,
        totalReports,
        pendingReports,
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao carregar estatísticas do admin.' });
  }
});

// Search & List Users
router.get('/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, role, status } = req.query;
    const db = loadDB();

    let list = db.users.map((u) => sanitizeUser(u));

    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
    }

    if (role) {
      list = list.filter((u) => u.role === role);
    }

    if (status) {
      list = list.filter((u) => u.status === status);
    }

    return res.json({ users: list });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// Update user status (Suspend / Activate)
router.put('/users/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.user!.userId;
    const adminUsername = req.user!.username;
    const targetUserId = req.params.id;
    const { status } = req.body; // 'online' | 'offline' | 'suspended'

    if (!['online', 'offline', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    const db = loadDB();
    const user = db.users.find((u) => u.id === targetUserId);

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const prevStatus = user.status;
    user.status = status;

    // Log admin action
    const log: DBAdminLog = {
      id: `log_${Date.now()}`,
      adminId,
      adminUsername,
      action: status === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
      target: `User @${user.username} (${user.id})`,
      details: `Status alterado de '${prevStatus}' para '${status}'.`,
      createdAt: new Date().toISOString(),
    };

    db.adminLogs.push(log);
    saveDB();

    return res.json({ user: sanitizeUser(user), message: `Status do usuário atualizado para ${status}.` });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao alterar status do usuário.' });
  }
});

// Update user role
router.put('/users/:id/role', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.user!.userId;
    const adminUsername = req.user!.username;
    const targetUserId = req.params.id;
    const { role } = req.body; // 'user' | 'admin'

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Função inválida.' });
    }

    const db = loadDB();
    const user = db.users.find((u) => u.id === targetUserId);

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    user.role = role;

    const log: DBAdminLog = {
      id: `log_${Date.now()}`,
      adminId,
      adminUsername,
      action: 'CHANGE_USER_ROLE',
      target: `User @${user.username} (${user.id})`,
      details: `Função alterada para '${role}'.`,
      createdAt: new Date().toISOString(),
    };

    db.adminLogs.push(log);
    saveDB();

    return res.json({ user: sanitizeUser(user), message: `Função do usuário alterada para ${role}.` });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao alterar permissão do usuário.' });
  }
});

// View all reports
router.get('/reports', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = loadDB();

    const reportsDetailed = db.reports.map((r) => {
      const reporter = db.users.find((u) => u.id === r.reporterId);
      const reported = db.users.find((u) => u.id === r.reportedUserId);

      return {
        ...r,
        reporterName: reporter ? `${reporter.name} (@${reporter.username})` : r.reporterId,
        reportedName: reported ? `${reported.name} (@${reported.username})` : r.reportedUserId,
      };
    });

    return res.json({ reports: reportsDetailed });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao carregar denúncias.' });
  }
});

// Update report status
router.put('/reports/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.user!.userId;
    const adminUsername = req.user!.username;
    const reportId = req.params.id;
    const { status, actionTarget } = req.body; // 'reviewed' | 'actioned' | 'dismissed'

    const db = loadDB();
    const report = db.reports.find((r) => r.id === reportId);

    if (!report) return res.status(404).json({ error: 'Denúncia não encontrada.' });

    report.status = status;

    if (actionTarget === 'suspend_user') {
      const targetUser = db.users.find((u) => u.id === report.reportedUserId);
      if (targetUser) {
        targetUser.status = 'suspended';
      }
    }

    const log: DBAdminLog = {
      id: `log_${Date.now()}`,
      adminId,
      adminUsername,
      action: 'RESOLVE_REPORT',
      target: `Report ID ${reportId}`,
      details: `Denúncia marcada como '${status}'. Ação tomada: ${actionTarget || 'Nenhuma'}.`,
      createdAt: new Date().toISOString(),
    };

    db.adminLogs.push(log);
    saveDB();

    return res.json({ report, message: 'Denúncia atualizada com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar denúncia.' });
  }
});

// Get admin logs
router.get('/logs', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = loadDB();

    const logs = db.adminLogs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao obter logs de auditoria.' });
  }
});

// Admin: Get all user conversations and message histories
router.get('/conversations', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = loadDB();

    const result = db.conversations.map((conv) => {
      const participants = conv.participantIds.map((pId) => {
        const u = db.users.find((user) => user.id === pId);
        return u ? sanitizeUser(u) : { id: pId, name: 'Usuário Removido', username: 'desconhecido' };
      });

      const messages = db.messages
        .filter((m) => m.conversationId === conv.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      return {
        id: conv.id,
        createdAt: conv.createdAt,
        participants,
        messages,
        totalMessages: messages.length,
        lastMessage: messages[messages.length - 1] || null,
      };
    });

    return res.json({ conversations: result });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao obter conversas no painel admin.' });
  }
});

// Admin: Reset database to clean state
router.post('/reset-db', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const freshDb = resetDB();
    return res.json({ message: 'Banco de dados redefinido com sucesso! Apenas a conta admin permanece.', usersCount: freshDb.users.length });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao redefinir banco de dados.' });
  }
});

export default router;
