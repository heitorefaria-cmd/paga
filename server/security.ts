import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Stricter limit: 15 login/register attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de autenticação. Por favor, aguarde 15 minutos.' }
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 90, // Limit each IP to 90 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de requisições excedido. Reduza a frequência de chamadas.' }
});

export function botProtectionMiddleware(req: any, res: any, next: any) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const knownBots = ['googlebot', 'bingbot', 'yandex', 'baiduspider', 'semrush', 'ahrefs', 'dotbot', 'rogue', 'python-requests', 'wget', 'curl', 'headlesschrome', 'scrapy', 'sqlmap'];

  if (knownBots.some((bot) => userAgent.includes(bot))) {
    return res.status(403).json({ error: 'Acesso negado. Acesso de bots/crawlers bloqueado nesta rota.' });
  }
  next();
}

export function securityHeadersMiddleware(req: any, res: any, next: any) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  next();
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim();
}

export function contentSafetyCheck(text: string): { safe: boolean; reason?: string } {
  if (!text) return { safe: true };

  const lower = text.toLowerCase();

  // Check for suspicious external redirect / phishing links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = lower.match(urlRegex);
  if (matches) {
    for (const match of matches) {
      if (!match.includes('unsplash.com') && !match.includes('malwarebytes.com') && !match.includes('triumphant-cat-production.up.railway.app')) {
        return { safe: false, reason: 'Links externos não verificados são proibidos para a segurança dos adolescentes.' };
      }
    }
  }

  return { safe: true };
}

export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  // Strict check for Base64 Data URLs (JPG/JPEG and PNG only)
  if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/png') || url.startsWith('data:image/jpg')) {
    return true;
  }
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const path = parsed.pathname.toLowerCase();
    if (path.includes('.svg') || path.includes('.html') || path.includes('.php') || path.includes('.js') || path.includes('.exe') || path.includes('.sh')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

