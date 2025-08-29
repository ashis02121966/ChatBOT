import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
  console.error('Current values:', { 
    supabaseUrl: supabaseUrl ? 'SET' : 'MISSING', 
    supabaseServiceKey: supabaseServiceKey ? 'SET' : 'MISSING' 
  });
  throw new Error('Missing Supabase configuration');
}

console.log('🔧 Initializing Supabase client for server-side operations...');
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON');

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'survey-chatbot-server'
    }
  }
});
