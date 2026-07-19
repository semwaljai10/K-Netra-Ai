// AI-Driven Crime Analytics Platform - Actual Database File (Karnataka Crime Dataset)
// Loaded directly from Karnataka Crime JSON, adapted via dataAdapter
import rawCrimeDataImport from './karnataka_crime_dataset.json';
import { adaptDataset, adaptSupabaseRecord, mapCaseStatusToConviction } from './dataAdapter';

// Re-export raw data for use by syndicateAnalysis module
// The adapter transforms new-schema FIR records into legacy flat format
export const rawCrimeData = adaptDataset(rawCrimeDataImport);
export const rawCrimeDataMap = new Map<string, any>(
  rawCrimeData.map((item: any) => [item.case_information.unique_id, item])
);

export { adaptSupabaseRecord, mapCaseStatusToConviction };

export interface StateInfo {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
}

export interface District {
  id: string;
  stateId: string;
  name: string;
  center: [number, number];
  radius: number;
}

export interface OffenderHistory {
  date: string;
  crime: string;
  location: string;
  status: string;
}

export interface Offender {
  id: string;
  name: string;
  alias: string;
  age: number | string;
  gender?: string;
  status: 'Active' | 'Parole' | 'Incarcerated';
  riskScore: number;
  primaryCrime: string;
  arrestCount: number;
  avatar: string;
  associates: string[];
  history: OffenderHistory[];
  bio: string;
}

export interface Incident {
  id: string;
  type: string;
  districtId: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  timestamp: string;
  coords: [number, number];
  offenderId: string | null;
  status: 'Open' | 'Dispatched' | 'Resolved';
  description: string;
  
  // New details from the new dataset
  firNumber?: string;
  policeStation?: {
    name: string;
    stationCode: string;
    district: string;
    state: string;
  };
  investigatingOfficer?: {
    name: string;
    officerId: string;
    designation: string;
    contact: string | null;
  };
  complainant?: {
    name: string;
    age: number | string | null;
    gender: string | null;
    address: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    idType: string | null;
    idNumber: string | null;
  };
  accusedSuspects?: any[];
  victims?: any[];
  witnesses?: any[];
  evidenceCollected?: any[];
  analyticalTags?: any;
  legal_outcome?: {
    charge_sheet_filed: boolean;
    conviction_status: string;
  };

  // Raw case status from the dataset (Open, Under Investigation, Charge Sheet Filed, Closed, Transferred)
  rawCaseStatus?: string;
  // Status modification tracking
  statusModification?: {
    previousStatus: string;
    newStatus: string;
    remarks: string;
    modifiedAt: string;
    modifiedBy: string;
    modifiedByUserId?: string;
    closureDetails?: {
      closureDate: string;
      closureSubStatus: string;
      reasonForClosure: string;
      closingAuthority: {
        officerName: string;
        designation: string;
        policeStation: string;
        jurisdiction: string;
      };
      outcome?: {
        verdict?: string;
        courtName?: string;
        caseNumberCourt?: string;
        sentenceDuration?: string;
        fineAmount?: string;
        judgmentDate?: string;
      };
      finalRemarks?: string;
    };
  };

  // Raw adapted fields from dataAdapter for PDF generation
  case_information?: any;
  suspect_details?: any;
  victim_details?: any;
  incident_data?: any;
  investigation_data?: any;
  communication_data?: any;
}

export interface Anomaly {
  id: string;
  title: string;
  districtId: string;
  type: string;
  probability: number;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  timestamp: string;
}

export interface SocioEconomicData {
  districtId: string;
  districtName: string;
  unemploymentRate: number;
  avgIncome: number; // in thousands INR monthly
  streetLighting: number; // percentage
  policePatrol: number; // patrol score 1-10
  crimeRate: number; // rate per 100k population
}

export const MOCK_STATES: Record<string, StateInfo> = {
  "KA": { id: "KA", name: "Karnataka", center: [15.3173, 75.7139], zoom: 7 }
};

