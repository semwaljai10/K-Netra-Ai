import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/seed — Seeds the Supabase fir_records table and session_store default credentials.
 * This is a one-time operation. Subsequent calls will skip already-inserted records.
 */
export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase credentials are not configured in environment variables.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const errors: string[] = [];

    // =========================================================================
    // 1. Seed default operator credentials in session_store
    // =========================================================================
    try {
      const defaultPassword = 'Pune@143';
      
      // Encrypt using AETHER_SECURE_2026 XOR key to match AppContext logic
      const encryptPassword = (password: string): string => {
        const key = 'AETHER_SECURE_2026';
        let xorStr = '';
        for (let i = 0; i < password.length; i++) {
          xorStr += String.fromCharCode(password.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return 'enc_' + Buffer.from(xorStr, 'binary').toString('base64');
      };

      const toUrlSafeBase64 = (str: string) => {
        return Buffer.from(str, 'utf8')
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      };

      const encryptedPassword = encryptPassword(defaultPassword);

      const adminUsersObj = [
        {
          username: 'a11022004',
          password: encryptedPassword,
          mustChangePassword: false,
          name: 'Administrator',
          role: 'System administrator L2',
          level: 2,
          phone: '+91 98765 43210'
        }
      ];

      const normalUsersObj = [
        {
          username: 'v27022004',
          password: encryptedPassword,
          mustChangePassword: false,
          name: 'Officer A. Sharma',
          role: 'Control Room',
          phone: '+91 98765 43210'
        }
      ];

      const adminUsersStr = toUrlSafeBase64(JSON.stringify(adminUsersObj));
      const normalUsersStr = toUrlSafeBase64(JSON.stringify(normalUsersObj));

      // Upsert default users into Supabase session_store table
      const { error: adminError } = await supabase
        .from('session_store')
        .upsert({ key: 'admin_users', value: adminUsersStr, updated_at: new Date().toISOString() });

      const { error: normalError } = await supabase
        .from('session_store')
        .upsert({ key: 'normal_users', value: normalUsersStr, updated_at: new Date().toISOString() });

      if (adminError || normalError) {
        errors.push(`Seeding session_store failed: ${adminError?.message || ''} ${normalError?.message || ''}`);
      } else {
        console.log('[SUPABASE SEED] Successfully seeded default operator credentials.');
      }
    } catch (e: any) {
      errors.push(`Session store seed exception: ${e.message || e}`);
    }

    // =========================================================================
    // 2. Seed FIR records
    // =========================================================================
    let inserted = 0;
    let totalRecords = 0;

    try {
      if (force) {
        // Safely clear existing records
        const { error: deleteError } = await supabase
          .from('fir_records')
          .delete()
          .neq('fir_number', '');

        if (deleteError) {
          return NextResponse.json(
            { error: `Failed to clear existing records: ${deleteError.message}` },
            { status: 500 }
          );
        }
      } else {
        // Check if data already exists
        const { count, error: countError } = await supabase
          .from('fir_records')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          return NextResponse.json(
            { error: `Database error: ${countError.message}. Did you run the schema.sql in the Supabase SQL Editor?` },
            { status: 500 }
          );
        }

        if (count && count > 0 && errors.length === 0) {
          return NextResponse.json({
            success: true,
            message: `Database already seeded with ${count} records and default credentials. Skipping.`,
            count
          });
        }
      }

      // Read the JSON dataset
      const filePath = path.join(process.cwd(), 'src/lib/karnataka_crime_dataset.json');
      const fileData = await fs.promises.readFile(filePath, 'utf8');
      const dataset = JSON.parse(fileData);
      const records: any[] = dataset?.fir_records ?? [];

      if (records.length === 0) {
        return NextResponse.json({ error: 'No FIR records found in the dataset file.' }, { status: 400 });
      }

      totalRecords = records.length;

      // Helper to compute severity from crime type
      const getSeverity = (crimeType: string): string => {
        const type = crimeType.toLowerCase();
        if (type.includes('murder') || type.includes('homicide') || type.includes('drug')) return 'Critical';
        if (type.includes('assault') || type.includes('robbery') || type.includes('sexual') || type.includes('kidnap')) return 'High';
        if (type.includes('cyber') || type.includes('theft') || type.includes('fraud') || type.includes('cheating')) return 'Medium';
        return 'Low';
      };

      // Transform records for insertion
      const rows = records.map((fir: any) => ({
        fir_number: fir.fir_number,
        case_status: fir.case_status || 'Open',
        district: fir.incident_location?.district || fir.police_station?.district || null,
        crime_type: fir.crime_classification?.crime_type || 'Unknown',
        severity: getSeverity(fir.crime_classification?.crime_type || ''),
        latitude: fir.incident_location?.coordinates?.latitude || null,
        longitude: fir.incident_location?.coordinates?.longitude || null,
        date_time_of_filing: fir.date_time_of_filing || null,
        data: fir,  // Store the full FIR record as JSONB
        status_modification: null,
      }));

      // Batch insert in chunks of 100
      const BATCH_SIZE = 100;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const { error: insertError } = await supabase
          .from('fir_records')
          .insert(batch);

        if (insertError) {
          errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`);
        } else {
          inserted += batch.length;
        }
      }
    } catch (e: any) {
      errors.push(`FIR records seed exception: ${e.message || e}`);
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: `Seeded default operator credentials (passwords set to Pune@143) and ${inserted} of ${totalRecords} FIR records.`,
      inserted,
      total: totalRecords,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error('Seed error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
