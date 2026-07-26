// ═══════════════════════════════════════
// Portal Auth Middleware — JWT verification
// Supabase edition — no SQLite
// ═══════════════════════════════════════

import jwt from 'jsonwebtoken';
import { dbGetOne, getSupabase } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET;

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required', code: 'NO_TOKEN' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.id || !decoded.jti) return res.status(401).json({ error: 'Invalid token payload', code: 'INVALID_PAYLOAD' });

    // Check if token is blocklisted
    getSupabase().from('token_blocklist').select('jti').eq('jti', decoded.jti).single()
      .then(({ data: blockedToken }) => {
        if (blockedToken) {
          console.warn(`[Portal AUTH] Attempted use of revoked token (jti: ${decoded.jti})`);
          return res.status(401).json({ error: 'Session revoked. Please login again.', code: 'TOKEN_REVOKED' });
        }

        // Ensure ID is matched correctly (string/int)
        const userId = Number(decoded.id);

        dbGetOne('users', { id: userId })
          .then(user => {
            if (!user) {
              console.warn(`[Portal AUTH] Token verified for ID ${userId}, but user not found in database.`);
              return res.status(401).json({ error: 'User no longer exists', code: 'USER_NOT_FOUND' });
            }
            const { password: _, ...safe } = user;
            req.user = safe;
            next();
          })
          .catch(err => {
            console.error('[Portal AUTH] Middleware DB error:', err.message);
            res.status(500).json({ error: 'Database authentication error' });
          });
      })
      .catch(err => {
        console.error('[Portal AUTH] Blocklist check error:', err.message);
        res.status(500).json({ error: 'Authentication check failed' });
      });

  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Session expired. Please login again.', code: 'TOKEN_EXPIRED' });
    if (err.name === 'JsonWebTokenError')  return res.status(401).json({ error: 'Invalid token signature', code: 'INVALID_TOKEN' });
    console.error('[Portal AUTH] Middleware error:', err.message);
    res.status(500).json({ error: 'Authentication internal error' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required', code: 'NO_USER' });
  }
  if (req.user.role?.toLowerCase() !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required', code: 'FORBIDDEN' });
  }
  next();
}
