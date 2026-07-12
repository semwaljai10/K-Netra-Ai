import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * PATCH /api/incidents/[id] — Update an incident's status in Supabase.
 * Expects body: { case_status, remarks?, modifiedBy?, modifiedByUserId?, closureDetails?, chargeSheetFiled? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      case_status,
      remarks,
      modifiedBy,
      modifiedByUserId,
      closureDetails,
      chargeSheetFiled,
    } = body;

    if (!case_status) {
      return NextResponse.json({ error: 'case_status is required' }, { status: 400 });
    }

    // Build the status modification record
    const statusMod = {
      previousStatus: null as string | null,
      newStatus: case_status,
      remarks: remarks || '',
      modifiedAt: new Date().toISOString(),
      modifiedBy: modifiedBy || 'Unknown',
      modifiedByUserId: modifiedByUserId || '',
      closureDetails: closureDetails || null,
      chargeSheetFiled: chargeSheetFiled || false,
    };

    // Get current record to capture previous status and update JSONB data
    const { data: currentRecord, error: fetchError } = await supabase
      .from('fir_records')
      .select('case_status, data')
      .eq('fir_number', id)
      .single();

    if (fetchError) {
      console.error('Fetch for update error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 404 });
    }

    statusMod.previousStatus = currentRecord.case_status;

    // Update the case_status inside the JSONB data column too
    const updatedData = { ...currentRecord.data, case_status };

    // Determine severity if crime type present
    const crimeType = currentRecord.data?.crime_classification?.crime_type || '';
    const getSeverity = (type: string): string => {
      const t = type.toLowerCase();
      if (t.includes('murder') || t.includes('homicide') || t.includes('drug')) return 'Critical';
      if (t.includes('assault') || t.includes('robbery') || t.includes('sexual') || t.includes('kidnap')) return 'High';
      if (t.includes('cyber') || t.includes('theft') || t.includes('fraud') || t.includes('cheating')) return 'Medium';
      return 'Low';
    };

    const { data, error: updateError } = await supabase
      .from('fir_records')
      .update({
        case_status,
        severity: getSeverity(crimeType),
        data: updatedData,
        status_modification: statusMod,
      })
      .eq('fir_number', id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      record: data,
    });
  } catch (err: any) {
    console.error('Update incident error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET /api/incidents/[id] — Fetch a single incident by FIR number.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('fir_records')
      .select('*')
      .eq('fir_number', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ success: true, record: data });
  } catch (err: any) {
    console.error('Fetch incident error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
