import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { action, key, value } = await request.json();

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const legacyToken = 'nl0h71zj';

    if (action === 'get') {
      let supabaseValue = '';
      let fetchSuccess = false;

      // 1. Try to fetch from Supabase
      try {
        const { data, error } = await supabase
          .from('session_store')
          .select('value')
          .eq('key', key)
          .single();

        if (!error && data) {
          supabaseValue = data.value;
          fetchSuccess = true;
        } else if (error && error.code !== 'PGRST116') {
          // If error is code PGRST116, it just means the row was not found.
          // Other codes mean the table or connection has issues (e.g. table doesn't exist yet).
          console.warn(`[SUPABASE] Query warning for key "${key}":`, error.message);
        } else if (!error) {
          fetchSuccess = true;
        }
      } catch (err: any) {
        console.warn(`[SUPABASE] Exception querying key "${key}":`, err.message || err);
      }

      // 2. Fall back to legacy key-value store if not found or if database query failed
      if (!fetchSuccess || !supabaseValue) {
        try {
          const url = `https://keyvalue.immanuel.co/api/KeyVal/GetValue/${legacyToken}/${key}?t=${Date.now()}`;
          const res = await fetch(url, { cache: 'no-store' });
          if (res.ok) {
            let text = await res.text();
            let data = text.trim();
            if (data.startsWith('"') && data.endsWith('"')) {
              data = data.substring(1, data.length - 1);
            }
            if (data && data !== 'Value Not Found' && data !== 'Not Found' && !data.includes('error')) {
              supabaseValue = data;
              
              // Seed the value to Supabase asynchronously so it's migrated for future calls
              (async () => {
                try {
                  const { error } = await supabase
                    .from('session_store')
                    .upsert({ key, value: data, updated_at: new Date().toISOString() });
                  if (error) {
                    console.warn(`[SUPABASE] Auto-migration caching failed for key "${key}":`, error.message);
                  } else {
                    console.log(`[SUPABASE] Successfully migrated and cached key "${key}" from legacy proxy.`);
                  }
                } catch (err) {
                  console.warn(`[SUPABASE] Exception during caching for key "${key}":`, err);
                }
              })();
            }
          }
        } catch (legacyErr: any) {
          console.error(`[LEGACY] Failed to fetch key "${key}" from fallback:`, legacyErr.message || legacyErr);
        }
      }

      return NextResponse.json({ data: supabaseValue });
    } else if (action === 'update') {
      let success = false;

      // 1. Update in Supabase
      try {
        const { error } = await supabase
          .from('session_store')
          .upsert({ key, value: String(value), updated_at: new Date().toISOString() });

        if (!error) {
          success = true;
        } else {
          console.warn(`[SUPABASE] Upsert error for key "${key}":`, error.message);
        }
      } catch (err: any) {
        console.warn(`[SUPABASE] Exception upserting key "${key}":`, err.message || err);
      }

      // 2. Also update in legacy key-value store to keep them in sync during migration transition
      try {
        const url = `https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${legacyToken}/${key}?value=${encodeURIComponent(value)}`;
        const res = await fetch(url, { method: 'POST', body: '' });
        if (res.ok) {
          const text = await res.text();
          if (text.trim() === 'true') {
            success = true;
          }
        }
      } catch (legacyErr: any) {
        console.error(`[LEGACY] Failed to update key "${key}" in fallback:`, legacyErr.message || legacyErr);
      }

      return NextResponse.json({ success });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('API proxy error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
