// ═══════════════════════════════════════
// UACS Recipients Routes — CRUD + Test SMS
// Now uses universal db adapter (SQLite or Supabase)
// ═══════════════════════════════════════

import { Router } from 'express';
import { dbSelect, dbGetById, dbInsert, dbUpdate, dbDelete } from '../database/db.js';
import { sendSMS } from '../integrations/smsGateway.js';

const router = Router();

// ─── GET /api/recipients ───────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { zone } = req.query;
    const filters = { active: 1 };
    if (zone) filters.zone = zone;
    const recipients = await dbSelect('recipients', filters, { orderBy: 'created_at', ascending: false });
    res.json(recipients);
  } catch (err) {
    console.error('[UACS RECIPIENTS] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/recipients ──────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, phone, zone, language } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });

    // Auto-normalize phone: prepend +91 if missing country code
    const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`;

    const newRecipient = await dbInsert('recipients', {
      name,
      phone: normalizedPhone,
      zone: zone || null,
      language: language || 'en',
    });

    res.status(201).json(newRecipient);
  } catch (err) {
    console.error('[UACS RECIPIENTS] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/recipients/:id ───────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGetById('recipients', id);
    if (!existing) return res.status(404).json({ error: 'Recipient not found' });

    const { name, phone, zone, language } = req.body;
    const updates = {};
    if (name)     updates.name     = name;
    if (phone)    updates.phone    = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`;
    if (zone !== undefined) updates.zone = zone || null;
    if (language) updates.language = language;

    const updated = await dbUpdate('recipients', id, updates);
    res.json(updated);
  } catch (err) {
    console.error('[UACS RECIPIENTS] PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/recipients/:id ────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGetById('recipients', id);
    if (!existing) return res.status(404).json({ error: 'Recipient not found' });

    // Hard delete — the frontend now confirms before deleting
    await dbDelete('recipients', id);
    res.json({ success: true, message: `Recipient ${id} deleted` });
  } catch (err) {
    console.error('[UACS RECIPIENTS] DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/recipients/:id/test ─────────────────────
router.post('/:id/test', async (req, res) => {
  try {
    const recipient = await dbGetById('recipients', req.params.id);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    console.log(`[UACS SMS TEST] Sending test SMS to ${recipient.name} (${recipient.phone})`);

    const testMessage = `UACS Test: This is a test alert from the Unified Authority Communication System. If you received this, SMS delivery is working correctly. - Government Authority`;
    const result = await sendSMS(recipient.phone, testMessage);

    if (result.success) {
      console.log(`[UACS SMS TEST] ✅ Sent to ${recipient.phone}`);
      res.json({ success: true, message: `Test SMS sent to ${recipient.name}`, messageId: result.messageId });
    } else {
      console.error(`[UACS SMS TEST] ❌ Failed:`, result.error);
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error('[UACS SMS TEST] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
