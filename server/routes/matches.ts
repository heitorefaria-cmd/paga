import { Router, Response } from 'express';
import { loadDB, saveDB, DBLike, DBMatch, DBConversation, DBNotification } from '../db.js';
import { requireAuth, sanitizeUser, AuthenticatedRequest } from '../auth.js';
import { sendToUser } from '../websocket.js';

const router = Router();

// Swipe action (like / pass / superlike)
router.post('/swipe', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const fromUserId = req.user!.userId;
    const { targetUserId, action } = req.body; // action: 'like' | 'pass' | 'superlike'

    if (!targetUserId || !['like', 'pass', 'superlike'].includes(action)) {
      return res.status(400).json({ error: 'Ação ou usuário destino inválido.' });
    }

    if (fromUserId === targetUserId) {
      return res.status(400).json({ error: 'Não é possível curtir a si mesmo.' });
    }

    const db = loadDB();

    const targetUser = db.users.find((u) => u.id === targetUserId);
    if (!targetUser || targetUser.status === 'suspended') {
      return res.status(404).json({ error: 'Usuário alvo não encontrado.' });
    }

    const currentUser = db.users.find((u) => u.id === fromUserId);
    if (!currentUser) return res.status(404).json({ error: 'Usuário atual não encontrado.' });

    // Check duplicate like
    const existingLike = db.likes.find((l) => l.fromUserId === fromUserId && l.toUserId === targetUserId);
    if (existingLike) {
      return res.status(400).json({ error: 'Você já interagiu com este perfil anteriormente.' });
    }

    const now = new Date().toISOString();

    const newLike: DBLike = {
      id: `like_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      fromUserId,
      toUserId: targetUserId,
      type: action as 'like' | 'pass' | 'superlike',
      createdAt: now,
    };

    db.likes.push(newLike);

    if (action === 'pass') {
      saveDB();
      return res.json({ isMatch: false, message: 'Perfil passado.' });
    }

    // Check if targetUser liked currentUser back
    const reciprocalLike = db.likes.find(
      (l) => l.fromUserId === targetUserId && l.toUserId === fromUserId && (l.type === 'like' || l.type === 'superlike')
    );

    if (reciprocalLike) {
      // Check duplicate match
      let match = db.matches.find(
        (m) => (m.userA === fromUserId && m.userB === targetUserId) || (m.userA === targetUserId && m.userB === fromUserId)
      );

      if (!match) {
        match = {
          id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          userA: fromUserId,
          userB: targetUserId,
          createdAt: now,
        };
        db.matches.push(match);

        // Create initial conversation record
        let conversation = db.conversations.find((c) =>
          c.participantIds.includes(fromUserId) && c.participantIds.includes(targetUserId)
        );

        if (!conversation) {
          conversation = {
            id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            participantIds: [fromUserId, targetUserId],
            createdAt: now,
          };
          db.conversations.push(conversation);
        }

        // Create Notifications for both users
        const notifA: DBNotification = {
          id: `notif_${Date.now()}_a`,
          userId: fromUserId,
          type: 'match',
          title: '❤️ DEU MATCH!',
          content: `Você deu match com ${targetUser.name}! Inicie uma conversa agora.`,
          read: false,
          link: `/chat/${conversation.id}`,
          createdAt: now,
        };

        const notifB: DBNotification = {
          id: `notif_${Date.now()}_b`,
          userId: targetUserId,
          type: 'match',
          title: '❤️ DEU MATCH!',
          content: `Você deu match com ${currentUser.name}! Inicie uma conversa agora.`,
          read: false,
          link: `/chat/${conversation.id}`,
          createdAt: now,
        };

        db.notifications.push(notifA, notifB);

        // Real-time WebSocket event dispatch
        sendToUser(targetUserId, {
          type: 'match',
          matchId: match.id,
          conversationId: conversation.id,
          matchedUser: sanitizeUser(currentUser),
        });

        sendToUser(fromUserId, {
          type: 'match',
          matchId: match.id,
          conversationId: conversation.id,
          matchedUser: sanitizeUser(targetUser),
        });
      }

      saveDB();

      return res.json({
        isMatch: true,
        match,
        matchedUser: sanitizeUser(targetUser),
        message: 'Parabéns! Deu Match! 🎉'
      });
    }

    saveDB();
    return res.json({ isMatch: false, message: 'Curtida registrada com sucesso!' });
  } catch (err) {
    console.error('Swipe error:', err);
    return res.status(500).json({ error: 'Erro ao processar curtida/passagem.' });
  }
});

// Get user matches list
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const db = loadDB();

    const userMatches = db.matches.filter(
      (m) => m.userA === currentUserId || m.userB === currentUserId
    );

    const matchesFormatted = userMatches.map((m) => {
      const otherUserId = m.userA === currentUserId ? m.userB : m.userA;
      const otherUser = db.users.find((u) => u.id === otherUserId);

      // Find conversation and last message
      const conv = db.conversations.find((c) =>
        c.participantIds.includes(currentUserId) && c.participantIds.includes(otherUserId)
      );

      let lastMessage = null;
      let unreadCount = 0;

      if (conv) {
        const convMessages = db.messages
          .filter((msg) => msg.conversationId === conv.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (convMessages.length > 0) {
          lastMessage = convMessages[0];
        }

        unreadCount = db.messages.filter(
          (msg) => msg.conversationId === conv.id && msg.recipientId === currentUserId && !msg.readAt
        ).length;
      }

      return {
        id: m.id,
        createdAt: m.createdAt,
        otherUser: otherUser ? sanitizeUser(otherUser) : null,
        conversationId: conv?.id,
        lastMessage,
        unreadCount,
      };
    }).filter((m) => m.otherUser !== null);

    return res.json({ matches: matchesFormatted });
  } catch (err) {
    console.error('Get matches error:', err);
    return res.status(500).json({ error: 'Erro ao listar matches.' });
  }
});

// Unmatch user
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const matchId = req.params.id;

    const db = loadDB();
    const matchIndex = db.matches.findIndex(
      (m) => m.id === matchId && (m.userA === currentUserId || m.userB === currentUserId)
    );

    if (matchIndex === -1) {
      return res.status(404).json({ error: 'Match não encontrado ou permissão negada.' });
    }

    db.matches.splice(matchIndex, 1);
    saveDB();

    return res.json({ message: 'Match desfeito com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao desfazer match.' });
  }
});

export default router;
