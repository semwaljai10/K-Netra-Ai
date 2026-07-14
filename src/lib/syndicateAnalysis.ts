// Syndicate Analysis Engine — Network & Link Analysis of Criminals
// Multi-signal linking, community detection, and centrality analysis

import { Offender } from './data';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface SyndicateLink {
  source: string;       // offender ID
  target: string;       // offender ID
  score: number;        // cumulative link strength
  signals: string[];    // which evidence signals matched
  linkType: 'strong' | 'moderate' | 'weak';
}

export interface SyndicateCluster {
  id: string;
  name: string;
  members: string[];       // offender IDs
  primaryCrimeType: string;
  avgRiskScore: number;
  color: string;
  hubNode: string;         // offender ID with highest degree within cluster
  geographicFocus: string;
}

export interface CentralityData {
  degree: number;
  betweenness: number;
  normalizedDegree: number;
}

// ─── SIGNAL WEIGHTS ──────────────────────────────────────────────────────────

const SIGNAL_WEIGHTS: Record<string, number> = {
  'Shared Phone':           0.35,
  'Shared Email':           0.20,
  'Shared Social Handle':   0.25,
  'Geo-Temporal Proximity': 0.25,
  'Shared Vehicle':         0.30,
  'Co-accused (same FIR)':  0.40,
  'Same Subcategory+Area':  0.15,
  'Shared IO':              0.10,
};

const LINK_THRESHOLD = 0.40;
const MIN_SIGNALS = 2; // require at least 2 corroborating signals

// Generic email domains that should not count as shared-email signal
const GENERIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'yahoo.in', 'hotmail.com', 'outlook.com',
  'rediffmail.com', 'protonmail.com', 'mail.com', 'aol.com', 'icloud.com',
  'yandex.com', 'zoho.com'
]);

// ─── SYNDICATE CLUSTER COLORS ────────────────────────────────────────────────

const CLUSTER_PALETTE = [
  '#6366f1', // indigo
  '#f43f5e', // rose
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#10b981', // emerald
  '#ef4444', // red
  '#3b82f6', // blue
  '#a855f7', // purple
  '#84cc16', // lime
  '#d946ef', // fuchsia
  '#0ea5e9', // sky
  '#f97316', // orange
  '#22d3ee', // light cyan
];

// ─── HAVERSINE DISTANCE (km) ─────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── BUILD SYNDICATE LINKS ──────────────────────────────────────────────────

