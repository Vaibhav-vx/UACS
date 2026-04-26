// ═══════════════════════════════════════
// UACS Auth Routes — Login / Register / Logout / Me
// ═══════════════════════════════════════

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGetOne, dbUpdate, dbInsert } from '../database/db.js';
import { sendSMS } from '../integrations/smsGateway.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'uacs_super_secret_2026';
const JWT_EXPIRES_IN = '24h';

// Twilio Client removed - using smsGateway

// OTP Cache (In-Memory for single-server stability)
const OTP_STORE = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// ─── POST /api/auth/login ───────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ error: 'Mobile number and password are required' });

    const normalizedPhone = phone.trim().replace(/\s+/g, '');
    const user = await dbGetOne('users', { email: normalizedPhone });
    if (!user) return res.status(401).json({ error: 'Invalid mobile or password' });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid mobile or password' });

    // Update last_login
    await dbUpdate('users', user.id, { last_login: new Date().toISOString() });

    const token = jwt.sign(
      { id: user.id, phone: user.email, role: user.role },
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

// ─── POST /api/auth/demo ───────────────────────────────
router.post('/demo', async (req, res) => {
  try {
    const demoEmail = '00000 00000'; // We use email column for phone
    let demoUser = await dbGetOne('users', { email: demoEmail });

    if (!demoUser) {
      // Create demo user if it doesn't exist
      const hash = bcrypt.hashSync('demo1234', 10);
      demoUser = await dbInsert('users', {
        name: 'Demo User',
        email: demoEmail,
        password: hash,
        role: 'user',
        department: 'Demonstration'
      });
      console.log('[UACS AUTH] Created new Demo User');
    }

    const token = jwt.sign(
      { id: demoUser.id, phone: demoUser.email, role: demoUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log(`[UACS AUTH] Demo User logged in`);

    res.json({
      token,
      user: { id: demoUser.id, name: demoUser.name, phone: demoUser.email, role: demoUser.role, department: demoUser.department },
    });
  } catch (err) {
    console.error('[UACS AUTH] Demo login error:', err.message);
    res.status(500).json({ error: 'Server error during demo login' });
  }
});

// ─── POST /api/auth/otp/send ─────────────────────────────
router.post('/otp/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Mobile number is required' });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + OTP_EXPIRY_MS;

    // Save to cache
    OTP_STORE.set(phone, { code, expiry });

    // Send via centralized gateway
    const smsResult = await sendSMS(phone, `Your UACS registration code is: ${code}. Valid for 5 minutes.`);
    if (!smsResult.success) throw new Error(smsResult.error);

    console.log(`[UACS OTP] Code ${code} sent to ${phone}`);
    res.json({ success: true, message: 'Verification code sent' });
  } catch (err) {
    console.error('[UACS OTP] Send error:', err.message);
    res.status(500).json({ error: 'Failed to send SMS. Please check the mobile number format.' });
  }
});

// ─── POST /api/auth/register ────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, department } = req.body;

    if (!name?.trim() || !phone?.trim() || !password)
      return res.status(400).json({ error: 'All fields are required' });

    const normalizedPhone = phone.trim().replace(/\s+/g, '');

    if (normalizedPhone.length < 10)
      return res.status(400).json({ error: 'Valid mobile number is required' });

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!pwdRegex.test(password))
      return res.status(400).json({ error: 'Password must be 8+ chars and include uppercase, lowercase, number, and special character' });

    // Check phone not already taken (using email column)
    const existing = await dbGetOne('users', { email: normalizedPhone });
    if (existing)
      return res.status(409).json({ error: 'An account with this mobile number already exists' });

    // Hash password and create user
    const hash = bcrypt.hashSync(password, 10);
    const newUser = await dbInsert('users', {
      name:       name.trim(),
      email:      normalizedPhone, // Use email column to store phone
      password:   hash,
      role:       'user', // FORCE USER ROLE - NO EXCEPTIONS
      department: department?.trim() || null,
    });

    // AUTO-SYNC TO RECIPIENTS (Deduplicated)
    const existingRecipient = await dbGetOne('recipients', { phone: normalizedPhone });
    if (!existingRecipient) {
      await dbInsert('recipients', {
        name:       name.trim(),
        phone:      normalizedPhone,
        zone:       department?.trim() || 'General',
        language:   'english',
        active:     true
      });
      console.log(`[UACS AUTH] Auto-added ${normalizedPhone} to Recipients list`);
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
    console.error('[UACS AUTH] Password error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/auth/preferences ─────────────────────────────
router.get('/preferences', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    
    // Preferences are synced between users and recipients table
    const user = await dbGetOne('users', { id: decoded.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ 
      language: user.language || 'english', 
      zone: user.zone || 'General', 
      lat: user.lat,
      lng: user.lng,
      active: true // default active
    });
  } catch (err) {
    console.error('[UACS AUTH] Get preferences error:', err.message);
    res.status(500).json({ error: 'Server error fetching preferences' });
  }
});

// ─── PUT /api/auth/preferences ─────────────────────────────
router.put('/preferences', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    
    const { language, zone, lat, lng, active } = req.body;
    
    // 1. Update users table
    await dbUpdate('users', decoded.id, { 
      zone: zone || 'General',
      language: language || 'english',
      lat: lat || null,
      lng: lng || null
    });

    // 2. Sync to recipients table for dispatching
    const recipient = await dbGetOne('recipients', { phone: decoded.phone });
    if (recipient) {
      await dbUpdate('recipients', recipient.id, { 
        zone: zone || 'General',
        language: language || 'english',
        lat: lat || null,
        lng: lng || null,
        active: active !== undefined ? active : true
      });
    } else {
      const user = await dbGetOne('users', { id: decoded.id });
      await dbInsert('recipients', {
        name: user.name,
        phone: decoded.phone,
        language: language || 'english',
        zone: zone || 'General',
        lat: lat || null,
        lng: lng || null,
        active: active !== undefined ? active : true
      });
    }
    
    res.json({ success: true, message: 'Preferences updated and synced' });
  } catch (err) {
    console.error('[UACS AUTH] Update preferences error:', err.message);
    res.status(500).json({ error: 'Server error updating preferences' });
  }
});

// ─── POST /api/auth/emergency-contact ─────────────────────────────
router.post('/emergency-contact', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    
    let { phone, name } = req.body;
    if (!phone) return res.status(400).json({ error: 'Emergency contact number is required' });
    
    const normalizedPhone = '+91' + phone.replace(/\D/g, '');
    if (normalizedPhone.length < 13) return res.status(400).json({ error: 'Valid mobile number is required' });

    // Check if recipient already exists
    let existing = await dbGetOne('recipients', { phone: normalizedPhone });
    if (existing) {
      return res.json({ success: true, message: 'Contact is already registered in the system.' });
    }

    const user = await dbGetOne('users', { id: decoded.id });
    
    await dbInsert('recipients', {
      name: `${user.name} (Emergency Contact)`,
      phone: normalizedPhone,
      zone: 'Emergency', // Special zone
      language: 'english',
      active: true
    });
    
    console.log(`[UACS AUTH] Emergency contact ${normalizedPhone} added by ${user.name}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[UACS AUTH] Add emergency contact error:', err.message);
    res.status(500).json({ error: 'Server error adding emergency contact' });
  }
});

export default router;
