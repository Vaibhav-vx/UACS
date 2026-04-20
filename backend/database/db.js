// ═══════════════════════════════════════
// UACS — Supabase Database Client
// Single source of truth — no SQLite
// ═══════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

let _sb = null;

export function getSupabase() {
  if (_sb) return _sb;

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      '\n[UACS] ❌ Missing Supabase credentials!\n' +
      '  Add SUPABASE_URL and SUPABASE_SERVICE_KEY to your .env file.\n'
    );
  }

  _sb = createClient(url, key, { auth: { persistSession: false } });
  console.log('[UACS DB] ✅ Connected to Supabase (cloud PostgreSQL)');
  return _sb;
}

// ── SELECT rows ───────────────────────────────────────────
export async function dbSelect(table, filters = {}, { orderBy = 'created_at', ascending = false, limit = 1000 } = {}) {
  const sb = getSupabase();
  let q = sb.from(table).select('*').order(orderBy, { ascending }).limit(limit);
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  const { data, error } = await q;
  if (error) throw new Error(`[DB SELECT ${table}] ${error.message}`);
  return data || [];
}

// ── SELECT one by id ──────────────────────────────────────
export async function dbGetById(table, id) {
  const { data, error } = await getSupabase().from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`[DB GET ${table}#${id}] ${error.message}`);
  return data;
}

// ── SELECT one by arbitrary filter ────────────────────────
export async function dbGetOne(table, filters = {}) {
  let q = getSupabase().from(table).select('*').limit(1);
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  const { data, error } = await q;
  if (error) throw new Error(`[DB GET ONE ${table}] ${error.message}`);
  return data?.[0] ?? null;
}

// ── INSERT ────────────────────────────────────────────────
export async function dbInsert(table, data) {
  const { data: row, error } = await getSupabase().from(table).insert(data).select().single();
  if (error) throw new Error(`[DB INSERT ${table}] ${error.message}`);
  return row;
}

// ── UPDATE ────────────────────────────────────────────────
export async function dbUpdate(table, id, data) {
  const { data: row, error } = await getSupabase().from(table).update(data).eq('id', id).select().single();
  if (error) throw new Error(`[DB UPDATE ${table}#${id}] ${error.message}`);
  return row;
}

// ── DELETE ────────────────────────────────────────────────
export async function dbDelete(table, id) {
  const { error } = await getSupabase().from(table).delete().eq('id', id);
  if (error) throw new Error(`[DB DELETE ${table}#${id}] ${error.message}`);
  return true;
}

// ── COUNT ─────────────────────────────────────────────────
export async function dbCount(table, filters = {}) {
  let q = getSupabase().from(table).select('*', { count: 'exact', head: true });
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  const { count, error } = await q;
  if (error) throw new Error(`[DB COUNT ${table}] ${error.message}`);
  return count ?? 0;
}

export default { getSupabase, dbSelect, dbGetById, dbGetOne, dbInsert, dbUpdate, dbDelete, dbCount };