export const STATE_DISTRICTS_LIST: Record<string, string[]> = {
  "KA": [
    "Bagalkot",
    "Ballari",
    "Belagavi",
    "Bengaluru Rural",
    "Bengaluru Urban",
    "Bidar",
    "Chamarajanagar",
    "Chikkaballapur",
    "Chikkamagaluru",
    "Chitradurga",
    "Dakshina Kannada",
    "Davanagere",
    "Dharwad",
    "Gadag",
    "Hassan",
    "Haveri",
    "Kalaburagi",
    "Kodagu",
    "Kolar",
    "Koppal",
    "Mandya",
    "Mysuru",
    "Raichur",
    "Ramanagara",
    "Shivamogga",
    "Tumakuru",
    "Udupi",
    "Uttara Kannada",
    "Vijayapura",
    "Yadgir",
    "Vijayanagara"
  ]
};

const KARNATAKA_DISTRICT_COORDS = {
  "KA_belagavi": { center: [15.8497, 74.4977], radius: 3200 },
  "KA_dakshina_kannada": { center: [12.9141, 74.8560], radius: 3500 },
  "KA_mysuru": { center: [12.2958, 76.6394], radius: 3400 },
  "KA_dharwad": { center: [15.4589, 75.0078], radius: 3200 },
  "KA_bengaluru_urban": { center: [12.9716, 77.5946], radius: 4500 },
  "KA_vijayapura": { center: [16.8302, 75.7100], radius: 3000 },
  "KA_shivamogga": { center: [13.9299, 75.5681], radius: 3100 },
  "KA_chamarajanagar": { center: [11.9261, 76.9437], radius: 2500 },
  "KA_udupi": { center: [13.3409, 74.7421], radius: 2800 }
};

const buildDistricts = (): Record<string, District> => {
  const districts: Record<string, District> = {};
  
  Object.entries(KARNATAKA_DISTRICT_COORDS).forEach(([id, info]) => {
    const name = id.substring(3).split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    districts[id] = {
      id,
      stateId: "KA",
      name: name === 'Bengaluru Urban' ? 'Bengaluru Urban' : name === 'Dakshina Kannada' ? 'Dakshina Kannada' : name,
      center: info.center as [number, number],
      radius: info.radius
    };
  });
  
  STATE_DISTRICTS_LIST["KA"].forEach((name, index) => {
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const distId = `KA_${safeName}`;
    if (districts[distId]) return;
    
    const angle = (index * 137.5) * (Math.PI / 180);
    const distanceMultiplier = 0.5 + 0.1 * Math.sqrt(index + 1);
    const latOffset = Math.sin(angle) * distanceMultiplier;
    const lonOffset = Math.cos(angle) * distanceMultiplier;
    
    districts[distId] = {
      id: distId,
      stateId: "KA",
      name,
      center: [15.3173 + latOffset, 75.7139 + lonOffset],
      radius: 2000
    };
  });

  return districts;
};

export const MOCK_DISTRICTS = buildDistricts();