export function buildSyndicateLinks(
  offenders: Offender[],
  rawCrimeData: any[]
): SyndicateLink[] {
  // Pre-index: map offender name → raw incident records
  const nameToIncidents = new Map<string, any[]>();
  rawCrimeData.forEach((item: any) => {
    const suspects = item.accusedSuspects || item.accused_suspects || (item._source?.all_suspects) || [item.suspect_details];
    suspects.forEach((sus: any) => {
      const name = sus?.name;
      if (name && name !== 'None' && name !== 'Unknown') {
        if (!nameToIncidents.has(name)) nameToIncidents.set(name, []);
        const list = nameToIncidents.get(name)!;
        if (!list.includes(item)) {
          list.push(item);
        }
      }
    });
  });

  // Pre-index: map offender ID → offender name
  const idToName = new Map<string, string>();
  offenders.forEach(o => idToName.set(o.id, o.name));

  // Pre-index: FIR number → list of offender IDs involved
  const firToOffenders = new Map<string, string[]>();
  offenders.forEach(o => {
    const incidents = nameToIncidents.get(o.name) || [];
    incidents.forEach((inc: any) => {
      const fir = inc.case_information?.fir_no;
      if (fir) {
        if (!firToOffenders.has(fir)) firToOffenders.set(fir, []);
        const list = firToOffenders.get(fir)!;
        if (!list.includes(o.id)) list.push(o.id);
      }
    });
  });

  // Pre-index: vehicle_no → list of offender IDs
  const vehicleToOffenders = new Map<string, string[]>();
  offenders.forEach(o => {
    const incidents = nameToIncidents.get(o.name) || [];
    incidents.forEach((inc: any) => {
      const vehicle = inc.incident_data?.vehicle_no;
      if (vehicle && vehicle !== 'None' && vehicle !== 'N/A') {
        if (!vehicleToOffenders.has(vehicle)) vehicleToOffenders.set(vehicle, []);
        const list = vehicleToOffenders.get(vehicle)!;
        if (!list.includes(o.id)) list.push(o.id);
      }
    });
  });

  // Pre-compute per-offender communication and geo/temporal data
  interface OffenderSignalData {
    phones: Set<string>;
    emails: Set<string>;
    emailDomains: Set<string>;
    socialHandles: Set<string>;
    ios: Set<string>;
    geoTemporalEvents: { lat: number; lon: number; time: number; district: string; subcategory: string }[];
  }

  const offenderSignals = new Map<string, OffenderSignalData>();

  offenders.forEach(o => {
    const incidents = nameToIncidents.get(o.name) || [];
    const data: OffenderSignalData = {
      phones: new Set(),
      emails: new Set(),
      emailDomains: new Set(),
      socialHandles: new Set(),
      ios: new Set(),
      geoTemporalEvents: [],
    };

    incidents.forEach((inc: any) => {
      // Communication
      const phone = inc.communication_data?.phone_number;
      if (phone && phone !== 'None') data.phones.add(phone);

      const email = inc.communication_data?.email;
      if (email && email !== 'None') {
        data.emails.add(email.toLowerCase());
        const domain = email.split('@')[1]?.toLowerCase();
        if (domain && !GENERIC_EMAIL_DOMAINS.has(domain)) {
          data.emailDomains.add(domain);
        }
      }

      const handles = inc.communication_data?.social_handles;
      if (Array.isArray(handles)) {
        handles.forEach((h: string) => data.socialHandles.add(h.toLowerCase()));
      }

      // Investigation
      const io = inc.investigation_data?.investigating_officer_id;
      if (io) data.ios.add(io);

      // Geo-temporal
      const lat = inc.geospatial_data?.latitude;
      const lon = inc.geospatial_data?.longitude;
      const timeStr = inc.case_information?.date_time;
      const location = inc.case_information?.location || '';
      const subcategory = inc.incident_data?.crime_subcategory || '';

      // Extract district from location (last segment after comma)
      const district = location.split(',').pop()?.trim().toLowerCase() || '';

      if (lat != null && lon != null && timeStr) {
        data.geoTemporalEvents.push({
          lat, lon,
          time: new Date(timeStr).getTime(),
          district,
          subcategory: subcategory.toLowerCase()
        });
      }
    });

    offenderSignals.set(o.id, data);
  });

  // ─── CANDIDATE SELECTION (O(N) indexes / sliding windows) ──────────────────
  const candidatePairs = new Set<string>();

  const addCandidate = (id1: string, id2: string) => {
    if (id1 === id2) return;
    const key = id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
    candidatePairs.add(key);
  };

  // Index 1: Phones
  const phoneToIds = new Map<string, string[]>();
  offenderSignals.forEach((data, id) => {
    data.phones.forEach(phone => {
      if (!phoneToIds.has(phone)) phoneToIds.set(phone, []);
      phoneToIds.get(phone)!.push(id);
    });
  });
  phoneToIds.forEach(ids => {
    if (ids.length > 1) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          addCandidate(ids[i], ids[j]);
        }
      }
    }
  });

  // Index 2: Emails
  const emailToIds = new Map<string, string[]>();
  offenderSignals.forEach((data, id) => {
    data.emails.forEach(email => {
      if (!emailToIds.has(email)) emailToIds.set(email, []);
      emailToIds.get(email)!.push(id);
    });
  });
  emailToIds.forEach(ids => {
    if (ids.length > 1) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          addCandidate(ids[i], ids[j]);
        }
      }
    }
  });

  // Index 3: Email Domains (Custom domains only)
  const domainToIds = new Map<string, string[]>();
  offenderSignals.forEach((data, id) => {
    data.emailDomains.forEach(domain => {
      if (!domainToIds.has(domain)) domainToIds.set(domain, []);
      domainToIds.get(domain)!.push(id);
    });
  });
  domainToIds.forEach(ids => {
    if (ids.length > 1) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          addCandidate(ids[i], ids[j]);
        }
      }
    }
  });

  // Index 4: Social Handles
  const handleToIds = new Map<string, string[]>();
  offenderSignals.forEach((data, id) => {
    data.socialHandles.forEach(handle => {
      if (!handleToIds.has(handle)) handleToIds.set(handle, []);
      handleToIds.get(handle)!.push(id);
    });
  });
  handleToIds.forEach(ids => {
    if (ids.length > 1) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          addCandidate(ids[i], ids[j]);
        }
      }
    }
  });

  // Index 5: Vehicles (from vehicleToOffenders map)
  vehicleToOffenders.forEach(ids => {
    if (ids.length > 1) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          addCandidate(ids[i], ids[j]);
        }
      }
    }
  });

  // Index 6: FIRs (from firToOffenders map)
  firToOffenders.forEach(ids => {
    if (ids.length > 1) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          addCandidate(ids[i], ids[j]);
        }
      }
    }
  });

  // Index 7: Investigating Officers
  const ioToIds = new Map<string, string[]>();
  offenderSignals.forEach((data, id) => {
    data.ios.forEach(io => {
      if (!ioToIds.has(io)) ioToIds.set(io, []);
      ioToIds.get(io)!.push(id);
    });
  });
  ioToIds.forEach(ids => {
    if (ids.length > 1) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          addCandidate(ids[i], ids[j]);
        }
      }
    }
  });

  // Index 8: Geo-Temporal sliding window (within 48 hours and 5km)
  interface FlatGeoEvent {
    offenderId: string;
    lat: number;
    lon: number;
    time: number;
  }
  const geoEvents: FlatGeoEvent[] = [];
  offenderSignals.forEach((data, id) => {
    data.geoTemporalEvents.forEach(e => {
      geoEvents.push({
        offenderId: id,
        lat: e.lat,
        lon: e.lon,
        time: e.time
      });
    });
  });
  
  // Sort geoEvents chronologically
  geoEvents.sort((a, b) => a.time - b.time);
  
  // Sliding window over time
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;
  for (let i = 0; i < geoEvents.length; i++) {
    const e1 = geoEvents[i];
    for (let j = i + 1; j < geoEvents.length; j++) {
      const e2 = geoEvents[j];
      if (e2.time - e1.time > fortyEightHoursMs) break; // outside the time window
      
      if (e1.offenderId !== e2.offenderId) {
        const distKm = haversineKm(e1.lat, e1.lon, e2.lat, e2.lon);
        if (distKm <= 5) {
          addCandidate(e1.offenderId, e2.offenderId);
        }
      }
    }
  }

  // Index 9: Same Subcategory + Area sliding window (same subcategory, same district, within 30 days)
  interface SubcatAreaEvent {
    offenderId: string;
    time: number;
  }
  const subcatAreaGroups = new Map<string, SubcatAreaEvent[]>();
  offenderSignals.forEach((data, id) => {
    data.geoTemporalEvents.forEach(e => {
      if (e.district && e.subcategory) {
        const key = `${e.district}#${e.subcategory}`;
        if (!subcatAreaGroups.has(key)) subcatAreaGroups.set(key, []);
        subcatAreaGroups.get(key)!.push({
          offenderId: id,
          time: e.time
        });
      }
    });
  });
  
  // Sort and apply sliding window within each group
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  subcatAreaGroups.forEach(groupEvents => {
    groupEvents.sort((a, b) => a.time - b.time);
    for (let i = 0; i < groupEvents.length; i++) {
      const e1 = groupEvents[i];
      for (let j = i + 1; j < groupEvents.length; j++) {
        const e2 = groupEvents[j];
        if (e2.time - e1.time > thirtyDaysMs) break;
        
        if (e1.offenderId !== e2.offenderId) {
          addCandidate(e1.offenderId, e2.offenderId);
        }
      }
    }
  });

  // ─── SCORING OF CANDIDATES ONLY ──────────────────────────────────────────
  const links: SyndicateLink[] = [];

  candidatePairs.forEach(pairKey => {
    const [id1, id2] = pairKey.split('_');
    const s1 = offenderSignals.get(id1)!;
    const s2 = offenderSignals.get(id2)!;

    let score = 0;
    const signals: string[] = [];

    // 1. Shared Phone Number
    const sharedPhones = [...s1.phones].filter(p => s2.phones.has(p));
    if (sharedPhones.length > 0) {
      score += SIGNAL_WEIGHTS['Shared Phone'];
      signals.push('Shared Phone');
    }

    // 2. Shared Email (exact match OR shared custom domain)
    const sharedEmails = [...s1.emails].filter(e => s2.emails.has(e));
    const sharedDomains = [...s1.emailDomains].filter(d => s2.emailDomains.has(d));
    if (sharedEmails.length > 0 || sharedDomains.length > 0) {
      score += SIGNAL_WEIGHTS['Shared Email'];
      signals.push('Shared Email');
    }

    // 3. Shared Social Handles
    const sharedHandles = [...s1.socialHandles].filter(h => s2.socialHandles.has(h));
    if (sharedHandles.length > 0) {
      score += SIGNAL_WEIGHTS['Shared Social Handle'];
      signals.push('Shared Social Handle');
    }

    // 4. Geo-Temporal Proximity
    let hasGeoMatch = false;
    for (const ev1 of s1.geoTemporalEvents) {
      if (hasGeoMatch) break;
      for (const ev2 of s2.geoTemporalEvents) {
        const distKm = haversineKm(ev1.lat, ev1.lon, ev2.lat, ev2.lon);
        const timeDiffHours = Math.abs(ev1.time - ev2.time) / (1000 * 60 * 60);
        if (distKm <= 5 && timeDiffHours <= 48) {
          hasGeoMatch = true;
          break;
        }
      }
    }
    if (hasGeoMatch) {
      score += SIGNAL_WEIGHTS['Geo-Temporal Proximity'];
      signals.push('Geo-Temporal Proximity');
    }

    // 5. Shared Vehicle
    let sharedVehicle = false;
    for (const [, offIds] of vehicleToOffenders) {
      if (offIds.includes(id1) && offIds.includes(id2)) {
        sharedVehicle = true;
        break;
      }
    }
    if (sharedVehicle) {
      score += SIGNAL_WEIGHTS['Shared Vehicle'];
      signals.push('Shared Vehicle');
    }

    // 6. Co-accused
    let coAccused = false;
    for (const [, offIds] of firToOffenders) {
      if (offIds.includes(id1) && offIds.includes(id2)) {
        coAccused = true;
        break;
      }
    }
    if (coAccused) {
      score += SIGNAL_WEIGHTS['Co-accused (same FIR)'];
      signals.push('Co-accused (same FIR)');
    }

    // 7. Same Subcategory+Area
    let subcatAreaMatch = false;
    for (const ev1 of s1.geoTemporalEvents) {
      if (subcatAreaMatch) break;
      for (const ev2 of s2.geoTemporalEvents) {
        if (
          ev1.subcategory && ev2.subcategory &&
          ev1.subcategory === ev2.subcategory &&
          ev1.district && ev2.district &&
          ev1.district === ev2.district &&
          Math.abs(ev1.time - ev2.time) / (1000 * 60 * 60 * 24) <= 30
        ) {
          subcatAreaMatch = true;
          break;
        }
      }
    }
    if (subcatAreaMatch) {
      score += SIGNAL_WEIGHTS['Same Subcategory+Area'];
      signals.push('Same Subcategory+Area');
    }

    // 8. Shared Investigating Officer
    const sharedIO = [...s1.ios].filter(io => s2.ios.has(io));
    if (sharedIO.length > 0) {
      score += SIGNAL_WEIGHTS['Shared IO'];
      signals.push('Shared IO');
    }

    // Apply threshold — require both minimum score AND minimum number of distinct signals
    if (score >= LINK_THRESHOLD && signals.length >= MIN_SIGNALS) {
      const linkType: SyndicateLink['linkType'] =
        score >= 0.60 ? 'strong' :
        score >= 0.40 ? 'moderate' :
        'weak';

      links.push({
        source: id1,
        target: id2,
        score: Math.round(score * 100) / 100,
        signals,
        linkType,
      });
    }
  });

  return links;
}

