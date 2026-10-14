import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import { isRecoveryCallback } from './recovery';
export const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !isRecoveryCallback,
    storageKey: `wasl:auth:${new URL(config.supabaseUrl).hostname}`,
  },
});
