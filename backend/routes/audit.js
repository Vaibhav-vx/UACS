// ═══════════════════════════════════════
// UACS Audit Log Routes — Supabase edition
// ═══════════════════════════════════════

import { Router } from 'express';
import { dbSelect, getSupabase } from '../database/db.js';

const router = Router();
// ─── GET /api/audit ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { action, channel, performed_by, date_from, date_to, message_id, limit = 100 } = req.query;
    const sb = getSupabase();

    let q = sb.from('audit_log').select('*, messages(title)').order('timestamp', { ascending: false }).limit(Number(limit));
    if (action)       q = q.eq('action', action);
    if (channel)      q = q.eq('channel', channel);
    if (message_id)   q = q.eq('message_id', Number(message_id));
    if (performed_by) q = q.ilike('performed_by', `%${performed_by}%`);
    if (date_from)    q = q.gte('timestamp', date_from);
    if (date_to)      q = q.lte('timestamp', date_to);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    // Flatten the message title for the frontend
    const flattened = (data || []).map(e => ({
      ...e,
      message_title: e.messages?.title || null
    }));

    res.json(flattened);
  } catch (err) {
    console.error('[UACS AUDIT] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/audit/export — CSV export ──────────────────
router.get('/export', async (req, res) => {
  try {
    const { action, channel, date_from, date_to } = req.query;
    const sb = getSupabase();

    let q = sb.from('audit_log').select('*').order('timestamp', { ascending: false }).limit(10000);
    if (action)  q = q.eq('action', action);
    if (channel) q = q.eq('channel', channel);
    if (date_from) q = q.gte('timestamp', date_from);
    if (date_to)   q = q.lte('timestamp', date_to);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    const headers = ['ID', 'Timestamp', 'Action', 'Performed By', 'Channel', 'Notes'];
    const csvRows = [headers.join(',')];
    (data || []).forEach(e => {
      csvRows.push([
        e.id,
        `"${e.timestamp || ''}"`,
        e.action || '',
        `"${(e.performed_by || '').replace(/"/g, '""')}"`,
        e.channel || '',
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ].join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=uacs-audit-log.csv');
    res.send(csvRows.join('\n'));
  } catch (err) {
    console.error('[UACS AUDIT] Export error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
// ─── DELETE /api/audit/clear — Remove old entries ────────
router.delete('/clear', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const sb = getSupabase();

    // Count first so we can tell the user how many were deleted
    const { count } = await sb.from('audit_log').select('*', { count: 'exact', head: true }).lt('timestamp', cutoff);
    const { error } = await sb.from('audit_log').delete().lt('timestamp', cutoff);

    if (error) throw new Error(error.message);

    console.log(`[UACS AUDIT] Cleared ${count || 0} entries older than ${days} days`);
    res.json({ success: true, deleted: count || 0, days, cutoff });
  } catch (err) {
    console.error('[UACS AUDIT] Clear error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;

