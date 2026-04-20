// ═══════════════════════════════════════
// UACS Auth Routes — Login / Register / Logout / Me
// ═══════════════════════════════════════

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGetOne, dbUpdate, dbInsert } from '../database/db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'uacs_super_secret_2026';
const JWT_EXPIRES_IN = '24h';

// ─── POST /api/auth/login ───────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await dbGetOne('users', { email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

    // Update last_login
    await dbUpdate('users', user.id, { last_login: new Date().toISOString() });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log(`[UACS AUTH] User "${user.name}" (${user.role}) logged in`);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
    });
  } catch (err) {
    console.error('[UACS AUTH] Login error:', err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ─── POST /api/auth/logout ─────────────────────────────
router.post('/logout', (req, res) => {
  console.log('[UACS AUTH] User logged out');
  res.json({ success: true, message: 'Logged out successfully' });
});

// ─── POST /api/auth/register ────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ error: 'Name, email, and password are required' });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email address' });

    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Check email not already taken
    const existing = await dbGetOne('users', { email: email.toLowerCase().trim() });
    if (existing)
      return res.status(409).json({ error: 'An account with this email already exists' });

    // Hash password and create user
    const hash = bcrypt.hashSync(password, 10);
    const newUser = await dbInsert('users', {
      name:       name.trim(),
      email:      email.toLowerCase().trim(),
      password:   hash,
      role:       'admin',           // all registered users get admin role
      department: department?.trim() || null,
    });

    // Sign JWT — same shape as login
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log(`[UACS AUTH] New user registered: "${newUser.name}" (${newUser.email})`);

    res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, department: newUser.department },
    });
  } catch (err) {
    console.error('[UACS AUTH] Register error:', err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
});


// ─── GET /api/auth/me ──────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await dbGetOne('users', { id: decoded.id });

    if (!user) return res.status(401).json({ error: 'User not found' });

    const { password: _, ...safe } = user;
    res.json(safe);
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    if (err.name === 'JsonWebTokenError')  return res.status(401).json({ error: 'Invalid token',  code: 'INVALID_TOKEN' });
    console.error('[UACS AUTH] Me error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT /api/auth/profile ─────────────────────────────
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { name, department } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const updated = await dbUpdate('users', decoded.id, { name: name.trim(), department: department?.trim() || null });
    const { password: _, ...safe } = updated;
    res.json({ success: true, user: safe });
  } catch (err) {
    console.error('[UACS AUTH] Profile update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/auth/password ─────────────────────────────
router.put('/password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords are required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    const user = await dbGetOne('users', { id: decoded.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!bcrypt.compareSync(currentPassword, user.password))
      return res.status(401).json({ error: 'Current password is incorrect' });
    await dbUpdate('users', decoded.id, { password: bcrypt.hashSync(newPassword, 10) });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('[UACS AUTH] Password change error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
