import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface Suspect {
  name?: string;
  age?: number | string | null;
  gender?: string | null;
  address?: string | null;
  contact_phone?: string | null;
  id_type?: string | null;
  id_number?: string | null;
  vehicle_no?: string | null;
}

function getTimeOfDay(dateStr: string): string {
  try {
    const hour = new Date(dateStr).getHours();
    if (hour >= 6 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
  } catch {
    return 'Unknown';
  }
}

function getSeason(dateStr: string): string {
  try {
    const month = new Date(dateStr).getMonth();
    if (month === 11 || month <= 1) return 'Winter';
    if (month >= 2 && month <= 4) return 'Summer';
    if (month >= 5 && month <= 8) return 'Monsoon';
    return 'Post-Monsoon';
  } catch {
    return 'Unknown';
  }
}

function getCrimeCategory(crimeType: string): string {
  const t = crimeType.toLowerCase();
  if (t.includes('theft') || t.includes('robbery') || t.includes('burglary') || t.includes('property') || t.includes('house breaking')) return 'Property';
  if (t.includes('assault') || t.includes('murder') || t.includes('homicide') || t.includes('kidnap') || t.includes('violence')) return 'Violence';
  if (t.includes('cyber') || t.includes('online') || t.includes('hacking')) return 'Cyber';
  if (t.includes('fraud') || t.includes('cheating') || t.includes('financial') || t.includes('forgery')) return 'Financial';
  if (t.includes('traffic') || t.includes('accident')) return 'Traffic';
  return 'General';
}

function parseAgeValue(val: any): number | string | null {
  if (val === undefined || val === null || val === '') return null;
  const strVal = String(val).trim();
  if (strVal.includes('-')) return strVal;
  const num = Number(strVal);
  return isNaN(num) ? strVal : num;
}

function isSameSuspect(
  newSuspect: Suspect,
  existingSuspect: Suspect,
  newDistrict: string,
  existingDistrict: string
): boolean {
  if (!newSuspect.name || !existingSuspect.name) return false;
  
  const nameA = newSuspect.name.toLowerCase().trim();
  const nameB = existingSuspect.name.toLowerCase().trim();
  
  if (nameA !== nameB) return false;
  if (nameA === 'unknown' || nameA === 'none' || nameA === '') return false;

  let matchCount = 0;
  let hasDiffConflict = false;

  // 1. Phone number match
  const phoneA = newSuspect.contact_phone?.trim();
  const phoneB = existingSuspect.contact_phone?.trim();
  if (phoneA && phoneB && phoneA !== 'None' && phoneB !== 'None' && phoneA !== '' && phoneB !== '') {
    if (phoneA === phoneB) {
      matchCount += 2;
    } else {
      hasDiffConflict = true;
    }
  }

  // 2. Government ID match
  const idTypeA = newSuspect.id_type?.toLowerCase().trim();
  const idNumA = newSuspect.id_number?.trim();
  const idTypeB = existingSuspect.id_type?.toLowerCase().trim();
  const idNumB = existingSuspect.id_number?.trim();
  if (idTypeA && idNumA && idTypeB && idNumB && idTypeA === idTypeB && idNumA !== '' && idNumB !== '') {
    if (idNumA === idNumB) {
      matchCount += 3;
    } else {
      hasDiffConflict = true;
    }
  }

  // 3. Age match (within 2 years)
  if (newSuspect.age && existingSuspect.age) {
    const ageA = Number(newSuspect.age);
    const ageB = Number(existingSuspect.age);
    if (!isNaN(ageA) && !isNaN(ageB)) {
      if (Math.abs(ageA - ageB) <= 2) {
        matchCount += 1;
      } else if (Math.abs(ageA - ageB) > 5) {
        hasDiffConflict = true;
      }
    }
  }

  // 4. District/Location match
  if (newDistrict && existingDistrict && newDistrict.toLowerCase().trim() === existingDistrict.toLowerCase().trim()) {
    matchCount += 1;
  }

  // 5. Vehicle number match
  const vehA = newSuspect.vehicle_no?.toLowerCase().trim();
  const vehB = existingSuspect.vehicle_no?.toLowerCase().trim();
  if (vehA && vehB && vehA !== 'none' && vehB !== 'none' && vehA !== '' && vehB !== '') {
    if (vehA === vehB) {
      matchCount += 1.5;
    }
  }

  if (hasDiffConflict) {
    return matchCount >= 3;
  }

  return matchCount >= 1;
}

export async function POST(request: Request) {
  try {
    const rawCase = await request.json();

    const year = new Date().getFullYear();
    const stationCode = rawCase.investigation_data?.police_station_code || 'KA-NEW-RPT';

    let nextNum = 0;
    let nextFirNumber = '';

    if (isSupabaseConfigured()) {
      // Get the count of existing records for this specific police station in the current year
      const pattern = `%/${year}/${stationCode}`;
      const { count, error: countError } = await supabase
        .from('fir_records')
        .select('*', { count: 'exact', head: true })
        .like('fir_number', pattern);

      if (countError) {
        throw new Error(`Failed to query record count: ${countError.message}`);
      }

      nextNum = (count || 0) + 1;
      nextFirNumber = `${String(nextNum).padStart(4, '0')}/${year}/${stationCode}`;
    } else {
      // Generate a fallback simulated FIR number
      nextNum = Math.floor(Math.random() * 1000) + 1;
      nextFirNumber = `${String(nextNum).padStart(4, '0')}/${year}/${stationCode}`;
    }

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

    // --- Dynamic Identity Resolution & Behavioral Analytics ---
    const suspectsInput = rawCase.suspects || [
      {
        name: rawCase.suspect_details?.name,
        age: rawCase.suspect_details?.age,
        gender: rawCase.suspect_details?.gender || null,
        address: rawCase.suspect_details?.address || null,
        contact_phone: rawCase.communication_data?.phone_number || null,
        id_type: rawCase.suspect_details?.id_type || null,
        id_number: rawCase.suspect_details?.id_number || null,
        vehicle_no: rawCase.incident_data?.vehicle_no || null
      }
    ];

    const victimsInput = rawCase.victims || [
      {
        name: rawCase.victim_details?.name,
        age: rawCase.victim_details?.age,
        gender: rawCase.victim_details?.gender || null,
        relation_to_suspect: rawCase.victim_details?.relation_to_suspect || 'N/A'
      }
    ];

    let isRepeatOffender = false;
    let isOrganizedCrime = suspectsInput.length > 1;

    // Fetch existing records for matching
    const hasSuspectsToMatch = suspectsInput.some((s: any) => s.name && s.name !== 'Unknown' && s.name !== 'None');
    let existingRecords: any[] | null = null;
    if (hasSuspectsToMatch && isSupabaseConfigured()) {
      const { data } = await supabase
        .from('fir_records')
        .select('district, data');
      existingRecords = data;
    }

    const resolvedSuspects = suspectsInput.map((sus: any, index: number) => {
      let matchedSuspectId: string | null = null;
      const normalizedSus = {
        name: sus.name,
        age: parseAgeValue(sus.age),
        contact_phone: sus.contact_phone || rawCase.communication_data?.phone_number || null,
        id_type: sus.id_type || null,
        id_number: sus.id_number || null,
        vehicle_no: sus.vehicle_no || rawCase.incident_data?.vehicle_no || null
      };

      if (normalizedSus.name && normalizedSus.name !== 'Unknown' && normalizedSus.name !== 'None' && existingRecords) {
        for (const record of existingRecords) {
          const extSuspects = record.data?.accused_suspects || [];
          const existingDistrict = record.district || '';

          for (const extSuspect of extSuspects) {
            const normalizedExisting = {
              name: extSuspect.name,
              age: extSuspect.age,
              contact_phone: extSuspect.contact_phone || record.data?.communication_data?.phone_number,
              id_type: extSuspect.id_type,
              id_number: extSuspect.id_number,
              vehicle_no: extSuspect.vehicle_no || record.data?.incident_data?.vehicle_no
            };

            if (isSameSuspect(normalizedSus, normalizedExisting, district, existingDistrict)) {
              isRepeatOffender = true;
              matchedSuspectId = extSuspect.suspect_id || null;
              if (record.data?.analytical_tags?.trend_indicators?.is_organized_crime) {
                isOrganizedCrime = true;
              }
              break;
            }
          }
          if (matchedSuspectId) break;
        }
      }

      const suspectId = matchedSuspectId || (suspectsInput.length > 1 ? `SUS-KA-RPT-${nextNum}-${index + 1}` : `SUS-KA-RPT-${nextNum}`);

      return {
        name: sus.name || 'Unknown',
        alias: sus.name && sus.name !== 'Unknown' ? sus.name.split(' ')[0] : null,
        suspect_id: suspectId,
        age: parseAgeValue(sus.age),
        gender: sus.gender || null,
        address: sus.address || null,
        contact_phone: sus.contact_phone || rawCase.communication_data?.phone_number || null,
        id_type: sus.id_type || null,
        id_number: sus.id_number || null,
        prior_record_id: matchedSuspectId || null,
        arrest_status: 'Not Arrested',
        arrest_date: null
      };
    });

    // Direct check for co-accused (more than 1 suspect in this FIR)
    if (rawCase.suspect_details?.co_accused && rawCase.suspect_details.co_accused.length > 0) {
      isOrganizedCrime = true;
    }

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
      investigation_data: {
        evidence_summary: rawCase.investigation_data?.evidence_summary || ''
      },
      complainant: {
        name: rawCase.complainant?.name || rawCase.victim_details?.name || victimsInput[0]?.name || 'Unknown',
        age: parseAgeValue(rawCase.complainant?.age !== undefined && rawCase.complainant?.age !== '' ? rawCase.complainant.age : (rawCase.victim_details?.age || victimsInput[0]?.age)),
        gender: rawCase.complainant?.gender || rawCase.victim_details?.gender || victimsInput[0]?.gender || null,
        address: rawCase.complainant?.address || null,
        contact_phone: rawCase.complainant?.contactPhone || null,
        contact_email: rawCase.complainant?.contactEmail || null,
        id_type: rawCase.complainant?.idType || null,
        id_number: rawCase.complainant?.idNumber || null,
        relationship_to_victim: rawCase.complainant?.relationshipToVictim || null
      },
      accused_suspects: resolvedSuspects,
      victims: victimsInput.map((vic: any) => ({
        name: vic.name || 'Unknown',
        age: parseAgeValue(vic.age),
        gender: vic.gender || null,
        address: null,
        relation_to_accused: vic.relation_to_suspect || 'N/A',
        injury_description: null
      })),
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
      case_status: (() => {
        const postConv = rawCase.legal_outcome?.conviction_status;
        const postCharge = rawCase.legal_outcome?.charge_sheet_filed;
        if (postConv === 'Closed') return 'Closed';
        if (postConv === 'Dispatched') return postCharge ? 'Charge Sheet Filed' : 'Transferred';
        return 'Open';
      })(),
      legal_outcome: {
        charge_sheet_filed: rawCase.legal_outcome?.charge_sheet_filed || false,
        conviction_status: rawCase.legal_outcome?.conviction_status || 'Open',
        legal_stage: rawCase.legal_outcome?.legal_stage || 'Under Investigation'
      },
      linkable_attributes: {
        vehicle_numbers: rawCase.incident_data?.vehicle_no && rawCase.incident_data.vehicle_no !== 'None'
          ? [rawCase.incident_data.vehicle_no] : null,
        device_ids: null,
        phone_numbers: (() => {
          const list = Array.from(new Set(
            [
              rawCase.communication_data?.phone_number,
              ...resolvedSuspects.map((s: any) => s.contact_phone)
            ].filter(Boolean)
          ));
          return list.length > 0 ? list : null;
        })(),
        bank_accounts: null,
        social_media_handles: rawCase.communication_data?.social_handles || null,
        officer_ids_involved: rawCase.investigation_data?.investigating_officer_id
          ? [rawCase.investigation_data.investigating_officer_id] : null,
        station_codes_involved: [stationCode]
      },
      analytical_tags: {
        spatiotemporal: {
          time_of_day: getTimeOfDay(rawCase.case_information?.date_time || new Date().toISOString()),
          day_of_week: new Date(rawCase.case_information?.date_time || new Date()).toLocaleDateString('en-US', { weekday: 'long' }),
          is_weekend: [0, 6].includes(new Date(rawCase.case_information?.date_time || new Date()).getDay()),
          season: getSeason(rawCase.case_information?.date_time || new Date().toISOString())
        },
        trend_indicators: {
          crime_category: getCrimeCategory(crimeType),
          is_repeat_offender: isRepeatOffender,
          is_organized_crime: isOrganizedCrime
        }
      },
      closure_details: null
    };

    // Determine dbCaseStatus
    const dbCaseStatus = newFirRecord.case_status;

    // Insert into Supabase if configured, otherwise simulate success
    let finalRecord = null;
    if (isSupabaseConfigured()) {
      const { data, error: insertError } = await supabase
        .from('fir_records')
        .insert({
          fir_number: nextFirNumber,
          case_status: dbCaseStatus,
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
      finalRecord = data;
    } else {
      console.log('[SUPABASE] Not configured. Simulating successful incident insert.');
      finalRecord = {
        fir_number: nextFirNumber,
        case_status: dbCaseStatus,
        district,
        crime_type: crimeType,
        severity: getSeverity(crimeType),
        latitude: rawCase.geospatial_data?.latitude ? Number(rawCase.geospatial_data.latitude) : 12.9716,
        longitude: rawCase.geospatial_data?.longitude ? Number(rawCase.geospatial_data.longitude) : 77.5946,
        date_time_of_filing: rawCase.case_information?.date_time || new Date().toISOString(),
        data: newFirRecord,
        status_modification: null,
      };
    }

    return NextResponse.json({
      success: true,
      unique_id: nextFirNumber,
      record: finalRecord,
    });
  } catch (err: any) {
    console.error('Failed to report incident:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
