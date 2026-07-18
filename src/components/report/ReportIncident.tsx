'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { MOCK_DISTRICTS, Incident, Offender } from '@/lib/data';
import GlassPanel from '../ui/GlassPanel';
import { FilePlus, ShieldAlert, CheckCircle, RefreshCw, AlertTriangle, Plus, Minus, X, Calendar } from 'lucide-react';
import DateTimePicker from '../ui/DateTimePicker';

const DISTRICT_STATIONS: Record<string, { name: string; code: string }[]> = {
  "KA_bagalkot": [
    { name: "Badami PS", code: "KA-BAG-BAD91" },
    { name: "Bagalkote Town PS", code: "KA-BAG-BAG26" },
    { name: "Bilgi PS", code: "KA-BAG-BIL79" },
    { name: "Jamakhandi PS", code: "KA-BAG-JAM61" },
  ],
  "KA_ballari": [
    { name: "Ballari Town PS", code: "KA-BAL-BAL52" },
    { name: "Gandhinagar PS (Ballari)", code: "KA-BAL-GAN23" },
    { name: "Hospet Town PS", code: "KA-BAL-HOS67" },
    { name: "Kampli PS", code: "KA-BAL-KAM93" },
    { name: "Sandur PS", code: "KA-BAL-SAN57" },
    { name: "Siruguppa PS", code: "KA-BAL-SIR43" },
  ],
  "KA_belagavi": [
    { name: "Angol PS", code: "KA-BEL-ANG49" },
    { name: "Athani PS", code: "KA-BEL-ATH28" },
    { name: "Camp PS", code: "KA-BEL-CAM83" },
    { name: "Chikkodi PS", code: "KA-BEL-CHI63" },
    { name: "Gokak PS", code: "KA-BEL-GOK87" },
    { name: "Keshwapur PS (Belagavi)", code: "KA-BEL-KES30" },
    { name: "Khade Bazaar PS", code: "KA-BEL-KHA89" },
    { name: "Shahpur PS", code: "KA-BEL-SHA81" },
    { name: "Tilakwadi PS", code: "KA-BEL-TIL77" },
    { name: "Udyambag PS", code: "KA-BEL-UDY67" },
  ],
  "KA_bengaluru_rural": [
    { name: "Anekal PS", code: "KA-BEN-ANE48" },
    { name: "Devanahalli PS", code: "KA-BEN-DEV27" },
    { name: "Doddaballapur Town PS", code: "KA-BEN-DOD22" },
    { name: "Hosakote PS", code: "KA-BEN-HOS28" },
    { name: "Nelamangala PS", code: "KA-BEN-NEL19" },
    { name: "Vijayapura PS (BLR Rural)", code: "KA-BEN-VIJ31" },
  ],
  "KA_bengaluru_urban": [
    { name: "Amruthahalli PS", code: "KA-BEN-AMR70" },
    { name: "BTM Layout PS", code: "KA-BEN-BTM41" },
    { name: "Banashankari PS", code: "KA-BEN-BAN49" },
    { name: "Banaswadi PS", code: "KA-BEN-BAN56" },
    { name: "Basavanagudi PS", code: "KA-BEN-BAS39" },
    { name: "Bellandur PS", code: "KA-BEN-BEL23" },
    { name: "Byatarayanapura PS", code: "KA-BEN-BYA21" },
    { name: "Chamarajpet PS", code: "KA-BEN-CHA63" },
    { name: "Cubbon Park PS", code: "KA-BEN-CUB13" },
    { name: "Electronic City PS", code: "KA-BEN-ELE38" },
    { name: "HAL PS", code: "KA-BEN-HAL75" },
    { name: "HSR Layout PS", code: "KA-BEN-HSR38" },
    { name: "Halasuru PS", code: "KA-BEN-HAL27" },
    { name: "Hebbal PS", code: "KA-BEN-HEB20" },
    { name: "High Grounds PS", code: "KA-BEN-HIG63" },
    { name: "Indiranagar PS", code: "KA-BEN-IND12" },
    { name: "JP Nagar PS", code: "KA-BEN-JP55" },
    { name: "Jayanagar PS", code: "KA-BEN-JAY43" },
    { name: "Jigani PS", code: "KA-BEN-JIG84" },
    { name: "K.R. Puram PS", code: "KA-BEN-KR38" },
    { name: "Kengeri PS", code: "KA-BEN-KEN48" },
    { name: "Konankunte PS", code: "KA-BEN-KON86" },
    { name: "Koramangala PS", code: "KA-BEN-KOR60" },
    { name: "Madivala PS", code: "KA-BEN-MAD27" },
    { name: "Mahadevapura PS", code: "KA-BEN-MAH10" },
    { name: "Malleshwaram PS", code: "KA-BEN-MAL81" },
    { name: "Marathahalli PS", code: "KA-BEN-MAR78" },
    { name: "Peenya PS", code: "KA-BEN-PEE77" },
    { name: "RT Nagar PS", code: "KA-BEN-RT21" },
    { name: "Rajajinagar PS", code: "KA-BEN-RAJ16" },
    { name: "Ramamurthy Nagar PS", code: "KA-BEN-RAM45" },
    { name: "Sadashivanagar PS", code: "KA-BEN-SAD98" },
    { name: "Sanjaynagar PS", code: "KA-BEN-SAN80" },
    { name: "Sarjapur PS", code: "KA-BEN-SAR80" },
    { name: "Seshadripuram PS", code: "KA-BEN-SES59" },
    { name: "Shivajinagar PS", code: "KA-BEN-SHI68" },
    { name: "Ulsoor PS", code: "KA-BEN-ULS65" },
    { name: "Varthur PS", code: "KA-BEN-VAR59" },
    { name: "Vijayanagar PS", code: "KA-BEN-VIJ88" },
    { name: "Whitefield PS", code: "KA-BEN-WHI83" },
    { name: "Wilson Garden PS", code: "KA-BEN-WIL47" },
    { name: "Yelahanka PS", code: "KA-BEN-YEL49" },
    { name: "Yeshwanthpur PS", code: "KA-BEN-YES80" },
  ],
  "KA_bidar": [
    { name: "Aurad PS", code: "KA-BID-AUR88" },
    { name: "Basavakalyan PS", code: "KA-BID-BAS20" },
    { name: "Bhalki PS", code: "KA-BID-BHA51" },
    { name: "Bidar Town PS", code: "KA-BID-BID47" },
  ],
  "KA_chamarajanagar": [
    { name: "Chamarajanagar PS", code: "KA-CHA-CHA91" },
    { name: "Gundlupet PS", code: "KA-CHA-GUN15" },
    { name: "Yelandur PS", code: "KA-CHA-YEL33" },
  ],
  "KA_chikkaballapur": [
    { name: "Chikkaballapur PS", code: "KA-CHI-CHI11" },
    { name: "Chintamani PS", code: "KA-CHI-CHI87" },
    { name: "Gauribidanur PS", code: "KA-CHI-GAU60" },
    { name: "Sidlaghatta PS", code: "KA-CHI-SID19" },
  ],
  "KA_chikkamagaluru": [
    { name: "Chikkamagaluru Town PS", code: "KA-CHI-CHI87" },
    { name: "Kadur PS", code: "KA-CHI-KAD15" },
    { name: "Koppa PS", code: "KA-CHI-KOP24" },
    { name: "Tarikere PS", code: "KA-CHI-TAR68" },
  ],
  "KA_chitradurga": [
    { name: "Challakere PS", code: "KA-CHI-CHA85" },
    { name: "Chitradurga Town PS", code: "KA-CHI-CHI38" },
    { name: "Hiriyur PS", code: "KA-CHI-HIR43" },
    { name: "Holalkere PS", code: "KA-CHI-HOL35" },
    { name: "Hosadurga PS", code: "KA-CHI-HOS32" },
  ],
  "KA_dakshina_kannada": [
    { name: "Bajpe PS", code: "KA-DAK-BAJ82" },
    { name: "Bantwal PS", code: "KA-DAK-BAN95" },
    { name: "Barke PS", code: "KA-DAK-BAR33" },
    { name: "Kavoor PS", code: "KA-DAK-KAV20" },
    { name: "Konaje PS", code: "KA-DAK-KON91" },
    { name: "Mangaluru East PS", code: "KA-DAK-MAN68" },
    { name: "Mangaluru North PS", code: "KA-DAK-MAN92" },
    { name: "Mangaluru South PS", code: "KA-DAK-MAN51" },
    { name: "Panambur PS", code: "KA-DAK-PAN34" },
    { name: "Puttur PS", code: "KA-DAK-PUT16" },
    { name: "Surathkal PS", code: "KA-DAK-SUR95" },
    { name: "Ullal PS", code: "KA-DAK-ULL99" },
  ],
  "KA_davanagere": [
    { name: "Davanagere PS", code: "KA-DAV-DAV26" },
    { name: "Harihar Town PS", code: "KA-DAV-HAR72" },
    { name: "Jagalur PS", code: "KA-DAV-JAG97" },
    { name: "Nittuvalli PS", code: "KA-DAV-NIT22" },
    { name: "Vidyanagar PS (Davanagere)", code: "KA-DAV-VID26" },
  ],
  "KA_dharwad": [
    { name: "Dharwad PS", code: "KA-DHA-DHA90" },
    { name: "Dharwad Suburban PS", code: "KA-DHA-DHA47" },
    { name: "Gokul Road PS", code: "KA-DHA-GOK27" },
    { name: "Hubli Suburban PS", code: "KA-DHA-HUB27" },
    { name: "Keshwapur PS", code: "KA-DHA-KES54" },
    { name: "New Hubli PS", code: "KA-DHA-NEW76" },
    { name: "Old Hubli PS", code: "KA-DHA-OLD90" },
    { name: "Vidyanagar PS", code: "KA-DHA-VID58" },
  ],
  "KA_gadag": [
    { name: "Betageri PS", code: "KA-GAD-BET62" },
    { name: "Gadag Town PS", code: "KA-GAD-GAD71" },
    { name: "Mundargi PS", code: "KA-GAD-MUN37" },
    { name: "Nargund PS", code: "KA-GAD-NAR50" },
  ],
  "KA_hassan": [
    { name: "Arsikere PS", code: "KA-HAS-ARS77" },
    { name: "Belur PS", code: "KA-HAS-BEL20" },
    { name: "Channarayapatna PS", code: "KA-HAS-CHA17" },
    { name: "Hassan Town PS", code: "KA-HAS-HAS32" },
    { name: "Holenarasipura PS", code: "KA-HAS-HOL69" },
    { name: "Sakleshpur PS", code: "KA-HAS-SAK29" },
  ],
  "KA_haveri": [
    { name: "Byadgi PS", code: "KA-HAV-BYA37" },
    { name: "Hanagal PS", code: "KA-HAV-HAN37" },
    { name: "Haveri Town PS", code: "KA-HAV-HAV92" },
    { name: "Ranebennur PS", code: "KA-HAV-RAN28" },
    { name: "Savanur PS", code: "KA-HAV-SAV28" },
  ],
  "KA_kalaburagi": [
    { name: "Aland PS", code: "KA-KAL-ALA32" },
    { name: "Brahmapur PS", code: "KA-KAL-BRA59" },
    { name: "Humnabad PS", code: "KA-KAL-HUM22" },
    { name: "Jewargi Colony PS", code: "KA-KAL-JEW85" },
    { name: "Maha Gandhi Nagar PS", code: "KA-KAL-MAH94" },
    { name: "Sedam PS", code: "KA-KAL-SED11" },
    { name: "Station Bazaar PS", code: "KA-KAL-STA83" },
  ],
  "KA_kodagu": [
    { name: "Kushalnagar PS", code: "KA-KOD-KUS96" },
    { name: "Madikeri Town PS", code: "KA-KOD-MAD26" },
    { name: "Somwarpet PS", code: "KA-KOD-SOM33" },
    { name: "Virajpet PS", code: "KA-KOD-VIR32" },
  ],
  "KA_kolar": [
    { name: "Bangarpet PS", code: "KA-KOL-BAN94" },
    { name: "KGF PS", code: "KA-KOL-KGF26" },
    { name: "Kolar Town PS", code: "KA-KOL-KOL84" },
    { name: "Malur PS", code: "KA-KOL-MAL45" },
    { name: "Mulbagal PS", code: "KA-KOL-MUL93" },
  ],
  "KA_koppal": [
    { name: "Gangavathi PS", code: "KA-KOP-GAN38" },
    { name: "Koppal Town PS", code: "KA-KOP-KOP34" },
    { name: "Kushtagi PS", code: "KA-KOP-KUS39" },
    { name: "Yelburga PS", code: "KA-KOP-YEL32" },
  ],
  "KA_mandya": [
    { name: "Maddur PS", code: "KA-MAN-MAD40" },
    { name: "Malavalli PS", code: "KA-MAN-MAL59" },
    { name: "Mandya Town PS", code: "KA-MAN-MAN72" },
    { name: "Pandavapura PS", code: "KA-MAN-PAN15" },
    { name: "Srirangapatna PS", code: "KA-MAN-SRI91" },
  ],
  "KA_mysuru": [
    { name: "Alanahalli PS", code: "KA-MYS-ALA35" },
    { name: "Devaraja PS", code: "KA-MYS-DEV53" },
    { name: "Hunsur PS", code: "KA-MYS-HUN11" },
    { name: "Jayalakshmipuram PS", code: "KA-MYS-JAY19" },
    { name: "K.R. PS", code: "KA-MYS-KR71" },
    { name: "Lashkar PS", code: "KA-MYS-LAS57" },
    { name: "N.R. PS", code: "KA-MYS-NR46" },
    { name: "Nanjangud Town PS", code: "KA-MYS-NAN36" },
    { name: "Nazarbad PS", code: "KA-MYS-NAZ63" },
    { name: "Saraswathipuram PS", code: "KA-MYS-SAR65" },
    { name: "T. Narasipura PS", code: "KA-MYS-T59" },
    { name: "Udayagiri PS", code: "KA-MYS-UDA22" },
    { name: "V.V. Puram PS", code: "KA-MYS-VV28" },
    { name: "Vijayanagar PS (Mysuru)", code: "KA-MYS-VIJ85" },
  ],
  "KA_raichur": [
    { name: "Devadurga PS", code: "KA-RAI-DEV49" },
    { name: "Lingasugur PS", code: "KA-RAI-LIN51" },
    { name: "Manvi PS", code: "KA-RAI-MAN17" },
    { name: "Raichur Town PS", code: "KA-RAI-RAI74" },
    { name: "Sindhanur PS", code: "KA-RAI-SIN38" },
  ],
  "KA_ramanagara": [
    { name: "Channapatna PS", code: "KA-RAM-CHA21" },
    { name: "Kanakapura PS", code: "KA-RAM-KAN71" },
    { name: "Magadi PS", code: "KA-RAM-MAG48" },
    { name: "Ramanagara PS", code: "KA-RAM-RAM69" },
  ],
  "KA_shivamogga": [
    { name: "Bhadravati Town PS", code: "KA-SHI-BHA79" },
    { name: "Doddapete PS", code: "KA-SHI-DOD10" },
    { name: "Sagar Town PS", code: "KA-SHI-SAG89" },
    { name: "Shikaripura PS", code: "KA-SHI-SHI86" },
    { name: "Shivamogga Town PS", code: "KA-SHI-SHI37" },
  ],
  "KA_tumakuru": [
    { name: "Kunigal PS", code: "KA-TUM-KUN59" },
    { name: "Kyathasandra PS", code: "KA-TUM-KYA54" },
    { name: "Madhugiri PS", code: "KA-TUM-MAD83" },
    { name: "Sira PS", code: "KA-TUM-SIR19" },
    { name: "Tiptur PS", code: "KA-TUM-TIP62" },
    { name: "Tumakuru Town PS", code: "KA-TUM-TUM36" },
  ],
  "KA_udupi": [
    { name: "Brahmavar PS", code: "KA-UDU-BRA72" },
    { name: "Karkala PS", code: "KA-UDU-KAR48" },
    { name: "Kundapur PS", code: "KA-UDU-KUN25" },
    { name: "Malpe PS", code: "KA-UDU-MAL28" },
    { name: "Udupi Town PS", code: "KA-UDU-UDU54" },
  ],
  "KA_uttara_kannada": [
    { name: "Bhatkal PS", code: "KA-UTT-BHA88" },
    { name: "Dandeli PS", code: "KA-UTT-DAN29" },
    { name: "Honnavar PS", code: "KA-UTT-HON67" },
    { name: "Karwar PS", code: "KA-UTT-KAR53" },
    { name: "Kumta PS", code: "KA-UTT-KUM95" },
    { name: "Sirsi PS", code: "KA-UTT-SIR71" },
    { name: "Yellapur PS", code: "KA-UTT-YEL20" },
  ],
  "KA_vijayapura": [
    { name: "Bagewadi PS", code: "KA-VIJ-BAG38" },
    { name: "Indi PS", code: "KA-VIJ-IND26" },
    { name: "Muddebihal PS", code: "KA-VIJ-MUD55" },
    { name: "Sindagi PS", code: "KA-VIJ-SIN68" },
    { name: "Vijayapura Town PS", code: "KA-VIJ-VIJ86" },
  ],
  "KA_yadgir": [
    { name: "Shahapur PS", code: "KA-YAD-SHA41" },
    { name: "Shorapur PS", code: "KA-YAD-SHO74" },
    { name: "Yadgir Town PS", code: "KA-YAD-YAD54" },
  ],
};

