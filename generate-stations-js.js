const fs = require('fs');
const path = require('path');

const datasetPath = path.join(__dirname, 'src/lib/karnataka_crime_dataset.json');
const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

const records = rawData.fir_records || [];
const districtMap = {};

// We map district names to district IDs as defined in MOCK_DISTRICTS
const districtIdMap = {
  "Bagalkote": "KA_bagalkot",
  "Ballari": "KA_ballari",
  "Belagavi": "KA_belagavi",
  "Bengaluru Rural": "KA_bengaluru_rural",
  "Bengaluru Urban": "KA_bengaluru_urban",
  "Bidar": "KA_bidar",
  "Chamarajanagar": "KA_chamarajanagar",
  "Chikkaballapur": "KA_chikkaballapur",
  "Chikkamagaluru": "KA_chikkamagaluru",
  "Chitradurga": "KA_chitradurga",
  "Dakshina Kannada": "KA_dakshina_kannada",
  "Davanagere": "KA_davanagere",
  "Dharwad": "KA_dharwad",
  "Gadag": "KA_gadag",
  "Hassan": "KA_hassan",
  "Haveri": "KA_haveri",
  "Kalaburagi": "KA_kalaburagi",
  "Kodagu": "KA_kodagu",
  "Kolar": "KA_kolar",
  "Koppal": "KA_koppal",
  "Mandya": "KA_mandya",
  "Mysuru": "KA_mysuru",
  "Raichur": "KA_raichur",
  "Ramanagara": "KA_ramanagara",
  "Shivamogga": "KA_shivamogga",
  "Tumakuru": "KA_tumakuru",
  "Udupi": "KA_udupi",
  "Uttara Kannada": "KA_uttara_kannada",
  "Vijayapura": "KA_vijayapura",
  "Yadgir": "KA_yadgir"
};

records.forEach(item => {
  const ps = item.police_station;
  if (ps && ps.district && ps.name && ps.station_code) {
    const distName = ps.district.trim();
    const distId = districtIdMap[distName];
    if (!distId) return;

    const name = ps.name.trim();
    const code = ps.station_code.trim();

    if (!districtMap[distId]) {
      districtMap[distId] = {};
    }
    districtMap[distId][name] = code;
  }
});

let snippet = 'const DISTRICT_STATIONS: Record<string, { name: string; code: string }[]> = {\n';

Object.keys(districtMap).sort().forEach(id => {
  snippet += `  "${id}": [\n`;
  const stations = districtMap[id];
  Object.keys(stations).sort().forEach(name => {
    snippet += `    { name: "${name}", code: "${stations[name]}" },\n`;
  });
  snippet += `  ],\n`;
});
snippet += '};\n';

fs.writeFileSync(path.join(__dirname, 'stations-snippet.txt'), snippet, 'utf8');
console.log('Snippet generated in stations-snippet.txt');
