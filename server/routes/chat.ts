import { Router, Response } from 'express';
import { loadDB, saveDB, DBMessage, DBConversation, DBNotification } from '../db.js';
import { requireAuth, sanitizeUser, AuthenticatedRequest } from '../auth.js';
import { sanitizeText, apiLimiter, contentSafetyCheck } from '../security.js';
import { sendToUser } from '../websocket.js';

const router = Router();

// Get list of all conversations for current user
router.get('/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const db = loadDB();

    const userConvs = db.conversations.filter((c) => c.participantIds.includes(currentUserId));

    const result = userConvs.map((conv) => {
      const otherUserId = conv.participantIds.find((id) => id !== currentUserId) || currentUserId;
      const otherUser = db.users.find((u) => u.id === otherUserId);

      const msgs = db.messages
        .filter((m) => m.conversationId === conv.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const lastMsg = msgs.length > 0 ? msgs[0] : null;

      const unreadCount = db.messages.filter(
        (m) => m.conversationId === conv.id && m.recipientId === currentUserId && !m.readAt
      ).length;

      return {
        id: conv.id,
        createdAt: conv.createdAt,
        otherUser: otherUser ? sanitizeUser(otherUser) : null,
        lastMessage: lastMsg,
        unreadCount,
      };
    }).filter((item) => item.otherUser !== null);

    return res.json({ conversations: result });
  } catch (err) {
    console.error('Get conversations error:', err);
    return res.status(500).json({ error: 'Erro ao carregar lista de conversas.' });
  }
});

// Get messages history for a conversation (BOLA/IDOR Protected)
router.get('/conversations/:id/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const conversationId = req.params.id;

    const db = loadDB();
    const conv = db.conversations.find((c) => c.id === conversationId);

    if (!conv) {
      return res.status(404).json({ error: 'Conversa não encontrada.' });
    }

    // IDOR check: caller MUST be a participant in the conversation
    if (!conv.participantIds.includes(currentUserId)) {
      return res.status(403).json({ error: 'Acesso negado. Você não é participante desta conversa.' });
    }

    const messages = db.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Mark unread messages received by current user as read
    let updated = false;
    const now = new Date().toISOString();

    db.messages.forEach((m) => {
      if (m.conversationId === conversationId && m.recipientId === currentUserId && !m.readAt) {
        m.readAt = now;
        updated = true;
      }
    });

    if (updated) saveDB();

    return res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    return res.status(500).json({ error: 'Erro ao obter mensagens.' });
  }
});

// Send message to match
router.post('/messages', requireAuth, apiLimiter, (req: AuthenticatedRequest, res: Response) => {
  try {
    const senderId = req.user!.userId;
    const { conversationId, recipientId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'O conteúdo da mensagem não pode ser vazio.' });
    }

    const safety = contentSafetyCheck(content);
    if (!safety.safe) {
      return res.status(400).json({ error: safety.reason || 'Mensagem bloqueada por motivos de segurança.' });
    }

    const cleanContent = sanitizeText(content.trim());
    const db = loadDB();

    let conv = db.conversations.find((c) => c.id === conversationId);

    if (!conv && recipientId) {
      // Find or create conversation with recipientId
      conv = db.conversations.find(
        (c) => c.participantIds.includes(senderId) && c.participantIds.includes(recipientId)
      );

      if (!conv) {
        // Verify match exists first before allowing chat
        const hasMatch = db.matches.some(
          (m) => (m.userA === senderId && m.userB === recipientId) || (m.userA === recipientId && m.userB === senderId)
        );

        if (!hasMatch) {
          return res.status(403).json({ error: 'Você só pode enviar mensagens para usuários com os quais possui Match.' });
        }

        conv = {
          id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          participantIds: [senderId, recipientId],
          createdAt: new Date().toISOString(),
        };
        db.conversations.push(conv);
      }
    }

    if (!conv) {
      return res.status(404).json({ error: 'Conversa não encontrada.' });
    }

    // Verify sender belongs to conversation
    if (!conv.participantIds.includes(senderId)) {
      return res.status(403).json({ error: 'Acesso negado nesta conversa.' });
    }

    const targetRecipientId = recipientId || conv.participantIds.find((id) => id !== senderId);

    if (!targetRecipientId) {
      return res.status(400).json({ error: 'Destinatário não identificado.' });
    }

    const now = new Date().toISOString();

    const newMessage: DBMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      conversationId: conv.id,
      senderId,
      recipientId: targetRecipientId,
      content: cleanContent,
      createdAt: now,
      readAt: null,
    };

    db.messages.push(newMessage);

    // Notification for recipient
    const senderUser = db.users.find((u) => u.id === senderId);
    db.notifications.push({
      id: `notif_${Date.now()}`,
      userId: targetRecipientId,
      type: 'message',
      title: `💬 Nova mensagem de ${senderUser ? senderUser.name : 'Seu Match'}`,
      content: cleanContent.length > 50 ? `${cleanContent.substring(0, 50)}...` : cleanContent,
      read: false,
      link: `/chat/${conv.id}`,
      createdAt: now,
    });

    saveDB();

    // Deliver via WebSocket in real-time
    sendToUser(targetRecipientId, {
      type: 'new_message',
      message: newMessage,
    });

    return res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error('Send message error:', err);
    return res.status(500).json({ error: 'Erro ao enviar mensagem.' });
  }
});

// Get unread counts & notifications for current user
router.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const db = loadDB();

    const notifs = db.notifications
      .filter((n) => n.userId === currentUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    const unreadCount = notifs.filter((n) => !n.read).length;

    return res.json({ notifications: notifs, unreadCount });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao obter notificações.' });
  }
});

// Mark notification as read
router.put('/notifications/mark-read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const db = loadDB();

    db.notifications.forEach((n) => {
      if (n.userId === currentUserId) n.read = true;
    });

    saveDB();
    return res.json({ message: 'Notificações marcadas como lidas.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar notificações.' });
  }
});

export default router;