export default function ReportIncident() {
  const { reportIncident, setCurrentView } = useApp();

  // Form states
  const [districtId, setDistrictId] = useState('');
  const [policeStation, setPoliceStation] = useState('');

  // Reactive station code lookup
  const selectedStationObj = districtId ? (DISTRICT_STATIONS[districtId] || []).find(s => s.name === policeStation) : null;
  const stationCode = selectedStationObj ? selectedStationObj.code : '';
  const [sectionsStr, setSectionsStr] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');

  const [victims, setVictims] = useState([
    { name: '', age: '', gender: '', relation: '' }
  ]);

  const [suspects, setSuspects] = useState<Array<{ name: string; address: string; age: string; gender: string }>>([
    { name: '', address: '', age: '', gender: '' }
  ]);

  const [complainantSameAsVictim, setComplainantSameAsVictim] = useState(true);
  const [complainant, setComplainant] = useState({
    name: '',
    age: '',
    gender: '',
    relationToVictim: 'Self',
    address: '',
    contactPhone: '+91 ',
    contactEmail: '',
    idType: '',
    idNumber: ''
  });

  const [currentStep, setCurrentStep] = useState(1);

  const FORM_STEPS = [
    { id: 1, key: 'district', label: 'District', title: 'Jurisdiction & Time' },
    { id: 2, key: 'details', label: 'Details & Statements', title: 'Complainant & Victims' },
    { id: 3, key: 'crime', label: 'Crime Details', title: 'Accused & Classification' },
    { id: 4, key: 'investigation', label: 'Investigation', title: 'Investigation Details' }
  ];

  const validateStep = (stepNum: number): boolean => {
    setErrorMsg(null);
    if (stepNum === 1) {
      if (!districtId) {
        setErrorMsg('Please select a district/sector zone.');
        return false;
      }
      if (!policeStation) {
        setErrorMsg('Please select a police station.');
        return false;
      }
      if (!location.trim()) {
        setErrorMsg('Please enter an incident scene specific address.');
        return false;
      }
      if (!dateTime) {
        setErrorMsg('Please select the date and time of occurrence.');
        return false;
      }
      if (!sectionsStr.trim()) {
        setErrorMsg('Please enter the IPC / BNS sections.');
        return false;
      }
    } else if (stepNum === 2) {
      if (!complainantSameAsVictim) {
        if (!complainant.name.trim()) {
          setErrorMsg('Please enter the complainant name.');
          return false;
        }
        if (!complainant.age.trim()) {
          setErrorMsg('Please enter the complainant age.');
          return false;
        }
        if (!complainant.gender) {
          setErrorMsg('Please select the complainant gender.');
          return false;
        }
        if (!complainant.relationToVictim.trim()) {
          setErrorMsg('Please specify the relationship of the complainant to the victim.');
          return false;
        }
      }
      
      // Validate victims list
      for (let i = 0; i < victims.length; i++) {
        if (!victims[i].name.trim()) {
          setErrorMsg(`Please enter a name for Victim #${i + 1}.`);
          return false;
        }
        if (!victims[i].age.trim()) {
          setErrorMsg(`Please enter an age for Victim #${i + 1}.`);
          return false;
        }
        if (!victims[i].gender) {
          setErrorMsg(`Please select a gender for Victim #${i + 1}.`);
          return false;
        }
        if (!victims[i].relation.trim()) {
          setErrorMsg(`Please specify the relationship to suspect for Victim #${i + 1}.`);
          return false;
        }
      }
    } else if (stepNum === 3) {
      // Validate suspects list
      for (let i = 0; i < suspects.length; i++) {
        if (!suspects[i].name.trim()) {
          setErrorMsg(`Please enter a name for Suspect #${i + 1}.`);
          return false;
        }
        if (!suspects[i].address.trim()) {
          setErrorMsg(`Please enter an address for Suspect #${i + 1}.`);
          return false;
        }
      }
      if (!crimeType) {
        setErrorMsg('Please select a crime category.');
        return false;
      }
      if (!crimeSubcategory.trim()) {
        setErrorMsg('Please enter a subcategory / MOD.');
        return false;
      }
      if (!weaponUsed.trim()) {
        setErrorMsg('Please specify the weapon used.');
        return false;
      }
      if (!vehicleNo.trim()) {
        setErrorMsg('Please specify the vehicle number.');
        return false;
      }
      if (!description.trim()) {
        setErrorMsg('Please enter a brief case analysis summary description.');
        return false;
      }
    } else if (stepNum === 4) {
      if (!officerId.trim()) {
        setErrorMsg('Please enter the Investigating Officer ID.');
        return false;
      }
      if (!convictionStatus) {
        setErrorMsg('Please select the Conviction Status.');
        return false;
      }
      if (!legalStage) {
        setErrorMsg('Please select the Legal Stage.');
        return false;
      }
      if (!officerName.trim()) {
        setErrorMsg('Please enter the Investigating Officer Name.');
        return false;
      }
      if (!officerRank) {
        setErrorMsg('Please select the Investigating Officer Rank.');
        return false;
      }
      if (!evidenceSummary.trim()) {
        setErrorMsg('Please enter the Evidence Summary & Findings.');
        return false;
      }
    }
    return true;
  };

  const handleNext = (targetStep?: number) => {
    if (validateStep(currentStep)) {
      if (targetStep !== undefined) {
        setCurrentStep(targetStep);
      } else {
        setCurrentStep(prev => Math.min(prev + 1, 4));
      }
    }
  };

  const handlePrevious = () => {
    setErrorMsg(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const addVictim = () => {
    setVictims(prev => [...prev, { name: '', age: '', gender: '', relation: '' }]);
  };
  const removeVictim = (index: number) => {
    setVictims(prev => prev.filter((_, idx) => idx !== index));
  };
  const updateVictim = (index: number, key: string, value: string) => {
    setVictims(prev => prev.map((v, idx) => idx === index ? { ...v, [key]: value } : v));
  };

  const addSuspect = () => {
    setSuspects(prev => [...prev, { name: '', address: '', age: '', gender: '' }]);
  };
  const removeSuspect = (index: number) => {
    setSuspects(prev => prev.filter((_, idx) => idx !== index));
  };
  const updateSuspect = (index: number, key: string, value: string) => {
    setSuspects(prev => prev.map((s, idx) => idx === index ? { ...s, [key]: value } : s));
  };

  const [crimeType, setCrimeType] = useState('');
  const [crimeSubcategory, setCrimeSubcategory] = useState('');
  const [weaponUsed, setWeaponUsed] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [description, setDescription] = useState('');

  const [officerId, setOfficerId] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [officerRank, setOfficerRank] = useState('');
  const [chargeSheetFiled, setChargeSheetFiled] = useState(false);
  const [convictionStatus, setConvictionStatus] = useState('');
  const [legalStage, setLegalStage] = useState('');
  const [evidenceSummary, setEvidenceSummary] = useState('');

  const clearForm = () => {
    setDistrictId('');
    setPoliceStation('');
    setSectionsStr('');
    setDateTime('');
    setLocation('');
    setComplainantSameAsVictim(true);
    setComplainant({
      name: '',
      age: '',
      gender: '',
      relationToVictim: 'Self',
      address: '',
      contactPhone: '+91 ',
      contactEmail: '',
      idType: '',
      idNumber: ''
    });
    setCurrentStep(1);
    setVictims([{ name: '', age: '', gender: '', relation: '' }]);
    setSuspects([{ name: '', address: '', age: '', gender: '' }]);
    setCrimeType('');
    setCrimeSubcategory('');
    setWeaponUsed('');
    setVehicleNo('');
    setDescription('');
    setOfficerId('');
    setOfficerName('');
    setOfficerRank('');
    setChargeSheetFiled(false);
    setConvictionStatus('');
    setLegalStage('');
    setEvidenceSummary('');
  };

  // UI Flow states
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const crimeTypes = [
    'Cybercrime',
    'Extortion',
    'Drug Peddling',
    'Assault',
    'Theft',
    'Environmental Offence',
    'Property Offence'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (let i = 1; i <= 4; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return;
      }
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessId(null);

    // Dynamic progress updates for authentic system feel
    const steps = [
      'Validating jurisdictional security parameters...',
      'Computing coordinate telemetry offsets...',
      'Drafting cryptographic FIR block structure...',
      'Writing persistent data blocks to disk ledger...',
      'Syncing active command console matrices...'
    ];

    let stepIdx = 0;
    setProgressMsg(steps[0]);
    const interval = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setProgressMsg(steps[stepIdx]);
      }
    }, 450);

    try {
      // Calculate coordinates dynamically in district bounds
      const distObj = MOCK_DISTRICTS[districtId];
      const lat = distObj ? distObj.center[0] + (Math.random() - 0.5) * 0.04 : 15.3173;
      const lng = distObj ? distObj.center[1] + (Math.random() - 0.5) * 0.04 : 75.7139;

      // Determine severity based on category
      let severity: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
      const cat = crimeType.toLowerCase();
      if (cat.includes('drug') || cat.includes('critical')) severity = 'Critical';
      else if (cat.includes('assault') || cat.includes('extortion')) severity = 'High';
      else if (cat.includes('cyber') || cat.includes('property')) severity = 'Medium';
      else severity = 'Low';

      // Parse BNS / IPC sections array
      const sections = sectionsStr.split(',').map(s => s.trim()).filter(Boolean);

      // Construct payload for API post (raw schema format)
      const parseAgeInput = (val: string) => {
        if (!val) return null;
        const cleaned = val.trim();
        if (cleaned.includes('-')) return cleaned;
        const num = Number(cleaned);
        return isNaN(num) ? cleaned : num;
      };

      const districtName = MOCK_DISTRICTS[districtId]?.name || 'Karnataka';
      const rawPayload = {
        case_information: {
          fir_no: '', // Auto-generated by server/database
          ipc_bns_sections: sections,
          date_time: new Date(dateTime).toISOString(),
          location: `${location}, ${districtName}`
        },
        complainant: complainantSameAsVictim ? {
          name: victims[0]?.name || 'Unknown',
          age: parseAgeInput(victims[0]?.age),
          gender: victims[0]?.gender || null,
          relationshipToVictim: 'Self',
          address: '',
          contactPhone: '',
          contactEmail: '',
          idType: '',
          idNumber: ''
        } : {
          name: complainant.name || 'Unknown',
          age: parseAgeInput(complainant.age),
          gender: complainant.gender || null,
          relationshipToVictim: complainant.relationToVictim || 'Stranger',
          address: complainant.address || '',
          contactPhone: complainant.contactPhone || '',
          contactEmail: complainant.contactEmail || '',
          idType: complainant.idType || '',
          idNumber: complainant.idNumber || ''
        },
        // Maintain single properties for backward compatibility
        suspect_details: {
          name: suspects[0]?.name || 'Unknown',
          address: suspects[0]?.address || 'Not Available',
          age: parseAgeInput(suspects[0]?.age),
          gender: suspects[0]?.gender || null
        },
        victim_details: {
          name: victims[0]?.name || 'Unknown',
          age: parseAgeInput(victims[0]?.age),
          gender: victims[0]?.gender || null,
          relation_to_suspect: victims[0]?.relation || 'N/A'
        },
        // Supporting multiple suspects and victims arrays
        suspects: suspects.map(s => ({
          name: s.name || 'Unknown',
          address: s.address || 'Not Available',
          age: parseAgeInput(s.age),
          gender: s.gender || null
        })),
        victims: victims.map(v => ({
          name: v.name || 'Unknown',
          age: parseAgeInput(v.age),
          gender: v.gender || null,
          relation_to_suspect: v.relation || 'N/A'
        })),
        incident_data: {
          crime_type: crimeType,
          crime_subcategory: crimeSubcategory,
          weapon_used: weaponUsed,
          vehicle_no: vehicleNo
        },
        investigation_data: {
          investigating_officer_id: officerId,
          investigating_officer_name: officerName,
          investigating_officer_rank: officerRank,
          police_station: policeStation,
          police_station_code: stationCode,
          evidence_summary: evidenceSummary
        },
        geospatial_data: {
          latitude: lat,
          longitude: lng
        },
        legal_outcome: {
          charge_sheet_filed: chargeSheetFiled,
          conviction_status: convictionStatus,
          legal_stage: legalStage
        },
        districtId // passed for mapping client states
      };

      // Determine status from conviction status
      let status: 'Open' | 'Dispatched' | 'Resolved' = 'Open';
      const conv = convictionStatus.toLowerCase();
      if (conv === 'closed') {
        status = 'Resolved';
      } else if (conv === 'dispatched') {
        status = 'Dispatched';
      }

      // Pre-construct client side incident state (will override ID with server response)
      const formattedIncident: Incident = {
        id: '', // Will be updated by state dispatch
        type: crimeType,
        districtId: districtId,
        severity: severity,
        timestamp: new Date(dateTime).toISOString(),
        coords: [lat, lng],
        offenderId: null,
        status: status,
        description: `FIR registered under sections: ${sections.join(' / ')}. Incident location: ${location}. ` +
          `Victims: ${victims.map(v => `${v.name} (${v.age || 'N/A'}, ${v.gender || 'N/A'})`).join(', ')}. ` +
          `Suspects: ${suspects.map(s => `${s.name} (${s.age || 'N/A'}, ${s.gender || 'N/A'})`).join(', ')}. ` +
          `Officer: ${officerName} (${officerRank}) at ${policeStation}. Weapon: ${weaponUsed}. Vehicle: ${vehicleNo}. Evidence: ${evidenceSummary}.`
      };

      // If suspect is specified, prepare suspect state
      let formattedOffender: Offender | undefined = undefined;
      const primarySuspect = suspects[0];
      if (primarySuspect && primarySuspect.name && primarySuspect.name !== 'None' && primarySuspect.name !== 'Unknown') {
        const hash = primarySuspect.name.length * 17;
        const sAge = parseAgeInput(primarySuspect.age);
        formattedOffender = {
          id: `OFF-${String(100 + Math.floor(Math.random() * 899))}`, // server overrides if matched
          name: primarySuspect.name,
          alias: primarySuspect.name.split(' ')[0],
          age: sAge !== null ? sAge : 22 + (hash % 38),
          gender: primarySuspect.gender || undefined,
          status: 'Active',
          riskScore: 55 + (hash % 40),
          primaryCrime: crimeType,
          arrestCount: 1,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(primarySuspect.name)}`,
          associates: [],
          history: [
            {
              date: dateTime.substring(0, 10),
              crime: crimeSubcategory,
              location: location.split(',').pop()?.trim() || 'Karnataka',
              status: convictionStatus
            }
          ],
          bio: `Tracked in connection with case index inside ${location.split(',').pop()?.trim() || 'Karnataka'}.`
        };
      }

      const createdId = await reportIncident(rawPayload, formattedIncident, formattedOffender);

      clearInterval(interval);
      if (createdId) {
        setSuccessId(createdId);
        setLoading(false);
      } else {
        setErrorMsg('Failed to submit incident report. Terminal gateway refused connection.');
        setLoading(false);
      }
    } catch (err) {
      clearInterval(interval);
      setErrorMsg('Critical failure: Core network link timeout.');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      {successId ? (
        <GlassPanel style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
          <div style={{ color: 'var(--color-success)', marginBottom: '1.5rem' }}>
            <CheckCircle size={64} style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            FIR Persisted: {successId}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
            The case file has been cryptographically signed and stored in the K-NETRA local repository file.
            All dashboard maps, charts, and table indexes have been updated in real-time.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSuccessId(null);
                clearForm();
              }}
            >
              Report New Case
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setCurrentView('dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        </GlassPanel>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Main Error Banner */}
          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '0.85rem',
              color: 'var(--color-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={18} />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-red)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.2rem',
                  borderRadius: '50%',
                  transition: 'background 0.2s',
                  outline: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                title="Dismiss Alert"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Form Loader overlay */}
          {loading && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(6, 10, 18, 0.85)',
              backdropFilter: 'blur(4px)',
              zIndex: 2000,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <RefreshCw size={40} style={{ color: 'var(--color-success)', animation: 'spin 1.2s linear infinite' }} />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'var(--font-family-mono)' }}>
                {progressMsg}
              </span>
            </div>
          )}

          <style>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .form-workspace-layout {
              display: grid;
              grid-template-columns: 280px 1fr;
              gap: 2rem;
              max-width: 1000px;
              width: 100%;
              margin: 0 auto;
              align-items: start;
            }
            .vertical-stepper-sidebar {
              background: var(--bg-secondary);
              border-radius: 12px;
              border: 1px solid var(--panel-border);
              padding: 1.5rem;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
              position: sticky;
              top: 2rem;
            }
            .active-step-workspace {
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
              min-width: 0;
            }
            .step-container {
              animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              display: flex;
              flex-direction: column;
              gap: 1.25rem;
            }
            .form-nav-btn {
              padding: 0.55rem 1.25rem;
              font-size: 0.85rem;
              font-weight: 600;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            @media (max-width: 800px) {
              .form-workspace-layout {
                grid-template-columns: 1fr;
                gap: 1.5rem;
              }
              .vertical-stepper-sidebar {
                position: static;
                padding: 1.25rem;
              }
            }
          `}</style>

          <div className="form-workspace-layout">
            {/* Left Column: Vertical Stepper Sidebar */}
            <div className="vertical-stepper-sidebar">
              {/* Step header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                paddingBottom: '0.75rem',
                marginBottom: '0.25rem'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--color-success)',
                  boxShadow: '0 0 8px var(--color-success)'
                }} />
                <span style={{ fontWeight: 600 }}>Step {currentStep} of 4</span>
              </div>

              {/* Stepper items container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
                {FORM_STEPS.map((step, idx) => {
                  const isActive = step.id === currentStep;
                  const isPassed = step.id < currentStep;

                  return (
                    <div
                      key={step.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        if (step.id < currentStep) {
                          setCurrentStep(step.id);
                        } else if (step.id > currentStep) {
                          handleNext(step.id);
                        }
                      }}
                    >
                      {/* Node container */}
                      <div style={{
                        position: 'relative',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '24px'
                      }}>
                        {/* Circle Node */}
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: isActive ? 'var(--color-blue)' : isPassed ? 'var(--color-success)' : 'var(--text-dark)',
                          background: isActive ? 'var(--bg-primary)' : isPassed ? 'var(--color-success)' : 'var(--bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isActive ? 'var(--color-blue)' : isPassed ? 'white' : 'var(--text-dark)',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          boxShadow: isActive ? '0 0 12px var(--color-blue-glow)' : 'none',
                          transition: 'all 0.3s ease'
                        }}>
                          {isPassed ? '✓' : step.id}
                        </div>

                        {/* Connector line to next circle */}
                        {idx < FORM_STEPS.length - 1 && (
                          <div style={{
                            position: 'absolute',
                            top: '24px',
                            left: '11px',
                            width: '2px',
                            height: '34px',
                            background: isPassed ? 'var(--color-success)' : 'var(--text-dark)',
                            boxShadow: isPassed ? '0 0 4px var(--color-success-glow)' : 'none',
                            transition: 'all 0.3s ease',
                            zIndex: 1
                          }} />
                        )}
                      </div>

                      {/* Labels */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                          transition: 'all 0.2s ease'
                        }}>
                          {step.label}
                        </span>
                        <span style={{
                          fontSize: '0.65rem',
                          color: 'var(--text-dark)',
                          transition: 'all 0.2s ease'
                        }}>
                          {step.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active Step Workspace */}
            <div className="active-step-workspace">

          {/* STEP 1: JURISDICTION & TIME */}
          {currentStep === 1 && (
            <div className="step-container">
              {/* SECTION 1: JURISDICTION */}
              <GlassPanel style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-success)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  1. Jurisdiction & PS Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>District / Sector Zone</label>
                    <select
                      className="report-select"
                      value={districtId}
                      onChange={e => {
                        setDistrictId(e.target.value);
                        setPoliceStation('');
                      }}
                      required
                      style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        padding: '0.55rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    >
                      <option value="">Select District</option>
                      {Object.entries(MOCK_DISTRICTS)
                        .sort((a, b) => a[1].name.localeCompare(b[1].name))
                        .map(([id, d]) => (
                          <option key={id} value={id}>{d.name}</option>
                        ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Police Station</label>
                      <select
                        className="report-select"
                        value={policeStation}
                        onChange={e => setPoliceStation(e.target.value)}
                        required
                        disabled={!districtId}
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '0.55rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          outline: 'none',
                          width: '100%'
                        }}
                      >
                        <option value="">{districtId ? "Select Police Station" : "First select a district"}</option>
                        {(DISTRICT_STATIONS[districtId] || []).map(station => (
                          <option key={station.name} value={station.name}>{station.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Station Code</label>
                      <input
                        type="text"
                        value={stationCode}
                        readOnly
                        placeholder="PS Code"
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '6px',
                          padding: '0.55rem',
                          color: 'var(--text-dark)',
                          fontSize: '0.85rem',
                          outline: 'none',
                          fontFamily: 'var(--font-family-mono)'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Incident Scene Specific Address</label>
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      required
                      placeholder="e.g. 63 Road, near Police Station Bounds, Belagavi"
                      style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        padding: '0.55rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </GlassPanel>

              {/* SECTION 2: LEGAL DETAILS */}
              <GlassPanel style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-success)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  2. Legal Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Date & Time of Occurrence</label>
                    <DateTimePicker
                      value={dateTime}
                      onChange={val => setDateTime(val)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IPC / BNS Act Sections (Comma separated)</label>
                    <input
                      type="text"
                      value={sectionsStr}
                      onChange={e => setSectionsStr(e.target.value)}
                      required
                      placeholder="e.g. IPC 379, IPC 384"
                      style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        padding: '0.55rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </GlassPanel>
            </div>
          )}

          {/* STEP 2: COMPLAINANT & VICTIMS */}
          {currentStep === 2 && (
            <div className="step-container">
              {/* SECTION 3: COMPLAINANT & VICTIMS */}
              <GlassPanel style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-success)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    3. Complainant & Victim details
                  </h3>
                </div>

                {/* COMPLAINANT SUB-SECTION */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.15)', background: 'rgba(59, 130, 246, 0.03)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="complainantSameAsVictim"
                      checked={complainantSameAsVictim}
                      onChange={(e) => setComplainantSameAsVictim(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="complainantSameAsVictim" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-blue)', cursor: 'pointer' }}>
                      Complainant is same as Victim #1
                    </label>
                  </div>

                  {complainantSameAsVictim ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Complainant details are mirrored from Victim #1.
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                        <div><strong>Name:</strong> {victims[0]?.name || 'Not Entered'}</div>
                        <div><strong>Age / Gender:</strong> {victims[0]?.age || 'Not Entered'} / {victims[0]?.gender || 'Not Entered'}</div>
                        <div><strong>Relationship to Victim:</strong> Self</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                        Complainant Details
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Complainant Name</label>
                          <input
                            type="text"
                            value={complainant.name}
                            onChange={e => setComplainant(p => ({ ...p, name: e.target.value }))}
                            required
                            placeholder="Enter complainant name"
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Age</label>
                          <input
                            type="text"
                            value={complainant.age}
                            onChange={e => setComplainant(p => ({ ...p, age: e.target.value }))}
                            required
                            placeholder="e.g. 35"
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Gender</label>
                          <select
                            className="report-select"
                            value={complainant.gender}
                            onChange={e => setComplainant(p => ({ ...p, gender: e.target.value }))}
                            required
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none',
                              width: '100%'
                            }}
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Relationship to Victim</label>
                          <input
                            type="text"
                            value={complainant.relationToVictim}
                            onChange={e => setComplainant(p => ({ ...p, relationToVictim: e.target.value }))}
                            required
                            placeholder="e.g. Parent, Sibling, Witness"
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Contact Phone</label>
                          <input
                            type="text"
                            value={complainant.contactPhone}
                            onChange={e => {
                              let val = e.target.value;
                              if (!val.startsWith('+91')) {
                                val = '+91 ' + val.replace(/^\+?9?1?\s*/, '');
                              }
                              const prefix = '+91 ';
                              const digits = val.slice(prefix.length).replace(/\D/g, '').slice(0, 10);
                              setComplainant(p => ({ ...p, contactPhone: prefix + digits }));
                            }}
                            placeholder="e.g. 98765 43210"
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID Type</label>
                          <select
                            className="report-select"
                            value={complainant.idType}
                            onChange={e => setComplainant(p => ({ ...p, idType: e.target.value }))}
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          >
                            <option value="">Select ID Type</option>
                            <option value="Aadhaar Card">Aadhaar Card</option>
                            <option value="PAN Card">PAN Card</option>
                            <option value="Passport">Passport</option>
                            <option value="Voter ID">Voter ID</option>
                            <option value="Driving License">Driving License</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID Number</label>
                          <input
                            type="text"
                            value={complainant.idNumber}
                            onChange={e => setComplainant(p => ({ ...p, idNumber: e.target.value }))}
                            placeholder="Enter ID number"
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Complainant Address</label>
                        <input
                          type="text"
                          value={complainant.address}
                          onChange={e => setComplainant(p => ({ ...p, address: e.target.value }))}
                          placeholder="Full address of the complainant"
                          style={{
                            background: 'rgba(0,0,0,0.25)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '6px',
                            padding: '0.55rem',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '1rem 0' }}></div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Victim Details
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {victims.map((victim, index) => (
                    <div key={index} style={{
                      padding: '1rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.05)',
                      background: 'rgba(0,0,0,0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      position: 'relative'
                    }}>
                      {victims.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVictim(index)}
                          style={{
                            position: 'absolute',
                            top: '0.75rem',
                            right: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: 'var(--color-red)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.borderColor = 'var(--color-red)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="Remove Victim"
                        >
                          <Minus size={14} />
                        </button>
                      )}
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                        Victim #{index + 1}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Victim Name</label>
                          <input
                            type="text"
                            value={victim.name}
                            onChange={e => updateVictim(index, 'name', e.target.value)}
                            required
                            placeholder="Enter victim name"
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Victim Age</label>
                          <input
                            type="text"
                            value={victim.age}
                            onChange={e => updateVictim(index, 'age', e.target.value)}
                            required
                            placeholder="e.g. 25"
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Victim Gender</label>
                          <select
                            className="report-select"
                            value={victim.gender}
                            onChange={e => updateVictim(index, 'gender', e.target.value)}
                            required
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none',
                              width: '100%'
                            }}
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Relation to Suspect</label>
                          <input
                            type="text"
                            value={victim.relation}
                            onChange={e => updateVictim(index, 'relation', e.target.value)}
                            required
                            placeholder="e.g. Stranger, Spouse"
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={addVictim}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'var(--color-success)';
                        e.currentTarget.style.color = 'var(--color-success)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Add Victim"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </GlassPanel>
            </div>
          )}

          {/* STEP 3: ACCUSED & CRIME DETAILS */}
          {currentStep === 3 && (
            <div className="step-container">
              {/* SECTION 4: SUSPECT DETAILS */}
              <GlassPanel style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-success)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    4. Accused / Suspect Details
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {suspects.map((suspect, index) => (
                    <div key={index} style={{
                      padding: '1rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.05)',
                      background: 'rgba(0,0,0,0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      position: 'relative'
                    }}>
                      {suspects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSuspect(index)}
                          style={{
                            position: 'absolute',
                            top: '0.75rem',
                            right: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: 'var(--color-red)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.borderColor = 'var(--color-red)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="Remove Suspect"
                        >
                          <Minus size={14} />
                        </button>
                      )}
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                        Suspect #{index + 1}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Suspect Full Name</label>
                          <input
                            type="text"
                            value={suspect.name}
                            onChange={e => updateSuspect(index, 'name', e.target.value)}
                            required
                            placeholder="Type 'Unknown' if suspect is not identified"
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Suspect Age</label>
                          <input
                            type="text"
                            value={suspect.age}
                            onChange={e => updateSuspect(index, 'age', e.target.value)}
                            placeholder="e.g. 25"
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Suspect Address</label>
                          <input
                            type="text"
                            value={suspect.address}
                            onChange={e => updateSuspect(index, 'address', e.target.value)}
                            required
                            placeholder="e.g. Gokula Road, Hubballi"
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Suspect Gender</label>
                          <select
                            className="report-select"
                            value={suspect.gender}
                            onChange={e => updateSuspect(index, 'gender', e.target.value)}
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.55rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none',
                              width: '100%'
                            }}
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={addSuspect}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'var(--color-success)';
                        e.currentTarget.style.color = 'var(--color-success)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Add Suspect"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </GlassPanel>

              {/* SECTION 5: INCIDENT CLASSIFICATION */}
              <GlassPanel style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-success)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  5. Incident Classification
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Crime Category</label>
                      <select
                        className="report-select"
                        value={crimeType}
                        onChange={e => setCrimeType(e.target.value)}
                        required
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '0.55rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      >
                        <option value="">Select Category</option>
                        {crimeTypes.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Subcategory / MOD</label>
                      <input
                        type="text"
                        value={crimeSubcategory}
                        onChange={e => setCrimeSubcategory(e.target.value)}
                        required
                        placeholder="e.g. Electricity Bill Phishing"
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '0.55rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Weapon Used</label>
                      <input
                        type="text"
                        value={weaponUsed}
                        onChange={e => setWeaponUsed(e.target.value)}
                        required
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '0.55rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vehicle No</label>
                      <input
                        type="text"
                        value={vehicleNo}
                        onChange={e => setVehicleNo(e.target.value)}
                        required
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '0.55rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Brief Case Analysis Summary Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      required
                      rows={3}
                      style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        padding: '0.55rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>
              </GlassPanel>
            </div>
          )}

          {/* STEP 4: INVESTIGATION DETAILS */}
          {currentStep === 4 && (
            <div className="step-container">
              {/* SECTION 6: INVESTIGATION DETAILS */}
              <GlassPanel style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-success)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  6. Investigation Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Investigating Officer ID</label>
                      <input
                        type="text"
                        value={officerId}
                        onChange={e => setOfficerId(e.target.value)}
                        required
                        placeholder="e.g. IO-6492"
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '0.55rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Conviction Status</label>
                      <select
                        className="report-select"
                        value={convictionStatus}
                        onChange={e => {
                          const val = e.target.value;
                          setConvictionStatus(val);
                          if (val === 'Open') {
                            setLegalStage('Under Investigation');
                            setChargeSheetFiled(false);
                          } else if (val === 'Dispatched') {
                            setLegalStage('Pending Trial');
                          } else if (val === 'Closed') {
                            setLegalStage('Convicted');
                          } else {
                            setLegalStage('');
                          }
                        }}
                        required
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '0.55rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      >
                        <option value="">Select Status</option>
                        <option value="Open">Open</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Legal Stage</label>
                      <select
                        className="report-select"
                        value={legalStage}
                        onChange={e => setLegalStage(e.target.value)}
                        required
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '0.55rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      >
                        <option value="">Select Stage</option>
                        {convictionStatus === 'Open' && (
                          <option value="Under Investigation">Under Investigation</option>
                        )}
                        {convictionStatus === 'Dispatched' && (
                          <option value="Pending Trial">Pending Trial</option>
                        )}
                        {convictionStatus === 'Closed' && (
                          <>
                            <option value="Convicted">Convicted</option>
                            <option value="Acquitted">Acquitted</option>
                          </>
                        )}
                        {!convictionStatus && (
                          <>
                            <option value="Under Investigation">Under Investigation</option>
                            <option value="Pending Trial">Pending Trial</option>
                            <option value="Convicted">Convicted</option>
                            <option value="Acquitted">Acquitted</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Investigating Officer Name</label>
                      <input
                        type="text"
                        value={officerName}
                        onChange={e => setOfficerName(e.target.value)}
                        required
                        placeholder="e.g. Rajesh Kumar"
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '0.55rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Investigating Officer Rank</label>
                      <select
                        className="report-select"
                        value={officerRank}
                        onChange={e => setOfficerRank(e.target.value)}
                        required
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '0.55rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      >
                        <option value="">Select Rank</option>
                        <option value="Sub-Inspector of Police (SI)">Sub-Inspector of Police (SI)</option>
                        <option value="Inspector of Police (PI)">Inspector of Police (PI)</option>
                        <option value="Deputy Superintendent of Police (DySP)">Deputy Superintendent of Police (DySP)</option>
                        <option value="Assistant Superintendent of Police (ASP)">Assistant Superintendent of Police (ASP)</option>
                        <option value="Additional Superintendent of Police (Addl. SP)">Additional Superintendent of Police (Addl. SP)</option>
                        <option value="Superintendent of Police (SP)">Superintendent of Police (SP)</option>
                        <option value="Senior Superintendent of Police (SSP)">Senior Superintendent of Police (SSP)</option>
                        <option value="Deputy Inspector General of Police (DIG)">Deputy Inspector General of Police (DIG)</option>
                        <option value="Inspector General of Police (IGP)">Inspector General of Police (IGP)</option>
                        <option value="Additional Director General of Police (ADGP)">Additional Director General of Police (ADGP)</option>
                        <option value="Director General of Police (DGP)">Director General of Police (DGP)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                    <input
                      type="checkbox"
                      id="chargeSheet"
                      checked={chargeSheetFiled}
                      disabled={convictionStatus === 'Open'}
                      onChange={e => setChargeSheetFiled(e.target.checked)}
                      style={{ cursor: convictionStatus === 'Open' ? 'not-allowed' : 'pointer', width: '15px', height: '15px' }}
                    />
                    <label
                      htmlFor="chargeSheet"
                      style={{
                        fontSize: '0.75rem',
                        color: convictionStatus === 'Open' ? 'var(--text-muted)' : 'var(--text-primary)',
                        cursor: convictionStatus === 'Open' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Charge Sheet Filed in Court under Sec 173 CrPC
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Evidence Summary & Findings</label>
                    <input
                      type="text"
                      value={evidenceSummary}
                      onChange={e => setEvidenceSummary(e.target.value)}
                      required
                      placeholder="e.g. UPI logs and device MAC addresses tracked"
                      style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        padding: '0.55rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </GlassPanel>
            </div>
          )}

          {/* NAVIGATION FOOTER */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.5rem',
            maxWidth: '600px',
            width: '100%',
            margin: '1.5rem auto 0 auto'
          }}>
            <div>
              {currentStep > 1 && (
                <div 
                  onClick={handlePrevious}
                  className="report-nav-btn-container"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePrevious();
                    }
                  }}
                >
                  <button
                    type="button"
                    className="report-nav-circle-btn"
                    tabIndex={-1}
                  >
                    &lt;
                  </button>
                  <span className="report-nav-btn-label">
                    Previous
                  </span>
                </div>
              )}
            </div>

            <div>
              {currentStep < 4 ? (
                <div 
                  onClick={() => handleNext()}
                  className="report-nav-btn-container"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNext();
                    }
                  }}
                >
                  <span className="report-nav-btn-label">
                    Next Step
                  </span>
                  <button
                    type="button"
                    className="report-nav-circle-btn"
                    tabIndex={-1}
                  >
                    &gt;
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem 2rem',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'var(--color-success)',
                    borderColor: 'var(--color-success)',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <FilePlus size={16} />
                  Submit Incident Report
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
      )}
    </div>
  );
}
