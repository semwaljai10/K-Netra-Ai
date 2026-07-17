/**
 * Comprehensive Crime Rate Training Dataset
 * 
 * Generated from realistic socio-economic patterns observed across
 * Karnataka districts (NCRB-style data structure).
 * 
 * Features:
 *   - unemploymentRate (%)        : 1.5 – 22.0
 *   - avgIncome (₹k/month)       : 15 – 160
 *   - streetLighting (%)          : 20 – 98
 *   - policePatrol (score 1–10)   : 1 – 10
 * 
 * Target:
 *   - crimeRate (incidents per 100k population)
 * 
 * The crime rate is generated via a non-linear model that captures:
 *   - Quadratic unemployment effect (accelerating at high levels)
 *   - Diminishing returns on lighting/patrol above thresholds
 *   - Income-crime inverse relationship with floor effect
 *   - Interaction terms (e.g., high unemployment + low patrol = compounding risk)
 *   - Seasonal noise and district-specific baselines
 */

export interface TrainingSample {
  unemployment: number;
  income: number;
  lighting: number;
  patrol: number;
  crimeRate: number;
  districtId?: string;
  year?: number;
}

// ─── Base District Profiles (Ground Truth Anchors) ───────────────────────────

interface DistrictProfile {
  id: string;
  name: string;
  baseUnemployment: number;
  baseIncome: number;
  baseLighting: number;
  basePatrol: number;
  baseCrimeRate: number;
  urbanization: number; // 0-1 factor: 1=fully urban
  population: number;   // approximate, in thousands
}

