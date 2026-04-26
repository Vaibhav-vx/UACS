// ═══════════════════════════════════════
// UACS Messages Routes
// Uses universal db adapter (SQLite or Supabase)
// ═══════════════════════════════════════

import { Router } from 'express';
import { dbSelect, dbGetById, dbGetOne, dbInsert, dbUpdate, dbDelete, dbCount } from '../database/db.js';
import { translateToMultiple } from '../integrations/translateApi.js';
import { sendBulkSMS } from '../integrations/smsGateway.js';
import { postTweet } from '../integrations/twitterApi.js';
import twilio from 'twilio';

const router = Router();
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

function parseMsg(msg) {
  if (!msg) return null;
  return {
    ...msg,
    channels:     msg.channels     ? JSON.parse(msg.channels)     : [],
    languages:    msg.languages     ? JSON.parse(msg.languages)    : [],
    translations: msg.translations  ? JSON.parse(msg.translations) : {},
  };
}

// ─── GET /api/messages ─────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const filters = status ? { status } : {};
    const messages = await dbSelect('messages', filters, { orderBy: 'created_at', ascending: false, limit: Number(limit) });
    res.json(messages.map(parseMsg));
  } catch (err) {
    console.error('[UACS MESSAGES] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/messages/stats ───────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [active, expired, draft, pending, all] = await Promise.all([
      dbCount('messages', { status: 'active' }),
      dbCount('messages', { status: 'expired' }),
      dbCount('messages', { status: 'draft' }),
      dbCount('messages', { status: 'pending' }),
      dbSelect('messages', {}, { orderBy: 'created_at', ascending: false, limit: 1000 }),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const totalToday = all.filter(m => (m.created_at || '').startsWith(today)).length;

    // Expiring within next hour
    const nowPlus1h = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const expiringSoon = all.filter(m =>
      m.status === 'active' && m.expires_at && m.expires_at <= nowPlus1h
    ).length;

    res.json({ totalToday, active, expiringSoon, expired, draft, pending, history: all });
  } catch (err) {
    console.error('[UACS MESSAGES] Stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/messages/:id ─────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const msg = await dbGetById('messages', req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json(parseMsg(msg));
  } catch (err) {
    console.error('[UACS MESSAGES] GET/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/messages ────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      title, master_content, urgency, target_zone,
      channels, languages, translations,
      expires_at, expiry_action, expiry_message,
      lat, lng,
    } = req.body;

    if (!title || !master_content || !urgency)
      return res.status(400).json({ error: 'title, master_content, and urgency are required' });

    const newMsg = await dbInsert('messages', {
      title,
      master_content,
      urgency,
      target_zone: target_zone || null,
      channels:     JSON.stringify(channels || []),
      languages:    JSON.stringify(languages || []),
      translations: JSON.stringify(translations || {}),
      status:       'draft',
      sent_by:      req.user?.name || 'Unknown',
      expires_at:   expires_at || null,
      expiry_action: expiry_action || 'flag',
      expiry_message: expiry_message || null,
      lat:          lat || null,
      lng:          lng || null,
    });

    await dbInsert('audit_log', {
      message_id:   newMsg.id,
      action:       'created',
      performed_by: req.user?.name || 'Unknown',
      notes:        `Initial draft created`,
    });

    res.status(201).json(parseMsg(newMsg));
  } catch (err) {
    console.error('[UACS MESSAGES] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/messages/:id ─────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const existing = await dbGetById('messages', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Message not found' });

    const {
      title, master_content, urgency, target_zone,
      channels, languages, translations, status,
      expires_at, expiry_action, expiry_message,
      lat, lng,
    } = req.body;

    const updates = {};
    if (title !== undefined)          updates.title          = title;
    if (master_content !== undefined)  updates.master_content = master_content;
    if (urgency !== undefined)         updates.urgency        = urgency;
    if (target_zone !== undefined)     updates.target_zone    = target_zone;
    if (channels !== undefined)        updates.channels       = JSON.stringify(channels);
    if (languages !== undefined)       updates.languages      = JSON.stringify(languages);
    if (translations !== undefined)    updates.translations   = JSON.stringify(translations);
    if (status !== undefined)          updates.status         = status;
    if (expires_at !== undefined)      updates.expires_at     = expires_at;
    if (expiry_action !== undefined)   updates.expiry_action  = expiry_action;
    if (expiry_message !== undefined)  updates.expiry_message = expiry_message;
    if (lat !== undefined)             updates.lat            = lat;
    if (lng !== undefined)             updates.lng            = lng;

    const updated = await dbUpdate('messages', req.params.id, updates);
    await dbInsert('audit_log', {
      message_id: req.params.id,
      action: 'edited',
      performed_by: req.user?.name || 'Unknown',
      notes: 'Message updated',
    });

    res.json(parseMsg(updated));
  } catch (err) {
    console.error('[UACS MESSAGES] PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/messages/:id/approve ─────────────────────
router.put('/:id/approve', async (req, res) => {
  try {
    const msg = await dbGetById('messages', req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const updated = await dbUpdate('messages', req.params.id, {
      status: 'pending',
      approved_by: req.user?.name || 'Unknown',
    });
    await dbInsert('audit_log', {
      message_id: req.params.id,
      action: 'approved',
      performed_by: req.user?.name || 'Unknown',
      notes: 'Ready for dispatch',
    });

    res.json(parseMsg(updated));
  } catch (err) {
    console.error('[UACS MESSAGES] Approve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/messages/:id/reject ──────────────────────
router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const msg = await dbGetById('messages', req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    // Return message to draft so composer can revise it
    await dbUpdate('messages', req.params.id, { status: 'draft', approved_by: null });
    await dbInsert('audit_log', {
      message_id:   req.params.id,
      action:       'rejected',
      performed_by: req.user?.name || 'Unknown',
      notes:        `Rejected${reason ? `: ${reason}` : ''}`,
    });

    res.json({ success: true, message: `Message ${req.params.id} rejected and returned to draft` });
  } catch (err) {
    console.error('[UACS MESSAGES] Reject error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/messages/:id/expire ──────────────────────
router.put('/:id/expire', async (req, res) => {
  try {
    const { reason } = req.body;
    const msg = await dbGetById('messages', req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    await dbUpdate('messages', req.params.id, { 
      status: 'expired',
      expiry_reason: reason || 'Situation resolved'
    });
    
    await dbInsert('audit_log', {
      message_id: req.params.id,
      action: 'expired',
      performed_by: req.user?.name || 'Unknown',
      notes: `Manual expiry. Reason: ${reason || 'N/A'}`,
    });

    res.json({ success: true, message: `Message ${req.params.id} expired` });
  } catch (err) {
    console.error('[UACS MESSAGES] Expire error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/messages/:id/extend ──────────────────────
router.put('/:id/extend', async (req, res) => {
  try {
    const { expires_at } = req.body;
    if (!expires_at) return res.status(400).json({ error: 'expires_at is required' });

    const msg = await dbGetById('messages', req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const updated = await dbUpdate('messages', req.params.id, { expires_at, status: 'active' });
    await dbInsert('audit_log', {
      message_id: req.params.id,
      action: 'edited',
      performed_by: req.user?.name || 'Unknown',
      notes: `Expiry extended to ${expires_at}`,
    });

    res.json(parseMsg(updated));
  } catch (err) {
    console.error('[UACS MESSAGES] Extend error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/messages/:id ──────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const msg = await dbGetById('messages', req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    await dbDelete('messages', req.params.id);
    res.json({ success: true, message: `Message ${req.params.id} deleted` });
  } catch (err) {
    console.error('[UACS MESSAGES] DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/messages/emergency ──────────────────────
router.post('/emergency', async (req, res) => {
  try {
    const { master_content, target_zone } = req.body;
    if (!master_content) return res.status(400).json({ error: 'master_content is required' });

    const title = 'EMERGENCY BROADCAST';
    const channels = ['sms', 'twitter', 'radio', 'tv', 'website'];
    const languages = ['hi', 'mr', 'ta', 'te', 'en'];
    const expires_at = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

    // 1. Create message
    const newMsg = await dbInsert('messages', {
      title,
      master_content,
      urgency: 'critical',
      target_zone: target_zone || null,
      channels: JSON.stringify(channels),
      languages: JSON.stringify(languages),
      translations: '{}',
      status: 'pending',
      sent_by: req.user?.name || 'Unknown',
      expires_at,
      expiry_action: 'replace',
      expiry_message: 'The emergency situation has been resolved. All clear.',
    });

    // 2. Translate
    const translations = await translateToMultiple(master_content, ['hi', 'mr', 'ta', 'te']);
    translations['en'] = master_content;
    await dbUpdate('messages', newMsg.id, { translations: JSON.stringify(translations) });

    const msgObj = {
      ...newMsg,
      channels,
      languages,
      translations,
    };

    // 3. Dispatch
    const allRecipients = await dbSelect('recipients', { active: 1 });
    const results = await Promise.all(channels.map(async (channel) => {
      try {
        let r;
        switch (channel) {
          case 'sms':
            if (allRecipients.length > 0) {
              const report = await sendBulkSMS(allRecipients, msgObj);
              r = { success: report.failed === 0, message: `${report.sent} sent, ${report.failed} failed` };
            } else {
              r = { success: false, message: 'No recipients found' };
            }
            break;
          case 'twitter': r = await postTweet(msgObj); break;
          case 'radio':   r = { success: true, message: 'Broadcast queued' }; break;
          case 'tv':      r = { success: true, message: 'TV crawl submitted' }; break;
          case 'website': r = { success: true, message: 'Published to CMS' }; break;
          default:        r = { success: false, message: 'Unknown channel' };
        }
        return { channel, status: r.success ? 'sent' : 'failed', detail: r.message };
      } catch (e) {
        return { channel, status: 'failed', detail: e.message };
      }
    }));

    // 4. Mark active
    await dbUpdate('messages', newMsg.id, {
      status: 'active',
      sent_at: new Date().toISOString(),
      approved_by: req.user?.name || 'System',
    });

    await dbInsert('audit_log', {
      message_id: newMsg.id,
      action: 'dispatched',
      performed_by: req.user?.name || 'System',
      notes: 'Emergency broadcast dispatched to ALL channels instantly',
    });

    res.json({ success: true, messageId: newMsg.id, details: results });
  } catch (err) {
    console.error('[UACS EMERGENCY] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/messages/:id ───────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const msg = await dbGetById('messages', req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    await dbDelete('messages', req.params.id);
    await dbInsert('audit_log', {
      action:       'edited',
      performed_by: req.user?.name || 'Unknown',
      notes:        `Message "${msg.title}" (ID: ${req.params.id}) was permanently deleted.`,
    });

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    console.error('[UACS MESSAGES] Delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/messages/safety/direct ──────────────────
router.post('/safety/direct', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name || 'Anonymous';
    const zone = req.user?.zone || 'Unknown';

    const report = await dbInsert('safety_reports', {
      message_id: null, // Direct SOS has no parent message
      user_id: userId,
      user_name: userName,
      zone: zone,
      status: 'assistance',
      lat: lat || null,
      lng: lng || null,
      emergency_contact_notified: false,
      assisted: false,
    });

    res.json(report);
  } catch (err) {
    console.error('[UACS SAFETY] Direct SOS error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/messages/:id/safety ─────────────────────
router.post('/:id/safety', async (req, res) => {
  try {
    const { status, lat, lng, contact_notified } = req.body;
    const messageId = req.params.id;
    const userId = req.user?.id;
    const userName = req.user?.name || 'Anonymous';
    const zone = req.user?.zone || 'Unknown';

    if (!['safe', 'assistance'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const report = await dbInsert('safety_reports', {
      message_id: messageId,
      user_id: userId,
      user_name: userName,
      zone: zone,
      status: status,
      lat: lat || null,
      lng: lng || null,
      emergency_contact_notified: contact_notified || false,
      assisted: false,
    });

    res.json(report);
  } catch (err) {
    console.error('[UACS SAFETY] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/messages/safety/recent ───────────────────
router.get('/safety/recent', async (req, res) => {
  try {
    const reports = await dbSelect('safety_reports', {}, { orderBy: 'created_at', ascending: false, limit: 10 });
    res.json(reports);
  } catch (err) {
    console.error('[UACS SAFETY] Recent error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/messages/safety/stats ────────────────────
router.get('/safety/stats', async (req, res) => {
  try {
    const reports = await dbSelect('safety_reports', {}, { limit: 5000 });
    const stats = {
      safe: reports.filter(r => r.status === 'safe').length,
      assistance: reports.filter(r => r.status === 'assistance').length,
    };
    res.json(stats);
  } catch (err) {
    console.error('[UACS SAFETY] Stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/messages/safety/:id/assist ───────────────
router.put('/safety/:id/assist', async (req, res) => {
  try {
    const report = await dbGetById('safety_reports', req.params.id);
    if (!report) return res.status(404).json({ error: 'Safety report not found' });

    await dbUpdate('safety_reports', req.params.id, { assisted: true });

    // Send SMS notification to the citizen that help is coming
    const user = await dbGetById('users', report.user_id);
    if (user && user.email) {
      try {
        const twilioPhone = '+91' + user.email.replace(/\D/g, '');
        await twilioClient.messages.create({
          body: `UACS: A rescue team has been dispatched to assist you. Stay where you are. Help is coming. - Government Authority`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: twilioPhone,
        });
        console.log(`[UACS SOS] Assistance confirmation sent to ${user.email}`);
      } catch (smsErr) {
        console.error('[UACS SOS] SMS error:', smsErr.message);
      }
    }

    res.json({ success: true, message: 'Citizen marked as assisted and notified' });
  } catch (err) {
    console.error('[UACS SAFETY] Assist error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/messages/:id/performance ──────────────────
router.get('/:id/performance', async (req, res) => {
  try {
    const messageId = req.params.id;
    const msg = await dbGetById('messages', messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const reports = await dbSelect('safety_reports', { message_id: messageId });
    const audit = await dbSelect('audit_log', { message_id: messageId });
    
    const dispatched = audit.find(a => a.action === 'dispatched');
    const expired = audit.find(a => a.action === 'expired');

    const stats = {
      title: msg.title,
      dispatched_at: dispatched?.timestamp,
      expired_at: expired?.timestamp,
      expiry_reason: msg.expiry_reason,
      total_responses: reports.length,
      safe_count: reports.filter(r => r.status === 'safe').length,
      sos_count: reports.filter(r => r.status === 'assistance').length,
      assisted_count: reports.filter(r => r.assisted).length,
      channels: JSON.parse(msg.channels || '[]'),
      languages: JSON.parse(msg.languages || '[]'),
    };

    res.json(stats);
  } catch (err) {
    console.error('[UACS PERFORMANCE] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
