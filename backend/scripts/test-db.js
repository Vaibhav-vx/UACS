// DB Test Script
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSupabase, dbCount } from '../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function test() {
  console.log('Testing Supabase Connectivity...');
  try {
    const sb = getSupabase();
    console.log('Client initialized. Fetching user count...');
    const count = await dbCount('users');
    console.log('✅ Success! Found', count, 'users in database.');
  } catch (err) {
    console.error('❌ DB Test failed:', err.message);
  }
}

test();