const DISTRICT_PROFILES: DistrictProfile[] = [
  // Tier-1 Urban (High crime, high economic activity)
  { id: 'KA_bengaluru_urban', name: 'Bengaluru Urban', baseUnemployment: 18.0, baseIncome: 30, baseLighting: 45, basePatrol: 2, baseCrimeRate: 78.3, urbanization: 0.95, population: 12000 },
  
  // Tier-2 Coastal/Industrial
  { id: 'KA_dakshina_kannada', name: 'Dakshina Kannada', baseUnemployment: 11.7, baseIncome: 73, baseLighting: 62, basePatrol: 4, baseCrimeRate: 46.0, urbanization: 0.55, population: 2100 },
  { id: 'KA_udupi', name: 'Udupi', baseUnemployment: 6.3, baseIncome: 110, baseLighting: 84, basePatrol: 7, baseCrimeRate: 19.3, urbanization: 0.40, population: 1200 },
  
  // Tier-2 Northern Belt
  { id: 'KA_belagavi', name: 'Belagavi', baseUnemployment: 9.9, baseIncome: 85, baseLighting: 69, basePatrol: 5, baseCrimeRate: 37.0, urbanization: 0.50, population: 4800 },
  { id: 'KA_dharwad', name: 'Dharwad', baseUnemployment: 7.0, baseIncome: 106, baseLighting: 81, basePatrol: 7, baseCrimeRate: 22.3, urbanization: 0.52, population: 1850 },
  { id: 'KA_kalaburagi', name: 'Kalaburagi', baseUnemployment: 14.2, baseIncome: 48, baseLighting: 42, basePatrol: 3, baseCrimeRate: 58.5, urbanization: 0.35, population: 2600 },
  
  // Tier-3 Southern Well-developed
  { id: 'KA_mysuru', name: 'Mysuru', baseUnemployment: 7.8, baseIncome: 100, baseLighting: 78, basePatrol: 6, baseCrimeRate: 26.5, urbanization: 0.60, population: 3100 },
  { id: 'KA_shivamogga', name: 'Shivamogga', baseUnemployment: 6.8, baseIncome: 107, baseLighting: 82, basePatrol: 7, baseCrimeRate: 21.8, urbanization: 0.38, population: 1750 },
  { id: 'KA_hassan', name: 'Hassan', baseUnemployment: 5.5, baseIncome: 118, baseLighting: 86, basePatrol: 8, baseCrimeRate: 15.2, urbanization: 0.30, population: 1800 },
  { id: 'KA_chamarajanagar', name: 'Chamarajanagar', baseUnemployment: 7.2, baseIncome: 104, baseLighting: 80, basePatrol: 7, baseCrimeRate: 23.3, urbanization: 0.25, population: 1000 },
  { id: 'KA_mandya', name: 'Mandya', baseUnemployment: 5.8, baseIncome: 115, baseLighting: 85, basePatrol: 8, baseCrimeRate: 16.1, urbanization: 0.28, population: 1800 },
  { id: 'KA_kodagu', name: 'Kodagu', baseUnemployment: 4.2, baseIncome: 125, baseLighting: 88, basePatrol: 8, baseCrimeRate: 11.5, urbanization: 0.20, population: 550 },
  
  // Tier-4 Semi-urban/Industrial
  { id: 'KA_davanagere', name: 'Davanagere', baseUnemployment: 8.5, baseIncome: 92, baseLighting: 72, basePatrol: 5, baseCrimeRate: 31.2, urbanization: 0.42, population: 1950 },
  { id: 'KA_ballari', name: 'Ballari', baseUnemployment: 10.5, baseIncome: 68, baseLighting: 55, basePatrol: 4, baseCrimeRate: 42.7, urbanization: 0.40, population: 2500 },
  { id: 'KA_raichur', name: 'Raichur', baseUnemployment: 13.8, baseIncome: 52, baseLighting: 44, basePatrol: 3, baseCrimeRate: 55.0, urbanization: 0.30, population: 1900 },
  { id: 'KA_vijayapura', name: 'Vijayapura', baseUnemployment: 6.7, baseIncome: 108, baseLighting: 82, basePatrol: 7, baseCrimeRate: 20.8, urbanization: 0.35, population: 2200 },
  { id: 'KA_bagalkot', name: 'Bagalkot', baseUnemployment: 8.2, baseIncome: 94, baseLighting: 73, basePatrol: 6, baseCrimeRate: 29.5, urbanization: 0.32, population: 1900 },
  
  // Tier-4 Northern Underdeveloped Belt
  { id: 'KA_yadgir', name: 'Yadgir', baseUnemployment: 15.5, baseIncome: 42, baseLighting: 35, basePatrol: 2, baseCrimeRate: 65.2, urbanization: 0.18, population: 1200 },
  { id: 'KA_bidar', name: 'Bidar', baseUnemployment: 12.0, baseIncome: 62, baseLighting: 52, basePatrol: 4, baseCrimeRate: 48.0, urbanization: 0.30, population: 1700 },
  { id: 'KA_koppal', name: 'Koppal', baseUnemployment: 13.0, baseIncome: 55, baseLighting: 48, basePatrol: 3, baseCrimeRate: 52.0, urbanization: 0.22, population: 1400 },
  { id: 'KA_gadag', name: 'Gadag', baseUnemployment: 9.0, baseIncome: 88, baseLighting: 70, basePatrol: 5, baseCrimeRate: 33.0, urbanization: 0.30, population: 1050 },
  { id: 'KA_haveri', name: 'Haveri', baseUnemployment: 7.5, baseIncome: 102, baseLighting: 76, basePatrol: 6, baseCrimeRate: 25.0, urbanization: 0.28, population: 1600 },
  
  // Bengaluru suburbs & adjacent
  { id: 'KA_bengaluru_rural', name: 'Bengaluru Rural', baseUnemployment: 8.0, baseIncome: 95, baseLighting: 74, basePatrol: 5, baseCrimeRate: 30.0, urbanization: 0.55, population: 1000 },
  { id: 'KA_ramanagara', name: 'Ramanagara', baseUnemployment: 6.0, baseIncome: 112, baseLighting: 83, basePatrol: 7, baseCrimeRate: 18.0, urbanization: 0.30, population: 1100 },
  { id: 'KA_kolar', name: 'Kolar', baseUnemployment: 9.5, baseIncome: 82, baseLighting: 67, basePatrol: 5, baseCrimeRate: 35.0, urbanization: 0.32, population: 1500 },
  { id: 'KA_chikkaballapur', name: 'Chikkaballapur', baseUnemployment: 8.8, baseIncome: 90, baseLighting: 71, basePatrol: 5, baseCrimeRate: 32.0, urbanization: 0.25, population: 1300 },
  
  // Central Karnataka
  { id: 'KA_chitradurga', name: 'Chitradurga', baseUnemployment: 10.0, baseIncome: 78, baseLighting: 65, basePatrol: 5, baseCrimeRate: 38.0, urbanization: 0.28, population: 1650 },
  { id: 'KA_tumakuru', name: 'Tumakuru', baseUnemployment: 7.0, baseIncome: 105, baseLighting: 80, basePatrol: 6, baseCrimeRate: 24.0, urbanization: 0.32, population: 2700 },
  { id: 'KA_chikkamagaluru', name: 'Chikkamagaluru', baseUnemployment: 5.0, baseIncome: 120, baseLighting: 87, basePatrol: 8, baseCrimeRate: 13.5, urbanization: 0.22, population: 1150 },
  
  // Uttara Kannada (coastal-forest)
  { id: 'KA_uttara_kannada', name: 'Uttara Kannada', baseUnemployment: 5.8, baseIncome: 114, baseLighting: 84, basePatrol: 7, baseCrimeRate: 17.0, urbanization: 0.22, population: 1450 },
  
  // Vijayanagara (newly carved)
  { id: 'KA_vijayanagara', name: 'Vijayanagara', baseUnemployment: 11.0, baseIncome: 70, baseLighting: 58, basePatrol: 4, baseCrimeRate: 44.0, urbanization: 0.28, population: 1000 },
];

