import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const rawCase = await request.json();

    const year = new Date().getFullYear();
    const stationCode = rawCase.investigation_data?.police_station_code || 'KA-NEW-RPT';

    // Get the count of existing records for this specific police station in the current year
    const pattern = `%/${year}/${stationCode}`;
    const { count, error: countError } = await supabase
      .from('fir_records')
      .select('*', { count: 'exact', head: true })
      .like('fir_number', pattern);

    if (countError) {
      throw new Error(`Failed to query record count: ${countError.message}`);
    }

    const nextNum = (count || 0) + 1;
    const nextFirNumber = `${String(nextNum).padStart(4, '0')}/${year}/${stationCode}`;

    // Build new FIR record in the dataset schema
    const locationParts = (rawCase.case_information?.location || 'Karnataka').split(',').map((s: string) => s.trim());
    const district = locationParts[locationParts.length - 1] || 'Karnataka';
    const address = locationParts.slice(0, -1).join(', ') || locationParts[0] || 'Karnataka';
    const crimeType = rawCase.incident_data?.crime_type || 'Unknown';

    // Compute severity
    const getSeverity = (type: string): string => {
      const t = type.toLowerCase();
      if (t.includes('murder') || t.includes('homicide') || t.includes('drug')) return 'Critical';
      if (t.includes('assault') || t.includes('robbery') || t.includes('sexual') || t.includes('kidnap')) return 'High';
      if (t.includes('cyber') || t.includes('theft') || t.includes('fraud') || t.includes('cheating')) return 'Medium';
      return 'Low';
    };

    const newFirRecord = {
      fir_number: nextFirNumber,
      date_time_of_filing: rawCase.case_information?.date_time || new Date().toISOString(),
      police_station: {
        name: rawCase.investigation_data?.police_station || 'N/A',
        station_code: rawCase.investigation_data?.police_station_code || 'KA-NEW-RPT',
        district,
        state: 'Karnataka'
      },
      investigating_officer: {
        name: rawCase.investigation_data?.investigating_officer_name || 'Auto-Assigned',
        officer_id: rawCase.investigation_data?.investigating_officer_id || 'N/A',
        designation: rawCase.investigation_data?.investigating_officer_rank || 'Sub-Inspector of Police (SI)',
        contact: null
      },
      complainant: {
        name: rawCase.victim_details?.name || 'Unknown',
        age: rawCase.victim_details?.age ? Number(rawCase.victim_details.age) : null,
        gender: rawCase.victim_details?.gender || null,
        address: null,
        contact_phone: null,
        contact_email: null,
        id_type: null,
        id_number: null
      },
      accused_suspects: [
        {
          name: rawCase.suspect_details?.name || 'Unknown',
          alias: null,
          suspect_id: `SUS-KA-RPT-${nextNum}`,
          age: rawCase.suspect_details?.age ? Number(rawCase.suspect_details.age) : null,
          gender: rawCase.suspect_details?.gender || null,
          address: rawCase.suspect_details?.address || null,
          contact_phone: rawCase.communication_data?.phone_number || null,
          id_type: null,
          id_number: null,
          prior_record_id: null,
          arrest_status: 'Not Arrested',
          arrest_date: null
        }
      ],
      victims: [
        {
          name: rawCase.victim_details?.name || 'Unknown',
          age: rawCase.victim_details?.age ? Number(rawCase.victim_details.age) : null,
          gender: rawCase.victim_details?.gender || null,
          address: null,
          relation_to_accused: rawCase.victim_details?.relation_to_suspect || 'N/A',
          injury_description: null
        }
      ],
      crime_classification: {
        ipc_sections: rawCase.case_information?.ipc_bns_sections || ['N/A'],
        bns_sections: null,
        other_acts: null,
        crime_type: crimeType,
        crime_code: rawCase.incident_data?.crime_subcategory || 'UNKNOWN'
      },
      incident_description: {
        narrative: rawCase.investigation_data?.evidence_summary || 'Report filed via K-NETRA system.',
        modus_operandi: null,
        weapon_used: rawCase.incident_data?.weapon_used || 'None',
        date_time_of_incident: rawCase.case_information?.date_time || new Date().toISOString(),
        date_time_reported: new Date().toISOString()
      },
      incident_location: {
        address,
        landmark: null,
        district,
        state: 'Karnataka',
        pincode: null,
        coordinates: {
          latitude: rawCase.geospatial_data?.latitude ? Number(rawCase.geospatial_data.latitude) : 12.9716,
          longitude: rawCase.geospatial_data?.longitude ? Number(rawCase.geospatial_data.longitude) : 77.5946
        }
      },
      witnesses: [],
      evidence_collected: [],
      case_status: 'Open',
      linkable_attributes: {
        vehicle_numbers: rawCase.incident_data?.vehicle_no && rawCase.incident_data.vehicle_no !== 'None'
          ? [rawCase.incident_data.vehicle_no] : null,
        device_ids: null,
        phone_numbers: rawCase.communication_data?.phone_number
          ? [rawCase.communication_data.phone_number] : null,
        bank_accounts: null,
        social_media_handles: rawCase.communication_data?.social_handles || null,
        officer_ids_involved: rawCase.investigation_data?.investigating_officer_id
          ? [rawCase.investigation_data.investigating_officer_id] : null,
        station_codes_involved: [stationCode]
      },
      analytical_tags: {
        spatiotemporal: {
          time_of_day: 'Unknown',
          day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          is_weekend: [0, 6].includes(new Date().getDay()),
          season: 'Unknown'
        },
        trend_indicators: {
          crime_category: 'Unknown',
          is_repeat_offender: false,
          is_organized_crime: false
        }
      },
      closure_details: null
    };

    // Insert into Supabase
    const { data, error: insertError } = await supabase
      .from('fir_records')
      .insert({
        fir_number: nextFirNumber,
        case_status: 'Open',
        district,
        crime_type: crimeType,
        severity: getSeverity(crimeType),
        latitude: rawCase.geospatial_data?.latitude ? Number(rawCase.geospatial_data.latitude) : 12.9716,
        longitude: rawCase.geospatial_data?.longitude ? Number(rawCase.geospatial_data.longitude) : 77.5946,
        date_time_of_filing: rawCase.case_information?.date_time || new Date().toISOString(),
        data: newFirRecord,
        status_modification: null,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Supabase insert failed: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      unique_id: nextFirNumber,
      record: data,
    });
  } catch (err: any) {
    console.error('Failed to report incident:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