// ─── COMMUNITY DETECTION (Connected Components via BFS) ──────────────────────

export function detectSyndicates(
  offenders: Offender[],
  links: SyndicateLink[]
): SyndicateCluster[] {
  // Build adjacency list
  const adj = new Map<string, Set<string>>();
  offenders.forEach(o => adj.set(o.id, new Set()));
  links.forEach(link => {
    adj.get(link.source)?.add(link.target);
    adj.get(link.target)?.add(link.source);
  });

  // BFS to find connected components
  const visited = new Set<string>();
  const components: string[][] = [];

  offenders.forEach(o => {
    if (visited.has(o.id)) return;
    const component: string[] = [];
    const queue: string[] = [o.id];
    visited.add(o.id);

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      component.push(nodeId);
      const neighbors = adj.get(nodeId) || new Set();
      neighbors.forEach(nId => {
        if (!visited.has(nId)) {
          visited.add(nId);
          queue.push(nId);
        }
      });
    }

    components.push(component);
  });

  // Sort components by size (largest first), filter out singletons for naming
  components.sort((a, b) => b.length - a.length);

  // Build offender lookup
  const offenderMap = new Map<string, Offender>();
  offenders.forEach(o => offenderMap.set(o.id, o));

  // Degree map for hub detection
  const degreeMap = new Map<string, number>();
  offenders.forEach(o => degreeMap.set(o.id, adj.get(o.id)?.size || 0));

  const clusters: SyndicateCluster[] = components.map((memberIds, idx) => {
    const members = memberIds.map(id => offenderMap.get(id)!).filter(Boolean);

    // Primary crime type (most frequent)
    const crimeCounts: Record<string, number> = {};
    members.forEach(m => {
      crimeCounts[m.primaryCrime] = (crimeCounts[m.primaryCrime] || 0) + 1;
    });
    const primaryCrimeType = Object.entries(crimeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Average risk
    const avgRiskScore = members.length > 0
      ? Math.round(members.reduce((sum, m) => sum + m.riskScore, 0) / members.length)
      : 0;

    // Hub node (highest degree in this cluster)
    const hubNode = memberIds.reduce((hub, id) =>
      (degreeMap.get(id) || 0) > (degreeMap.get(hub) || 0) ? id : hub
    , memberIds[0]);

    // Geographic focus (most frequent district mention from bios/history)
    const locCounts: Record<string, number> = {};
    members.forEach(m => {
      m.history.forEach(h => {
        const loc = h.location.trim();
        if (loc) locCounts[loc] = (locCounts[loc] || 0) + 1;
      });
    });
    const geographicFocus = Object.entries(locCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Karnataka';

    // Auto-generate name
    const id = `SYN-${String(idx + 1).padStart(3, '0')}`;
    const isSingleton = memberIds.length === 1;
    const singleName = isSingleton
      ? offenderMap.get(memberIds[0])?.alias || 'Isolate'
      : '';
    const name = isSingleton
      ? `${singleName} (Isolated - ${id})`
      : `${geographicFocus} ${primaryCrimeType} Ring (${id})`;

    return {
      id,
      name,
      members: memberIds,
      primaryCrimeType,
      avgRiskScore,
      color: CLUSTER_PALETTE[idx % CLUSTER_PALETTE.length],
      hubNode,
      geographicFocus,
    };
  });

  return clusters;
}

// ─── CENTRALITY COMPUTATION ─────────────────────────────────────────────────

export function computeCentrality(
  offenders: Offender[],
  links: SyndicateLink[]
): Map<string, CentralityData> {
  const adj = new Map<string, Set<string>>();
  offenders.forEach(o => adj.set(o.id, new Set()));
  links.forEach(link => {
    adj.get(link.source)?.add(link.target);
    adj.get(link.target)?.add(link.source);
  });

  const n = offenders.length;
  const centralityMap = new Map<string, CentralityData>();

  // Degree centrality
  const maxDegree = Math.max(1, ...offenders.map(o => adj.get(o.id)?.size || 0));

  // Betweenness centrality (Brandes' algorithm approximated — sample subset for performance)
  const betweenness = new Map<string, number>();
  offenders.forEach(o => betweenness.set(o.id, 0));

  // Sample up to 50 source nodes for betweenness (performance guard)
  const sampleSize = Math.min(50, offenders.length);
  const sampleIndices = new Set<number>();
  while (sampleIndices.size < sampleSize) {
    sampleIndices.add(Math.floor(Math.random() * offenders.length));
  }
  const sampleNodes = [...sampleIndices].map(i => offenders[i].id);

  sampleNodes.forEach(sourceId => {
    // BFS from source
    const stack: string[] = [];
    const predecessors = new Map<string, string[]>();
    const sigma = new Map<string, number>(); // # shortest paths
    const dist = new Map<string, number>();
    const delta = new Map<string, number>();

    offenders.forEach(o => {
      predecessors.set(o.id, []);
      sigma.set(o.id, 0);
      dist.set(o.id, -1);
      delta.set(o.id, 0);
    });

    sigma.set(sourceId, 1);
    dist.set(sourceId, 0);
    const queue: string[] = [sourceId];

    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      const neighbors = adj.get(v) || new Set();
      neighbors.forEach(w => {
        if (dist.get(w)! < 0) {
          queue.push(w);
          dist.set(w, dist.get(v)! + 1);
        }
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          predecessors.get(w)!.push(v);
        }
      });
    }

    while (stack.length > 0) {
      const w = stack.pop()!;
      predecessors.get(w)!.forEach(v => {
        const ratio = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + ratio);
      });
      if (w !== sourceId) {
        betweenness.set(w, betweenness.get(w)! + delta.get(w)!);
      }
    }
  });

  // Normalize betweenness
  const maxBetweenness = Math.max(1, ...offenders.map(o => betweenness.get(o.id) || 0));

  offenders.forEach(o => {
    const degree = adj.get(o.id)?.size || 0;
    centralityMap.set(o.id, {
      degree,
      betweenness: Math.round((betweenness.get(o.id) || 0) * 100) / 100,
      normalizedDegree: degree / maxDegree,
    });
  });

  return centralityMap;
}