// Helper to hash a string to a number deterministically
const getHashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const getDistrictId = (location: string, policeStation: string): string => {
  const locLower = location.toLowerCase();
  const psLower = policeStation.toLowerCase();
  for (const name of STATE_DISTRICTS_LIST["KA"]) {
    const nameLower = name.toLowerCase();
    if (locLower.includes(nameLower) || psLower.includes(nameLower)) {
      return `KA_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }
  }
  if (locLower.includes("bengaluru") || psLower.includes("bengaluru")) {
    if (locLower.includes("rural") || psLower.includes("rural")) return "KA_bengaluru_rural";
    return "KA_bengaluru_urban";
  }
  if (locLower.includes("mangalore") || psLower.includes("mangalore") || locLower.includes("kadri") || psLower.includes("kadri")) {
    return "KA_dakshina_kannada";
  }
  if (locLower.includes("hubballi") || psLower.includes("hubballi")) {
    return "KA_dharwad";
  }
  return "KA_bengaluru_urban";
};

const getSeverity = (crimeType: string): 'Critical' | 'High' | 'Medium' | 'Low' => {
  const type = crimeType.toLowerCase();
  if (type.includes("drug") || type.includes("homicide") || type.includes("murder") || type.includes("critical")) return "Critical";
  if (type.includes("assault") || type.includes("extortion") || type.includes("robbery")) return "High";
  if (type.includes("cyber") || type.includes("theft") || type.includes("fraud")) return "Medium";
  return "Low";
};

const getStatus = (convictionStatus: string): 'Open' | 'Dispatched' | 'Resolved' => {
  const status = convictionStatus.toLowerCase();
  if (status.includes("convicted") || status.includes("acquitted") || status.includes("resolved") || status.includes("closed")) return "Resolved";
  if (status.includes("trial") || status.includes("pending") || status.includes("dispatched") || status.includes("transferred") || status.includes("charge sheet")) return "Dispatched";
  return "Open";
};

// ─── Syndicate Analysis Imports ───────────────────────────────────────────
import {
  buildSyndicateLinks,
  detectSyndicates,
  computeCentrality,
  updateOffenderAssociates,
  SyndicateLink,
  SyndicateCluster,
  CentralityData,
} from './syndicateAnalysis';

// Re-export types for consumers
export type { SyndicateLink, SyndicateCluster, CentralityData };

/**
 * Dynamically processes raw crime data items (flat format after adaptation)
 * to build structured incidents, offenders, and syndicate networks.
 */
export function processRawIncidentsData(rawCases: any[]) {
  const incidentsList: Incident[] = [];
  const offenderMap = new Map<string, {
    name: string;
    incidents: any[];
  }>();

  rawCases.forEach((item: any) => {
    const id = item.case_information.unique_id;
    const type = item.incident_data.crime_type;
    const location = item.case_information.location;
    const policeStation = item.investigation_data.police_station;
    const districtId = getDistrictId(location, policeStation);
    const severity = getSeverity(type);
    const timestamp = item.case_information.date_time;
    const coords: [number, number] = [
      item.geospatial_data.latitude,
      item.geospatial_data.longitude
    ];
    
    const suspects = item.accusedSuspects || (item._source?.all_suspects) || [item.suspect_details];
    
    suspects.forEach((sus: any) => {
      const suspectName = sus?.name;
      if (suspectName && suspectName !== 'None' && suspectName !== 'Unknown') {
        if (!offenderMap.has(suspectName)) {
          offenderMap.set(suspectName, { name: suspectName, incidents: [] });
        }
        offenderMap.get(suspectName)!.incidents.push(item);
      }
    });
    
    const sections = item.case_information.ipc_bns_sections.join(' / ');
    const victimName = item.victim_details.name;
    const victimAge = item.victim_details.age;
    const victimGender = item.victim_details.gender;
    const relation = item.victim_details.relation_to_suspect;
    const officer = item.investigation_data.investigating_officer_id;
    const weapon = item.incident_data.weapon_used;
    const vehicle = item.incident_data.vehicle_no;
    const evidence = item.investigation_data.evidence_summary;
    
    const description = `FIR No. ${item.case_information.fir_no} registered under sections: ${sections}. Incident location: ${location}. Victim: ${victimName} (${victimAge}, ${victimGender}), relation: ${relation}. Officer: ${officer} at ${policeStation}. Weapon: ${weapon}. Vehicle: ${vehicle}. Evidence: ${evidence}.`;
    
    incidentsList.push({
      id,
      type,
      districtId,
      severity: severity as any,
      timestamp,
      coords,
      offenderId: null,
      status: getStatus(item.legal_outcome.conviction_status),
      description,
      
      // Mapped fields from dataAdapter
      firNumber: item.firNumber,
      policeStation: item.policeStation,
      investigatingOfficer: item.investigatingOfficer,
      complainant: item.complainant,
      accusedSuspects: item.accusedSuspects,
      victims: item.victims,
      witnesses: item.witnesses,
      evidenceCollected: item.evidenceCollected,
      analyticalTags: item.analyticalTags,
      rawCaseStatus: item.legal_outcome.conviction_status,
      case_information: item.case_information,
      suspect_details: item.suspect_details,
      victim_details: item.victim_details,
      incident_data: item.incident_data,
      investigation_data: item.investigation_data,
      communication_data: item.communication_data,
      statusModification: item.statusModification || item.status_modification,
      legal_outcome: item.legal_outcome,
    });
  });

  // Map unique suspects to Offenders list
  const offendersList: Offender[] = Array.from(offenderMap.values()).map((off, index) => {
    const id = `OFF-${String(index + 1).padStart(3, '0')}`;
    const name = off.name;
    const alias = name.split(' ')[0];
    const hash = getHashCode(name);
    
    // Try to find age and gender if defined on any raw incident record for this offender
    const incidentWithAge = off.incidents.find((inc: any) => inc.suspect_details?.age != null);
    const rawAge = incidentWithAge ? incidentWithAge.suspect_details.age : null;
    const age = (rawAge != null && isNaN(Number(rawAge))) ? rawAge : (rawAge ? Number(rawAge) : 22 + (hash % 38));
    
    const incidentWithGender = off.incidents.find((inc: any) => inc.suspect_details?.gender != null);
    const gender = incidentWithGender ? incidentWithGender.suspect_details.gender : undefined;

    const primaryCrime = off.incidents[0].incident_data.crime_type;
    const arrestCount = off.incidents.length;
    
    const history: OffenderHistory[] = off.incidents.map((incItem: any) => {
      const districtName = incItem.case_information.location.split(',').pop()?.trim() || "Karnataka";
      return {
        date: incItem.case_information.date_time.substring(0, 10),
        crime: incItem.incident_data.crime_subcategory,
        location: districtName,
        status: incItem.legal_outcome.conviction_status
      };
    });
    
    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const riskScore = Math.min(95, 55 + arrestCount * 5 + (hash % 10));
    const latestOutcome = history[history.length - 1]?.status;
    const status = latestOutcome === 'Convicted'
      ? 'Incarcerated'
      : (latestOutcome === 'Acquitted' ? 'Parole' : 'Active');
    
    const mainLoc = off.incidents[0].case_information.location.split(',').pop()?.trim() || "Karnataka";
    const bio = `Tracked in connection with syndicates operating in ${mainLoc}. Modus operandi highlights involvement in ${primaryCrime.toLowerCase()} networks.`;
    
    return {
      id,
      name,
      alias,
      age,
      gender,
      status,
      riskScore,
      primaryCrime,
      arrestCount,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      associates: [],
      history,
      bio
    };
  });

  const links = buildSyndicateLinks(offendersList, rawCases);
  const updatedOffenders = updateOffenderAssociates(offendersList, links);
  
  // Replace offendersList entries with updated associates
  updatedOffenders.forEach((updated, idx) => {
    offendersList[idx].associates = updated.associates;
  });
  
  // Update offenderId inside incidents list
  const nameToIdMap = new Map<string, string>();
  offendersList.forEach(off => nameToIdMap.set(off.name, off.id));
  
  const rawCasesMap = new Map<string, any>();
  rawCases.forEach(item => {
    const uid = item.case_information?.unique_id;
    if (uid) rawCasesMap.set(uid, item);
  });

  incidentsList.forEach(inc => {
    const originalRecord = rawCasesMap.get(inc.id);
    if (originalRecord) {
      const sName = originalRecord.suspect_details?.name || originalRecord.accusedSuspects?.[0]?.name || originalRecord.accused_suspects?.[0]?.name;
      if (sName && sName !== 'None' && sName !== 'Unknown') {
        inc.offenderId = nameToIdMap.get(sName) || null;
      }
    }
  });

  return {
    incidents: incidentsList,
    offenders: offendersList,
    syndicateLinks: links,
    syndicateClusters: detectSyndicates(offendersList, links),
    centralityMap: computeCentrality(offendersList, links)
  };
}


export const MOCK_SOCIO_ECONOMIC: SocioEconomicData[] = [
  {
    "districtId": "KA_bagalkot",
    "districtName": "Bagalkot",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_ballari",
    "districtName": "Ballari",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_belagavi",
    "districtName": "Belagavi",
    "unemploymentRate": 9.9,
    "avgIncome": 85,
    "streetLighting": 69,
    "policePatrol": 5,
    "crimeRate": 37
  },
  {
    "districtId": "KA_bengaluru_rural",
    "districtName": "Bengaluru Rural",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_bengaluru_urban",
    "districtName": "Bengaluru Urban",
    "unemploymentRate": 18,
    "avgIncome": 30,
    "streetLighting": 45,
    "policePatrol": 2,
    "crimeRate": 78.3
  },
  {
    "districtId": "KA_bidar",
    "districtName": "Bidar",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_chamarajanagar",
    "districtName": "Chamarajanagar",
    "unemploymentRate": 7.2,
    "avgIncome": 104,
    "streetLighting": 80,
    "policePatrol": 7,
    "crimeRate": 23.3
  },
  {
    "districtId": "KA_chikkaballapur",
    "districtName": "Chikkaballapur",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_chikkamagaluru",
    "districtName": "Chikkamagaluru",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_chitradurga",
    "districtName": "Chitradurga",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_dakshina_kannada",
    "districtName": "Dakshina Kannada",
    "unemploymentRate": 11.7,
    "avgIncome": 73,
    "streetLighting": 62,
    "policePatrol": 4,
    "crimeRate": 46
  },
  {
    "districtId": "KA_davanagere",
    "districtName": "Davanagere",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_dharwad",
    "districtName": "Dharwad",
    "unemploymentRate": 7,
    "avgIncome": 106,
    "streetLighting": 81,
    "policePatrol": 7,
    "crimeRate": 22.3
  },
  {
    "districtId": "KA_gadag",
    "districtName": "Gadag",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_hassan",
    "districtName": "Hassan",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_haveri",
    "districtName": "Haveri",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_kalaburagi",
    "districtName": "Kalaburagi",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_kodagu",
    "districtName": "Kodagu",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_kolar",
    "districtName": "Kolar",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_koppal",
    "districtName": "Koppal",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_mandya",
    "districtName": "Mandya",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_mysuru",
    "districtName": "Mysuru",
    "unemploymentRate": 7.8,
    "avgIncome": 100,
    "streetLighting": 78,
    "policePatrol": 6,
    "crimeRate": 26.5
  },
  {
    "districtId": "KA_raichur",
    "districtName": "Raichur",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_ramanagara",
    "districtName": "Ramanagara",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_shivamogga",
    "districtName": "Shivamogga",
    "unemploymentRate": 6.8,
    "avgIncome": 107,
    "streetLighting": 82,
    "policePatrol": 7,
    "crimeRate": 21.8
  },
  {
    "districtId": "KA_tumakuru",
    "districtName": "Tumakuru",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_udupi",
    "districtName": "Udupi",
    "unemploymentRate": 6.3,
    "avgIncome": 110,
    "streetLighting": 84,
    "policePatrol": 7,
    "crimeRate": 19.3
  },
  {
    "districtId": "KA_uttara_kannada",
    "districtName": "Uttara Kannada",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_vijayapura",
    "districtName": "Vijayapura",
    "unemploymentRate": 6.7,
    "avgIncome": 108,
    "streetLighting": 82,
    "policePatrol": 7,
    "crimeRate": 20.8
  },
  {
    "districtId": "KA_yadgir",
    "districtName": "Yadgir",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  },
  {
    "districtId": "KA_vijayanagara",
    "districtName": "Vijayanagara",
    "unemploymentRate": 3.5,
    "avgIncome": 130,
    "streetLighting": 95,
    "policePatrol": 9,
    "crimeRate": 5
  }
];

export const MOCK_ANOMALIES: Anomaly[] = [
  {
    "id": "ALRT-KA-101",
    "title": "Cybercrime Spike Detected",
    "districtId": "KA_bengaluru_urban",
    "type": "Spike Anomaly",
    "probability": 92.5,
    "description": "A significant increase in high-severity Cybercrime activities has been detected in Bengaluru Urban over the past 30 days. IP routing matches known local phishing groups.",
    "severity": "Critical",
    "timestamp": "2026-06-11T08:00:00Z"
  },
  {
    "id": "ALRT-KA-102",
    "title": "Narcotics Trafficking Surge",
    "districtId": "KA_dakshina_kannada",
    "type": "Pattern Matching",
    "probability": 86.4,
    "description": "Algorithmic analysis of local arrest profiles indicate a drug distribution pipeline expansion near major highways in Dakshina Kannada.",
    "severity": "High",
    "timestamp": "2026-06-10T14:30:00Z"
  },
  {
    "id": "ALRT-KA-103",
    "title": "Vehicle Larceny Wave",
    "districtId": "KA_belagavi",
    "type": "Unusual Volume",
    "probability": 78.1,
    "description": "Unusual concentration of two-wheeler thefts reported in public parking zones inside Belagavi. Patrol presence optimization suggested.",
    "severity": "Medium",
    "timestamp": "2026-06-09T17:15:00Z"
  }
];

export const AI_SIMULATION_WEIGHTS = {
  unemployment: 1.85,
  income: -0.45,
  lighting: -0.95,
  patrol: -1.40
};