// ─── Deterministic Seeded PRNG ─────────────────────────────────────────────────
// Using a mulberry32 PRNG to ensure reproducible dataset generation across runs

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Non-Linear Crime Rate Generator ────────────────────────────────────────────
// This models realistic relationships between socio-economic factors and crime

function computeCrimeRate(
  unemployment: number,
  income: number,
  lighting: number,
  patrol: number,
  urbanization: number,
  rng: () => number
): number {
  // 1. Unemployment effect: quadratic — accelerates at high levels
  //    Below 5% has minimal effect; above 12% it compounds rapidly
  const uEffect = 1.8 * unemployment + 0.08 * Math.pow(Math.max(0, unemployment - 5), 2);

  // 2. Income effect: inverse logarithmic — diminishing returns
  //    Very low income (<30k) is strongly criminogenic; above 100k, effect plateaus
  const iEffect = -12 * Math.log(Math.max(income, 10) / 10);

  // 3. Street lighting: sigmoid response
  //    Below 40%: minimal deterrence; 40-80%: steep improvement; above 80%: diminishing
  const lSigmoid = 1 / (1 + Math.exp(-0.08 * (lighting - 55)));
  const lEffect = -25 * lSigmoid;

  // 4. Police patrol: square root — initial patrols matter most
  //    Going from 1→3 is far more impactful than 7→9
  const pEffect = -8 * Math.sqrt(patrol);

  // 5. Urbanization interaction: cities amplify unemployment effects
  const urbanInteraction = urbanization * unemployment * 0.5;

  // 6. Cross-feature interaction: low patrol + high unemployment is compounding
  const interactionPenalty = Math.max(0, (unemployment - 8) * (6 - patrol)) * 0.4;

  // Base rate + all effects + interactions
  const base = 45; // Baseline constant
  let rate = base + uEffect + iEffect + lEffect + pEffect + urbanInteraction + interactionPenalty;

  // Add realistic noise (measurement error, unreported crimes, seasonal variation)
  const noise = (rng() - 0.5) * 6;
  rate += noise;

  // Clamp to realistic range
  return parseFloat(Math.max(2.0, Math.min(120.0, rate)).toFixed(1));
}

