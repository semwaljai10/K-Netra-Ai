import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, withTimeout } from '@/lib/supabase';

/**
 * GET /api/incidents — Fetch all incidents from Supabase.
 * Supports optional query params for filtering:
 *   ?district=...&status=...&severity=...&crime_type=...
 */
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        records: [],
        count: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const crimeType = searchParams.get('crime_type');

    let allData: any[] = [];
    let from = 0;
    const chunkSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('fir_records')
        .select('*')
        .order('date_time_of_filing', { ascending: false })
        .range(from, from + chunkSize - 1);

      if (district && district !== 'ALL') {
        query = query.eq('district', district);
      }
      if (status && status !== 'ALL') {
        query = query.eq('case_status', status);
      }
      if (severity && severity !== 'ALL') {
        query = query.eq('severity', severity);
      }
      if (crimeType && crimeType !== 'ALL') {
        query = query.eq('crime_type', crimeType);
      }

      const { data, error } = await withTimeout(query, 5000);

      if (error) {
        console.error('Supabase fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < chunkSize) {
          hasMore = false;
        } else {
          from += chunkSize;
        }
      } else {
        hasMore = false;
      }
    }

    return NextResponse.json({
      success: true,
      records: allData,
      count: allData.length,
    });
  } catch (err: any) {
    console.error('Fetch incidents error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
