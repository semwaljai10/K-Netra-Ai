// dataAdapter.ts — Transforms new Karnataka FIR dataset schema into the
// legacy flat schema that the rest of the application consumes.
//
// New dataset structure:  { metadata: {...}, fir_records: [...] }
// Old (expected) structure:  [ { case_information, suspect_details, victim_details, ... }, ... ]

/**
 * Accepts the raw JSON import (which may be the new { metadata, fir_records }
 * object OR the legacy flat array) and returns a flat array in the legacy
 * schema format.
 */
export function adaptDataset(raw: any): any[] {
  // If the import is already a flat array (legacy format), return as-is
  if (Array.isArray(raw)) {
    return raw;
  }

  // New format: extract fir_records array
  const records: any[] = raw?.fir_records ?? [];

  return records.map(adaptRecord);
}

/**
 * Transforms a Supabase row (which has a `data` JSONB column containing the
 * full FIR record, plus extracted indexed columns) into the legacy flat format.
 */
export function adaptSupabaseRecord(row: any): any {
  // The `data` column contains the full FIR record in the original schema
  const fir = row.data;
  if (!fir) return null;

  // Override case_status from the indexed column (it's the source of truth
  // since status updates modify it directly)
  fir.case_status = row.case_status ?? fir.case_status ?? 'Open';

  const adapted = adaptRecord(fir);
  if (adapted) {
    adapted.db_id = row.id;
  }

  // Preserve status modification details if they exist in the database row
  if (row.status_modification) {
    adapted.statusModification = {
      previousStatus: row.status_modification.previousStatus || '',
      newStatus: row.status_modification.newStatus || '',
      remarks: row.status_modification.remarks || '',
      modifiedAt: row.status_modification.modifiedAt || '',
      modifiedBy: row.status_modification.modifiedBy || '',
      modifiedByUserId: row.status_modification.modifiedByUserId || '',
      closureDetails: row.status_modification.closureDetails || undefined
    };
  }

  return adapted;
}

/**
 * Transforms a single new-schema FIR record into the legacy flat format.
 */