// ─── CONVEX HULL (Andrew's Monotone Chain) ──────────────────────────────────

export function computeConvexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length <= 1) return [...points];
  if (points.length === 2) return [...points];

  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);

  const cross = (O: { x: number; y: number }, A: { x: number; y: number }, B: { x: number; y: number }) =>
    (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);

  // Lower hull
  const lower: { x: number; y: number }[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  // Upper hull
  const upper: { x: number; y: number }[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  // Remove last point of each half because it's repeated
  lower.pop();
  upper.pop();

  return [...lower, ...upper];
}

// ─── UPDATE OFFENDER ASSOCIATES FROM SYNDICATE LINKS ─────────────────────────

export function updateOffenderAssociates(
  offenders: Offender[],
  links: SyndicateLink[]
): Offender[] {
  const associateMap = new Map<string, string[]>();
  offenders.forEach(o => associateMap.set(o.id, []));

  links.forEach(link => {
    associateMap.get(link.source)?.push(link.target);
    associateMap.get(link.target)?.push(link.source);
  });

  return offenders.map(o => ({
    ...o,
    associates: associateMap.get(o.id) || []
  }));
}

// ─── SIGNAL METADATA (for UI) ───────────────────────────────────────────────

export const SIGNAL_METADATA: Record<string, { label: string; color: string; icon: string }> = {
  'Shared Phone':           { label: 'Phone Link',       color: '#06b6d4', icon: '📞' },
  'Shared Email':           { label: 'Email Link',       color: '#a855f7', icon: '📧' },
  'Shared Social Handle':   { label: 'Social Media',     color: '#ec4899', icon: '🔗' },
  'Geo-Temporal Proximity': { label: 'Geo-Temporal',     color: '#10b981', icon: '📍' },
  'Shared Vehicle':         { label: 'Vehicle Link',     color: '#f59e0b', icon: '🚗' },
  'Co-accused (same FIR)':  { label: 'Co-accused',       color: '#ef4444', icon: '⚖️' },
  'Same Subcategory+Area':  { label: 'MO Pattern',       color: '#8b5cf6', icon: '🎯' },
  'Shared IO':              { label: 'Shared Officer',   color: '#64748b', icon: '👮' },
};

export const ALL_SIGNAL_TYPES = Object.keys(SIGNAL_METADATA);
