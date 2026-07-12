import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/seed — Seeds the Supabase fir_records table from the local JSON file.
 * This is a one-time operation. Subsequent calls will skip already-inserted records.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

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

      if (count && count > 0) {
        return NextResponse.json({
          success: true,
          message: `Database already seeded with ${count} records. Skipping.`,
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

    // Batch insert in chunks of 100 (Supabase has request size limits)
    const BATCH_SIZE = 100;
    let inserted = 0;
    const errors: string[] = [];

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

    return NextResponse.json({
      success: errors.length === 0,
      message: `Seeded ${inserted} of ${rows.length} records.`,
      inserted,
      total: rows.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error('Seed error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