export function adaptRecord(fir: any): any {
  const primarySuspect = fir.accused_suspects?.[0] ?? {};
  const primaryVictim = fir.victims?.[0] ?? {};

  // Build a composite location string (address + district)
  const locParts = [
    fir.incident_location?.address,
    fir.incident_location?.district,
  ].filter(Boolean);
  const location = locParts.join(', ') || 'Karnataka';

  // Collect IPC + BNS sections into a single array
  const ipcSections: string[] = fir.crime_classification?.ipc_sections ?? [];
  const bnsSections: string[] = fir.crime_classification?.bns_sections ?? [];
  const allSections = [...ipcSections, ...bnsSections].filter(Boolean);

  // Join evidence descriptions
  const evidenceDescriptions = (fir.evidence_collected ?? [])
    .map((e: any) => e.description)
    .filter(Boolean)
    .join('; ') || fir.investigation_data?.evidence_summary || fir.incident_description?.narrative || 'No evidence summary available.';

  // Map case_status to a conviction-like status the app understands
  const caseStatus = fir.case_status ?? 'Open';
  const convictionStatus = fir.legal_outcome?.conviction_status ?? mapCaseStatusToConviction(caseStatus);
  const chargeSheetFiled = fir.legal_outcome?.charge_sheet_filed ?? (caseStatus === 'Charge Sheet Filed');

  // Extract vehicle number from linkable attributes
  const vehicleNumbers = fir.linkable_attributes?.vehicle_numbers ?? [];
  const vehicleNo = vehicleNumbers.length > 0 ? vehicleNumbers[0] : 'None';

  // Extract communication data from suspect + linkable attributes
  const phone = primarySuspect.contact_phone ?? '+91-0000000000';
  const email = fir.complainant?.contact_email ?? null;
  const socialHandles = fir.linkable_attributes?.social_media_handles ?? [];

  return {
    case_information: {
      unique_id: fir.fir_number ?? `UNKNOWN-${Math.random().toString(36).slice(2, 8)}`,
      fir_no: fir.fir_number ?? 'N/A',
      ipc_bns_sections: allSections.length > 0 ? allSections : ['N/A'],
      date_time: fir.date_time_of_filing ?? fir.incident_description?.date_time_of_incident ?? new Date().toISOString(),
      location,
    },
    suspect_details: {
      name: primarySuspect.name ?? 'Unknown',
      address: primarySuspect.address ?? 'Not Available',
      age: primarySuspect.age ?? null,
      gender: primarySuspect.gender ?? null,
    },
    victim_details: {
      name: primaryVictim.name ?? 'Unknown',
      age: primaryVictim.age ?? null,
      gender: primaryVictim.gender ?? null,
      relation_to_suspect: primaryVictim.relation_to_accused ?? 'N/A',
    },
    incident_data: {
      crime_type: fir.crime_classification?.crime_type ?? 'Unknown',
      crime_subcategory: fir.crime_classification?.crime_code ?? 'UNKNOWN',
      weapon_used: fir.incident_description?.weapon_used ?? 'None',
      vehicle_no: vehicleNo,
    },
    investigation_data: {
      investigating_officer_id: fir.investigating_officer?.officer_id ?? 'N/A',
      police_station: fir.police_station?.name ?? 'N/A',
      evidence_summary: evidenceDescriptions,
    },
    geospatial_data: {
      latitude: fir.incident_location?.coordinates?.latitude ?? 12.9716,
      longitude: fir.incident_location?.coordinates?.longitude ?? 77.5946,
    },
    communication_data: {
      phone_number: phone,
      email: email ?? 'unknown@k-netra.gov.in',
      social_handles: socialHandles,
    },
    legal_outcome: {
      charge_sheet_filed: chargeSheetFiled,
      conviction_status: convictionStatus,
      legal_stage: fir.legal_outcome?.legal_stage || caseStatus,
    },
    // Preserve new-schema enrichments for potential future use
    _source: {
      all_suspects: fir.accused_suspects ?? [],
      all_victims: fir.victims ?? [],
      witnesses: fir.witnesses ?? [],
      analytical_tags: fir.analytical_tags ?? null,
      linkable_attributes: fir.linkable_attributes ?? null,
      closure_details: fir.closure_details ?? null,
    },
    // Detailed fields from the new dataset mapped and normalized to camelCase
    firNumber: fir.fir_number,
    policeStation: fir.police_station ? {
      name: fir.police_station.name,
      stationCode: fir.police_station.station_code || fir.police_station.stationCode,
      district: fir.police_station.district,
      state: fir.police_station.state,
    } : undefined,
    investigatingOfficer: fir.investigating_officer ? {
      name: fir.investigating_officer.name,
      officerId: fir.investigating_officer.officer_id || fir.investigating_officer.officerId,
      designation: fir.investigating_officer.designation,
      contact: fir.investigating_officer.contact,
    } : undefined,
    complainant: fir.complainant ? {
      name: fir.complainant.name,
      age: fir.complainant.age,
      gender: fir.complainant.gender,
      address: fir.complainant.address,
      contactPhone: fir.complainant.contact_phone || fir.complainant.contactPhone,
      contactEmail: fir.complainant.contact_email || fir.complainant.contactEmail,
      idType: fir.complainant.id_type || fir.complainant.idType,
      idNumber: fir.complainant.id_number || fir.complainant.idNumber,
      relationshipToVictim: fir.complainant.relationship_to_victim || fir.complainant.relationshipToVictim || null,
    } : undefined,
    accusedSuspects: fir.accused_suspects ?? [],
    victims: fir.victims ?? [],
    witnesses: fir.witnesses ?? [],
    evidenceCollected: fir.evidence_collected ?? [],
    analyticalTags: fir.analytical_tags,
  };
}

/**
 * Maps the new dataset's `case_status` values to the legacy
 * `conviction_status` values the app uses for status classification.
 */
export function mapCaseStatusToConviction(status: string): string {
  switch (status) {
    case 'Charge Sheet Filed':
      return 'Trial Pending';
    case 'Closed':
      return 'Acquitted';
    case 'Transferred':
      return 'Transferred';
    case 'Under Investigation':
      return 'Under Investigation';
    case 'Open':
    default:
      return 'Open';
  }
}