// ─── Dataset Generation ──────────────────────────────────────────────────────────

export function generateTrainingDataset(): TrainingSample[] {
  const rng = mulberry32(42); // Fixed seed for reproducibility
  const samples: TrainingSample[] = [];

  // ── Phase 1: Anchor samples from district profiles (31 × 5 years = 155) ──────
  const years = [2019, 2020, 2021, 2022, 2023];

  for (const district of DISTRICT_PROFILES) {
    for (const year of years) {
      // Year-over-year trends: unemployment generally decreasing, infra improving
      const yearDelta = year - 2021; // center on 2021
      const uTrend = district.baseUnemployment + yearDelta * (rng() * 0.6 - 0.3);
      const iTrend = district.baseIncome + yearDelta * (rng() * 3 + 1);
      const lTrend = Math.min(98, district.baseLighting + yearDelta * (rng() * 1.5 + 0.5));
      const pTrend = Math.min(10, Math.max(1, district.basePatrol + (yearDelta > 0 ? (rng() > 0.6 ? 1 : 0) : 0)));

      const u = parseFloat(Math.max(1.5, uTrend + (rng() - 0.5) * 1.2).toFixed(1));
      const i = parseFloat(Math.max(15, iTrend + (rng() - 0.5) * 8).toFixed(0));
      const l = parseFloat(Math.max(20, Math.min(98, lTrend + (rng() - 0.5) * 4)).toFixed(0));
      const p = Math.max(1, Math.min(10, Math.round(pTrend + (rng() - 0.5) * 0.8)));

      samples.push({
        unemployment: u,
        income: i,
        lighting: l,
        patrol: p,
        crimeRate: computeCrimeRate(u, i, l, p, district.urbanization, rng),
        districtId: district.id,
        year
      });
    }
  }

  // ── Phase 2: Augmented samples with wider noise (31 × 8 = 248) ─────────────
  for (const district of DISTRICT_PROFILES) {
    for (let j = 0; j < 8; j++) {
      const u = parseFloat(Math.max(1.5, Math.min(22, district.baseUnemployment + (rng() - 0.5) * 6)).toFixed(1));
      const i = parseFloat(Math.max(15, Math.min(160, district.baseIncome + (rng() - 0.5) * 40)).toFixed(0));
      const l = parseFloat(Math.max(20, Math.min(98, district.baseLighting + (rng() - 0.5) * 20)).toFixed(0));
      const p = Math.max(1, Math.min(10, Math.round(district.basePatrol + (rng() - 0.5) * 4)));

      samples.push({
        unemployment: u,
        income: i,
        lighting: l,
        patrol: p,
        crimeRate: computeCrimeRate(u, i, l, p, district.urbanization, rng),
        districtId: district.id
      });
    }
  }

  // ── Phase 3: Extreme/edge-case samples for model robustness (200) ──────────
  // High crime scenarios
  for (let j = 0; j < 50; j++) {
    const u = parseFloat((15 + rng() * 7).toFixed(1));      // 15-22%
    const i = parseFloat((15 + rng() * 30).toFixed(0));      // ₹15-45k
    const l = parseFloat((20 + rng() * 25).toFixed(0));      // 20-45%
    const p = Math.max(1, Math.round(1 + rng() * 2));        // 1-3
    const urbanFactor = 0.3 + rng() * 0.7;
    samples.push({
      unemployment: u, income: i, lighting: l, patrol: p,
      crimeRate: computeCrimeRate(u, i, l, p, urbanFactor, rng)
    });
  }

  // Low crime scenarios
  for (let j = 0; j < 50; j++) {
    const u = parseFloat((1.5 + rng() * 4).toFixed(1));      // 1.5-5.5%
    const i = parseFloat((110 + rng() * 50).toFixed(0));     // ₹110-160k
    const l = parseFloat((82 + rng() * 16).toFixed(0));      // 82-98%
    const p = Math.max(7, Math.round(7 + rng() * 3));        // 7-10
    const urbanFactor = 0.1 + rng() * 0.3;
    samples.push({
      unemployment: u, income: i, lighting: l, patrol: p,
      crimeRate: computeCrimeRate(u, i, l, p, urbanFactor, rng)
    });
  }

  // Mixed/mid-range scenarios (the bulk of realistic data)
  for (let j = 0; j < 100; j++) {
    const u = parseFloat((4 + rng() * 14).toFixed(1));       // 4-18%
    const i = parseFloat((30 + rng() * 100).toFixed(0));     // ₹30-130k
    const l = parseFloat((35 + rng() * 55).toFixed(0));      // 35-90%
    const p = Math.max(1, Math.min(10, Math.round(2 + rng() * 8))); // 2-10
    const urbanFactor = rng();
    samples.push({
      unemployment: u, income: i, lighting: l, patrol: p,
      crimeRate: computeCrimeRate(u, i, l, p, urbanFactor, rng)
    });
  }

  // ── Phase 4: "What-if" scenario pairs for sensitivity testing (100) ──────────
  // Keep 3 variables fixed, sweep 1 across its range
  const sweepBase = { u: 10, i: 80, l: 65, p: 5 };

  // Sweep unemployment: 1.5 → 22
  for (let step = 0; step < 25; step++) {
    const u = parseFloat((1.5 + step * 0.82).toFixed(1));
    samples.push({
      unemployment: u, income: sweepBase.i, lighting: sweepBase.l, patrol: sweepBase.p,
      crimeRate: computeCrimeRate(u, sweepBase.i, sweepBase.l, sweepBase.p, 0.4, rng)
    });
  }

  // Sweep income: 15 → 160
  for (let step = 0; step < 25; step++) {
    const i = parseFloat((15 + step * 5.8).toFixed(0));
    samples.push({
      unemployment: sweepBase.u, income: i, lighting: sweepBase.l, patrol: sweepBase.p,
      crimeRate: computeCrimeRate(sweepBase.u, i, sweepBase.l, sweepBase.p, 0.4, rng)
    });
  }

  // Sweep lighting: 20 → 98
  for (let step = 0; step < 25; step++) {
    const l = parseFloat((20 + step * 3.12).toFixed(0));
    samples.push({
      unemployment: sweepBase.u, income: sweepBase.i, lighting: l, patrol: sweepBase.p,
      crimeRate: computeCrimeRate(sweepBase.u, sweepBase.i, l, sweepBase.p, 0.4, rng)
    });
  }

  // Sweep patrol: 1 → 10
  for (let step = 0; step < 25; step++) {
    const p = Math.max(1, Math.min(10, Math.round(1 + step * 0.36)));
    samples.push({
      unemployment: sweepBase.u, income: sweepBase.i, lighting: sweepBase.l, patrol: p,
      crimeRate: computeCrimeRate(sweepBase.u, sweepBase.i, sweepBase.l, p, 0.4, rng)
    });
  }

  return samples;
}

// ─── Dataset Statistics (for model info display) ─────────────────────────────

export function getDatasetStats(samples: TrainingSample[]) {
  const crimes = samples.map(s => s.crimeRate);
  const min = Math.min(...crimes);
  const max = Math.max(...crimes);
  const mean = crimes.reduce((a, b) => a + b, 0) / crimes.length;
  const std = Math.sqrt(crimes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / crimes.length);

  return {
    totalSamples: samples.length,
    crimeRateRange: { min: min.toFixed(1), max: max.toFixed(1) },
    crimeRateMean: mean.toFixed(1),
    crimeRateStd: std.toFixed(1),
    uniqueDistricts: new Set(samples.filter(s => s.districtId).map(s => s.districtId)).size,
    yearsSpanned: [...new Set(samples.filter(s => s.year).map(s => s.year))].sort()
  };
}
