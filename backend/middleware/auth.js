// ═══════════════════════════════════════
// UACS Auth Middleware — JWT verification
// Supabase edition — no SQLite
// ═══════════════════════════════════════

import jwt from 'jsonwebtoken';
import { dbGetOne } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'uacs_super_secret_2026';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required', code: 'NO_TOKEN' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Async DB lookup — attach user to req and call next
    dbGetOne('users', { id: decoded.id })
      .then(user => {
        if (!user) return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
        const { password: _, ...safe } = user;
        req.user = safe;
        next();
      })
      .catch(err => {
        console.error('[UACS AUTH] Middleware DB error:', err.message);
        res.status(500).json({ error: 'Authentication error' });
      });

  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Session expired. Please login again.', code: 'TOKEN_EXPIRED' });
    if (err.name === 'JsonWebTokenError')  return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    console.error('[UACS AUTH] Middleware error:', err.message);
    res.status(500).json({ error: 'Authentication error' });
  }
}
