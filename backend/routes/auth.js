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

// Twilio Client
import twilio from 'twilio';
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Normalizes number to E.164 for Twilio (+91XXXXXXXXXX)
 */
const normalizeForTwilio = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  return digits.startsWith('+') ? digits : `+${digits}`;
};

/**
 * Normalizes number for consistent DB storage (XXXXX XXXXX)
 */
const normalizeForDB = (phone) => {
  const digits = phone.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  if (last10.length === 10) {
    return `${last10.slice(0, 5)} ${last10.slice(5)}`;
  }
  return phone;
};

// OTP Cache
const OTP_STORE = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// ─── POST /api/auth/login ───────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ error: 'Mobile number and password are required' });

    const dbPhone = normalizeForDB(phone);
    const user = await dbGetOne('users', { email: dbPhone });
    if (!user) return res.status(401).json({ error: 'Invalid mobile or password' });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid mobile or password' });

    // Update last_login
    await dbUpdate('users', user.id, { last_login: new Date().toISOString() });

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log(`[UACS AUTH] User "${user.name}" (${user.role}) logged in`);

    res.json({
      token,
      user: { id: user.id, name: user.name, phone: user.email, role: user.role, department: user.department },
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

// ─── POST /api/auth/otp/send ─────────────────────────────
router.post('/otp/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Mobile number is required' });

    const normalized = normalizeForTwilio(phone);
    const dbPhone = normalizeForDB(phone);

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + OTP_EXPIRY_MS;

    // Save to cache (Keyed by the consistent DB format)
    OTP_STORE.set(dbPhone, { code, expiry });

    // Send via Twilio
    await twilioClient.messages.create({
      body: `Your UACS verification code is: ${code}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalized,
    });

    console.log(`[UACS OTP] Code ${code} sent to ${normalized} (DB: ${dbPhone})`);
    res.json({ success: true, message: 'Verification code sent' });
  } catch (err) {
    console.error('[UACS OTP] Send error:', err.message);
    res.status(500).json({ error: 'Failed to send SMS. Please check the mobile number format.' });
  }
});

// ─── POST /api/auth/register ────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, department, otp } = req.body;
    if (!name?.trim() || !phone?.trim() || !password || !otp)
      return res.status(400).json({ error: 'All fields including OTP are required' });

    const dbPhone = normalizeForDB(phone);

    // Verify OTP
    const cached = OTP_STORE.get(dbPhone);
    if (!cached || cached.code !== otp || Date.now() > cached.expiry) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // OTP Correct -> Clear from cache
    OTP_STORE.delete(dbPhone);

    if (phone.trim().length < 10)
      return res.status(400).json({ error: 'Valid mobile number is required' });

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!pwdRegex.test(password))
      return res.status(400).json({ error: 'Password must be 8+ chars and include uppercase, lowercase, number, and special character' });

    const dbPhone = normalizeForDB(phone);
    
    // Check phone not already taken (using email column)
    const existing = await dbGetOne('users', { email: dbPhone });
    if (existing)
      return res.status(409).json({ error: 'An account with this mobile number already exists' });

    // Hash password and create user
    const hash = bcrypt.hashSync(password, 10);
    const newUser = await dbInsert('users', {
      name:       name.trim(),
      email:      dbPhone, // Store phone in email column
      password:   hash,
      role:       'user', // FORCE USER ROLE - NO EXCEPTIONS
      department: department?.trim() || null,
    });

    // AUTO-SYNC TO RECIPIENTS (Deduplicated)
    const existingRecipient = await dbGetOne('recipients', { phone: phone.trim() });
    if (!existingRecipient) {
      await dbInsert('recipients', {
        name:       name.trim(),
        phone:      phone.trim(),
        zone:       department?.trim() || 'General',
        language:   'english',
        active:     true
      });
      console.log(`[UACS AUTH] Auto-added ${phone} to Recipients list`);
    }

    // Sign JWT — same shape as login
    const token = jwt.sign(
      { id: newUser.id, phone: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log(`[UACS AUTH] New user registered: "${newUser.name}" (${newUser.email})`);

    res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, phone: newUser.email, role: newUser.role, department: newUser.department },
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
