import { Router, Response } from 'express';
import { loadDB, saveDB, DBUser } from '../db.js';
import { requireAuth, sanitizeUser, AuthenticatedRequest } from '../auth.js';
import { sanitizeText, isValidImageUrl, contentSafetyCheck } from '../security.js';

const router = Router();

// Get discovery profiles stack for swipe
router.get('/discovery', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const db = loadDB();

    const currentUser = db.users.find((u) => u.id === currentUserId);
    if (!currentUser) return res.status(404).json({ error: 'Usuário não encontrado.' });

    // List user IDs already liked or passed by current user
    const interactedUserIds = new Set(
      db.likes.filter((l) => l.fromUserId === currentUserId).map((l) => l.toUserId)
    );

    // List user IDs blocked
    const blockedUserIds = new Set([
      ...db.blocks.filter((b) => b.blockerId === currentUserId).map((b) => b.blockedUserId),
      ...db.blocks.filter((b) => b.blockedUserId === currentUserId).map((b) => b.blockerId)
    ]);

    // Filter available candidates
    const candidates = db.users.filter((candidate) => {
      if (candidate.id === currentUserId) return false;
      if (candidate.role === 'admin') return false; // Admin profile should never appear in discovery
      if (candidate.status === 'suspended') return false;
      if (interactedUserIds.has(candidate.id)) return false;
      if (blockedUserIds.has(candidate.id)) return false;

      // Gender preference matching filter
      if (currentUser.lookingFor !== 'everyone') {
        if (currentUser.lookingFor === 'man' && candidate.gender !== 'man') return false;
        if (currentUser.lookingFor === 'woman' && candidate.gender !== 'woman') return false;
      }

      return true;
    });

    // Attach simulated dynamic distance for discovery cards UI
    const result = candidates.map((c) => {
      const sanitized = sanitizeUser(c);
      return {
        ...sanitized,
        distanceKm: Math.floor(Math.random() * 15) + 1,
      };
    });

    return res.json({ profiles: result });
  } catch (err) {
    console.error('Discovery error:', err);
    return res.status(500).json({ error: 'Erro ao carregar fila de descoberta.' });
  }
});

// Get user profile by ID
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetId = req.params.id;
    const db = loadDB();
    const user = db.users.find((u) => u.id === targetId);

    if (!user || user.status === 'suspended') {
      return res.status(404).json({ error: 'Perfil não encontrado ou indisponível.' });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao obter perfil.' });
  }
});

// Update own profile
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const { name, bio, location, occupation, gender, lookingFor, interests, avatar, photos } = req.body;

    const db = loadDB();
    const user = db.users.find((u) => u.id === currentUserId);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (name) user.name = sanitizeText(name.trim());
    if (bio !== undefined) {
      const bioSafety = contentSafetyCheck(bio);
      if (!bioSafety.safe) {
        return res.status(400).json({ error: bioSafety.reason || 'Sua bio foi recusada por conter conteúdo inseguro.' });
      }
      user.bio = sanitizeText(bio.trim());
    }
    if (location) user.location = sanitizeText(location.trim());
    if (occupation !== undefined) user.occupation = sanitizeText(occupation.trim());
    if (gender) user.gender = gender;
    if (lookingFor) user.lookingFor = lookingFor;

    if (Array.isArray(interests)) {
      user.interests = interests.slice(0, 10).map((i) => sanitizeText(i.trim()));
    }

    if (avatar && isValidImageUrl(avatar)) {
      user.avatar = avatar;
    }

    if (Array.isArray(photos)) {
      const validPhotos = photos.filter((p) => isValidImageUrl(p)).slice(0, 6);
      if (validPhotos.length > 0) {
        user.photos = validPhotos;
        if (!avatar || !validPhotos.includes(avatar)) {
          user.avatar = validPhotos[0];
        }
      }
    }

    user.lastSeen = new Date().toISOString();
    saveDB();

    return res.json({ user: sanitizeUser(user), message: 'Perfil atualizado com sucesso!' });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

// Photo Management: Upload/Add photo
router.post('/photos', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const { photoUrl } = req.body;

    if (!photoUrl || !isValidImageUrl(photoUrl)) {
      return res.status(400).json({ error: 'URL de imagem inválida ou formato de arquivo não suportado.' });
    }

    const db = loadDB();
    const user = db.users.find((u) => u.id === currentUserId);

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    if (user.photos.length >= 6) {
      return res.status(400).json({ error: 'Limite máximo de 6 fotos atingido. Remova uma foto antes de adicionar outra.' });
    }

    user.photos.push(photoUrl);
    if (!user.avatar) {
      user.avatar = photoUrl;
    }

    saveDB();

    return res.json({ photos: user.photos, avatar: user.avatar, message: 'Foto adicionada com sucesso!' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao adicionar foto.' });
  }
});

// Photo Management: Delete photo
router.delete('/photos', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const { photoUrl } = req.body;

    const db = loadDB();
    const user = db.users.find((u) => u.id === currentUserId);

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    if (user.photos.length <= 1) {
      return res.status(400).json({ error: 'Sua conta deve manter pelo menos 1 foto de perfil.' });
    }

    user.photos = user.photos.filter((p) => p !== photoUrl);
    if (user.avatar === photoUrl) {
      user.avatar = user.photos[0];
    }

    saveDB();

    return res.json({ photos: user.photos, avatar: user.avatar, message: 'Foto removida com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao remover foto.' });
  }
});

export default router;
