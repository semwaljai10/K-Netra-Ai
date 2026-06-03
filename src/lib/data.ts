// AI-Driven Crime Analytics Platform - Mock Database File (All Indian States & Districts)
// Simulating an active national policing command database centered around India

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
  age: number;
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

// 28 States & 8 Union Territories in India
export const MOCK_STATES: Record<string, StateInfo> = {
  "DL": { id: "DL", name: "Delhi", center: [28.6139, 77.2090], zoom: 10 },
  "MH": { id: "MH", name: "Maharashtra", center: [19.7515, 75.7139], zoom: 6 },
  "KA": { id: "KA", name: "Karnataka", center: [15.3173, 75.7139], zoom: 6 },
  "UP": { id: "UP", name: "Uttar Pradesh", center: [26.8467, 80.9462], zoom: 6 },
  "TN": { id: "TN", name: "Tamil Nadu", center: [11.1271, 78.6569], zoom: 6 },
  "GJ": { id: "GJ", name: "Gujarat", center: [22.2587, 71.1924], zoom: 6 },
  "WB": { id: "WB", name: "West Bengal", center: [22.9868, 87.8550], zoom: 6 },
  "RJ": { id: "RJ", name: "Rajasthan", center: [27.0238, 74.2179], zoom: 6 },
  "TG": { id: "TG", name: "Telangana", center: [18.1124, 79.0193], zoom: 7 },
  "KL": { id: "KL", name: "Kerala", center: [10.8505, 76.2711], zoom: 7 },
  "AP": { id: "AP", name: "Andhra Pradesh", center: [15.9129, 79.7400], zoom: 6 },
  "MP": { id: "MP", name: "Madhya Pradesh", center: [22.9734, 78.6569], zoom: 6 },
  "BR": { id: "BR", name: "Bihar", center: [25.0961, 85.3131], zoom: 7 },
  "PB": { id: "PB", name: "Punjab", center: [31.1471, 75.3412], zoom: 7 },
  "HR": { id: "HR", name: "Haryana", center: [29.0588, 76.0856], zoom: 7 },
  "OD": { id: "OD", name: "Odisha", center: [20.9517, 85.0985], zoom: 7 },
  "AS": { id: "AS", name: "Assam", center: [26.2006, 92.9376], zoom: 7 },
  "JK": { id: "JK", name: "Jammu & Kashmir", center: [33.7782, 76.5762], zoom: 7 },
  "LA": { id: "LA", name: "Ladakh", center: [34.1526, 77.5771], zoom: 7 },
  "GA": { id: "GA", name: "Goa", center: [15.2993, 74.1240], zoom: 9 },
  "UK": { id: "UK", name: "Uttarakhand", center: [30.0668, 79.0193], zoom: 7 },
  "HP": { id: "HP", name: "Himachal Pradesh", center: [31.1048, 77.1734], zoom: 7 },
  "JH": { id: "JH", name: "Jharkhand", center: [23.6102, 85.2799], zoom: 7 },
  "CG": { id: "CG", name: "Chhattisgarh", center: [21.2787, 81.8661], zoom: 7 },
  "CH": { id: "CH", name: "Chandigarh", center: [30.7333, 76.7794], zoom: 11 },
  "AN": { id: "AN", name: "Andaman & Nicobar", center: [11.6234, 92.7265], zoom: 8 },
  "LD": { id: "LD", name: "Lakshadweep", center: [10.5667, 72.6417], zoom: 9 },
  "PY": { id: "PY", name: "Puducherry", center: [11.9416, 79.8083], zoom: 10 },
  "DN": { id: "DN", name: "Dadra & Nagar Haveli", center: [20.3974, 72.8328], zoom: 9 },
  "AR": { id: "AR", name: "Arunachal Pradesh", center: [28.2180, 94.7278], zoom: 7 },
  "MN": { id: "MN", name: "Manipur", center: [24.6637, 93.9063], zoom: 8 },
  "ML": { id: "ML", name: "Meghalaya", center: [25.4670, 91.3662], zoom: 8 },
  "MZ": { id: "MZ", name: "Mizoram", center: [23.1645, 92.9376], zoom: 8 },
  "NL": { id: "NL", name: "Nagaland", center: [26.1584, 94.5624], zoom: 8 },
  "SK": { id: "SK", name: "Sikkim", center: [27.5330, 88.5122], zoom: 9 },
  "TR": { id: "TR", name: "Tripura", center: [23.9408, 91.9882], zoom: 8 }
};

// Complete official list of all districts for every single Indian State & Union Territory
export const STATE_DISTRICTS_LIST: Record<string, string[]> = {
  "DL": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "MH": ["Ahmednagar", "Akola", "Amravati", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Dharashiv", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal", "Chhatrapati Sambhajinagar"],
  "KA": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir", "Vijayanagara"],
  "UP": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bldshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "TN": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "GJ": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udepur", "Dahod", "Dang", "Devbhumi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  "WB": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],
  "RJ": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur", "Anupgarh", "Balotra", "Beawar", "Deeg", "Didwana-Kuchaman", "Dudu", "Gangapur City", "Jaipur Rural", "Jodhpur Rural", "Kekri", "Khairthal-Tijara", "Kotputli-Behror", "Neem Ka Thana", "Phalodi", "Salumbar", "Sanchore", "Shahpura"],
  "TG": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Hanumakonda", "Yadadri Bhuvanagiri"],
  "KL": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "AP": ["Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla", "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur", "Kakinada", "Krishna", "Kurnool", "Nandyal", "NTR", "Palnadu", "Parvathipuram Manyam", "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Sri Sathya Sai", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
  "MP": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Narmadapuram", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Niwari", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha", "Mauganj", "Maihar", "Pandhurna"],
  "BR": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "PB": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Tarn Taran", "Malerkotla"],
  "HR": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "OD": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
  "AS": ["Bajali", "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong", "Tamulpur"],
  "JK": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
  "LA": ["Leh", "Kargil"],
  "GA": ["North Goa", "South Goa"],
  "UK": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "HP": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "JH": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
  "CG": ["Balod", "Baloda Bazar", "Balrampur", "B領ar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sakti", "Sarangarh-Bilaigarh", "Sukma", "Surajpur", "Surguja", "Khairagarh-Chhuikhadan-Gandai"],
  "CH": ["Chandigarh"],
  "AN": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  "LD": ["Lakshadweep"],
  "PY": ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  "DN": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  "AR": ["Anjaw", "Changlang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke-Kessang", "Papum Pare", "Shi-Yomi", "Siang", "Tawang", "Tirap", "Upper Dibang Valley", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang", "Itanagar Capital Complex"],
  "MN": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  "ML": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills", "Eastern West Khasi Hills"],
  "MZ": ["Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Serchhip", "Hnahthial", "Khawzawl", "Saitual"],
  "NL": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto", "Noklak", "Tseminyu", "Chümoukedima", "Niuland", "Shamator"],
  "SK": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim", "Pakyong", "Soreng"],
  "TR": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sipahijala", "South Tripura", "Unakoti", "West Tripura"]
};

// Hand-picked coordinates for original mock districts to ensure backwards compatibility
const CUSTOM_OVERRIDES: Record<string, Omit<District, 'id'>> = {
  "DL_D1": { stateId: "DL", name: "New Delhi Central (Connaught Place)", center: [28.6304, 77.2177], radius: 1500 },
  "DL_D2": { stateId: "DL", name: "East Delhi Border (Anand Vihar)", center: [28.6272, 77.2784], radius: 1800 },
  "DL_D3": { stateId: "DL", name: "South Delhi Tech Corridor (Hauz Khas)", center: [28.5450, 77.2100], radius: 1600 },
  "DL_D4": { stateId: "DL", name: "North Delhi Industrial Sector (Rohini)", center: [28.6800, 77.1500], radius: 2200 },
  "MH_D1": { stateId: "MH", name: "Mumbai South CBD", center: [18.9750, 72.8258], radius: 3000 },
  "MH_D2": { stateId: "MH", name: "Pune Tech Zone", center: [18.5204, 73.8567], radius: 3500 },
  "KA_D1": { stateId: "KA", name: "Bengaluru CBD", center: [12.9716, 77.5946], radius: 4000 },
  "KA_D2": { stateId: "KA", name: "Mysuru Palace District", center: [12.2958, 76.6394], radius: 3000 },
  "UP_D1": { stateId: "UP", name: "Noida Sector 62", center: [28.5355, 77.3910], radius: 3500 },
  "UP_D2": { stateId: "UP", name: "Lucknow Hazratganj", center: [26.8467, 80.9462], radius: 3000 },
  "WB_D1": { stateId: "WB", name: "Kolkata Salt Lake", center: [22.5726, 88.3639], radius: 3500 },
  "WB_D2": { stateId: "WB", name: "Darjeeling Mall Road", center: [27.0410, 88.2627], radius: 2000 },
  "AP_D1": { stateId: "AP", name: "Visakhapatnam Harbor Zone", center: [17.6868, 83.2185], radius: 3500 },
  "AR_D1": { stateId: "AR", name: "Itanagar Core", center: [27.0844, 93.6053], radius: 2500 },
  "AS_D1": { stateId: "AS", name: "Guwahati Metropolitan", center: [26.1445, 91.7362], radius: 4000 },
  "BR_D1": { stateId: "BR", name: "Patna Urban Corridor", center: [25.5941, 85.1376], radius: 3500 },
  "CH_D1": { stateId: "CH", name: "Chandigarh Sector 17", center: [30.7333, 76.7794], radius: 3000 },
  "CG_D1": { stateId: "CG", name: "Raipur VIP Road", center: [21.2514, 81.6296], radius: 3000 },
  "DN_D1": { stateId: "DN", name: "Daman Industrial Area", center: [20.3974, 72.8328], radius: 2500 },
  "GA_D1": { stateId: "GA", name: "Panaji Waterfront", center: [15.4909, 73.8278], radius: 2000 },
  "GJ_D1": { stateId: "GJ", name: "Ahmedabad Ashram Road", center: [23.0225, 72.5714], radius: 4000 },
  "HR_D1": { stateId: "HR", name: "Gurugram Cyber City", center: [28.4595, 77.0266], radius: 3500 },
  "HP_D1": { stateId: "HP", name: "Shimla Central Ridge", center: [31.1048, 77.1734], radius: 2000 },
  "JK_D1": { stateId: "JK", name: "Srinagar Lal Chowk", center: [34.0837, 74.7973], radius: 3000 },
  "JH_D1": { stateId: "JH", name: "Ranchi Main Road", center: [23.3441, 85.3096], radius: 3000 },
  "KL_D1": { stateId: "KL", name: "Kochi Marine Drive", center: [9.9312, 76.2673], radius: 3000 },
  "LA_D1": { stateId: "LA", name: "Leh Bazar Zone", center: [34.1526, 77.5771], radius: 2000 },
  "LD_D1": { stateId: "LD", name: "Kavaratti Jetty", center: [10.5667, 72.6417], radius: 1500 },
  "MP_D1": { stateId: "MP", name: "Bhopal Lake View", center: [23.2599, 77.4126], radius: 3500 },
  "MN_D1": { stateId: "MN", name: "Imphal Kangla Fort", center: [24.8170, 93.9368], radius: 2500 },
  "ML_D1": { stateId: "ML", name: "Shillong Police Bazar", center: [25.5788, 91.8831], radius: 2000 },
  "MZ_D1": { stateId: "MZ", name: "Aizawl Chanmari Sector", center: [23.7307, 92.7173], radius: 2000 },
  "NL_D1": { stateId: "NL", name: "Kohima War Memorial Area", center: [25.6751, 94.1086], radius: 2000 },
  "OD_D1": { stateId: "OD", name: "Bhubaneswar Temple Sector", center: [20.2961, 85.8245], radius: 3000 },
  "PY_D1": { stateId: "PY", name: "Puducherry French Quarter", center: [11.9416, 79.8083], radius: 2000 },
  "PB_D1": { stateId: "PB", name: "Ludhiana Clock Tower", center: [30.9010, 75.8573], radius: 3500 },
  "RJ_D1": { stateId: "RJ", name: "Jaipur Pink City Area", center: [26.9124, 75.7873], radius: 3500 },
  "SK_D1": { stateId: "SK", name: "Gangtok MG Marg", center: [27.3314, 88.6138], radius: 1800 },
  "TN_D1": { stateId: "TN", name: "Chennai T-Nagar Market", center: [13.0827, 80.2707], radius: 3500 },
  "TG_D1": { stateId: "TG", name: "Hyderabad Hitech City", center: [17.3850, 78.4867], radius: 4000 },
  "TR_D1": { stateId: "TR", name: "Agartala Palace Road", center: [23.8315, 91.2868], radius: 2000 },
  "UK_D1": { stateId: "UK", name: "Dehradun Rajpur Road", center: [30.3165, 78.0322], radius: 3000 }
};

// Procedural Geographic Layout Engine: Spreads the 783 districts around state centers deterministically
const buildDistricts = (): Record<string, District> => {
  const districts: Record<string, District> = {};

  // 1. First, load custom overrides
  Object.entries(CUSTOM_OVERRIDES).forEach(([id, info]) => {
    districts[id] = { id, ...info };
  });

  // 2. Map all official districts procedurally
  Object.entries(STATE_DISTRICTS_LIST).forEach(([stateId, names]) => {
    const state = MOCK_STATES[stateId];
    if (!state) return;

    names.forEach((name, index) => {
      // Standardize a safe id
      const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const distId = `${stateId}_${safeName}`;

      // Check if this district is already represented via a custom override
      const isOverridden = Object.values(districts).some(
        d => d.stateId === stateId && (d.name.includes(name) || name.includes(d.name.split(' (')[0]))
      );

      if (isOverridden) return;

      // Fibonacci spiral distribution centered on state center
      const angle = (index * 137.5) * (Math.PI / 180);
      const distanceMultiplier = 0.06 + 0.02 * Math.sqrt(index + 1);
      
      // Scale radial dispersion inversely with state zoom factor
      const spreadFactor = Math.pow(2, 10 - state.zoom) * 0.14;
      const latOffset = Math.sin(angle) * distanceMultiplier * spreadFactor;
      const lonOffset = Math.cos(angle) * distanceMultiplier * spreadFactor;

      const center: [number, number] = [
        state.center[0] + latOffset,
        state.center[1] + lonOffset
      ];

      // Circular area diameter representation
      const radius = 1800 + (index % 5) * 350;

      districts[distId] = {
        id: distId,
        stateId,
        name,
        center,
        radius
      };
    });
  });

  return districts;
};

export const MOCK_DISTRICTS = buildDistricts();

export const MOCK_OFFENDERS: Offender[] = [
  {
    id: "OFF-001",
    name: "Rajesh 'Viper' Kumar",
    alias: "Viper",
    age: 34,
    status: "Active",
    riskScore: 89,
    primaryCrime: "Armed Robbery",
    arrestCount: 9,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rajesh",
    associates: ["OFF-003", "OFF-004", "OFF-007"],
    history: [
      { date: "2026-04-12", crime: "Grand Larceny", location: "New Delhi Central", status: "Released on bail" },
      { date: "2025-11-05", crime: "Armed Robbery", location: "Mumbai South CBD", status: "Served 6 months" },
      { date: "2024-08-19", crime: "Assault with Weapon", location: "New Delhi Central", status: "Charges dropped" }
    ],
    bio: "Key organizer of commercial burglaries and high-end vehicle theft. High risk of re-offending in upscale retail sectors."
  },
  {
    id: "OFF-002",
    name: "Pooja 'Ghost' Sharma",
    alias: "Ghost",
    age: 29,
    status: "Parole",
    riskScore: 64,
    primaryCrime: "Cyber Fraud & Money Laundering",
    arrestCount: 3,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Pooja",
    associates: ["OFF-005", "OFF-006"],
    history: [
      { date: "2026-02-18", crime: "Cryptocurrency Phishing", location: "Bengaluru CBD", status: "Parole active" },
      { date: "2025-04-30", crime: "Credit Card Fraud", location: "Ahmedabad Ashram Road", status: "Convicted (12m suspended)" }
    ],
    bio: "Expert cyber technician. Specializes in financial phishing nodes and darknet cryptocurrency washing schemes."
  },
  {
    id: "OFF-003",
    name: "Vikram 'Slasher' Singh",
    alias: "Slasher",
    age: 42,
    status: "Incarcerated",
    riskScore: 95,
    primaryCrime: "Extortion & Kidnapping",
    arrestCount: 14,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Vikram",
    associates: ["OFF-001", "OFF-004"],
    history: [
      { date: "2026-05-10", crime: "Armed Extortion", location: "Mumbai South CBD", status: "Arrested - No Bail" },
      { date: "2025-01-15", crime: "Assault", location: "Ranchi Main Road", status: "Charges pending" }
    ],
    bio: "Enforcer for major extortion syndicates in industrial areas. Notorious for violent reprisal operations and union hijackings."
  },
  {
    id: "OFF-004",
    name: "Amit 'Broker' Verma",
    alias: "Broker",
    age: 38,
    status: "Active",
    riskScore: 78,
    primaryCrime: "Fencing & Stolen Goods Trade",
    arrestCount: 6,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Amit",
    associates: ["OFF-001", "OFF-003", "OFF-008"],
    history: [
      { date: "2026-03-01", crime: "Possession of Stolen Goods", location: "Noida Sector 62", status: "Released on bail" },
      { date: "2024-10-12", crime: "Illegal Smelting", location: "Gurugram Cyber City", status: "Fined" }
    ],
    bio: "Broker for high-value merchandise. Runs warehouse front nodes in NCR and Pune. Essential transit link for Viper's robberies."
  },
  {
    id: "OFF-005",
    name: "Karan 'Shadow' Gill",
    alias: "Shadow",
    age: 31,
    status: "Active",
    riskScore: 82,
    primaryCrime: "Narcotics Trafficking",
    arrestCount: 8,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Karan",
    associates: ["OFF-002", "OFF-006"],
    history: [
      { date: "2026-05-20", crime: "Possession with Intent to Distribute", location: "Chennai T-Nagar Market", status: "Under investigation" },
      { date: "2025-08-11", crime: "Smuggling", location: "Mumbai South CBD", status: "Released on technicality" }
    ],
    bio: "Directs high-purity synthetic distribution channels in South India student hubs. Uses encrypted messenger apps for drop-offs."
  },
  {
    id: "OFF-006",
    name: "Nisha 'Glitch' Patel",
    alias: "Glitch",
    age: 26,
    status: "Parole",
    riskScore: 58,
    primaryCrime: "Data Theft",
    arrestCount: 2,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Nisha",
    associates: ["OFF-002", "OFF-005"],
    history: [
      { date: "2026-01-05", crime: "Unauthorized Database Access", location: "Hyderabad Hitech City", status: "Parole active" }
    ],
    bio: "System administrator gone rogue. Specializes in credentials harvesting and bypassing multi-factor firewall models."
  },
  {
    id: "OFF-007",
    name: "Deepak 'Blade' Yadav",
    alias: "Blade",
    age: 27,
    status: "Incarcerated",
    riskScore: 91,
    primaryCrime: "Violent Assault",
    arrestCount: 11,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Deepak",
    associates: ["OFF-001", "OFF-009"],
    history: [
      { date: "2026-05-15", crime: "Attempted Murder", location: "Guwahati Metropolitan", status: "Incarcerated" }
    ],
    bio: "Violent enforcer. Associated with Rajesh Kumar's heist group for armed protection. Extreme safety and recidivism risk."
  },
  {
    id: "OFF-008",
    name: "Sanjay 'Techie' Joshi",
    alias: "Techie",
    age: 36,
    status: "Parole",
    riskScore: 45,
    primaryCrime: "White Collar Embezzlement",
    arrestCount: 1,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sanjay",
    associates: ["OFF-004"],
    history: [
      { date: "2025-07-22", crime: "Bank Fraud", location: "Kolkata Salt Lake", status: "Served 9 months" }
    ],
    bio: "Corporate accountant facilitating illicit wire transfers. Assists Amit Verma in washing and routing syndicate funds."
  },
  {
    id: "OFF-009",
    name: "Arjun 'Rusty' Sen",
    alias: "Rusty",
    age: 45,
    status: "Active",
    riskScore: 73,
    primaryCrime: "Illegal Arms Sales",
    arrestCount: 7,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Arjun",
    associates: ["OFF-007"],
    history: [
      { date: "2026-03-14", crime: "Supplying Unlicensed Weapons", location: "Ludhiana Clock Tower", status: "Pending trial" }
    ],
    bio: "Illegal weapon fabricator and smuggler. Supplies custom small arms to gang clusters in border industrial sectors."
  }
];

// Procedural Incident Generator: Distributes mock incidents across all states deterministically
const buildIncidents = (districts: Record<string, District>): Incident[] => {
  // Start with the premium hand-picked heists
  const incidents: Incident[] = [
    {
      id: "INC-201",
      type: "Commercial Burglary",
      districtId: "DL_D1",
      severity: "Critical",
      timestamp: "2026-05-30T08:12:00Z",
      coords: [28.6310, 77.2185],
      offenderId: "OFF-001",
      status: "Open",
      description: "Jewelry showroom vault breached using industrial cutting torch equipment in Central Delhi. Suspects fled in dark SUV. Cell tower logs match Rajesh Kumar's burner node."
    },
    {
      id: "INC-202",
      type: "Ransomware Intrusion",
      districtId: "KA_D1",
      severity: "High",
      timestamp: "2026-05-30T06:45:00Z",
      coords: [12.9730, 77.5960],
      offenderId: "OFF-002",
      status: "Dispatched",
      description: "Tech startup local server files encrypted in Bengaluru. Hacker ransom note demands 4.5 BTC. IP routing matches known proxy chains linked to Pooja Sharma."
    },
    {
      id: "INC-203",
      type: "Protection Extortion",
      districtId: "MH_D1",
      severity: "Critical",
      timestamp: "2026-05-29T21:30:00Z",
      coords: [18.9770, 72.8280],
      offenderId: "OFF-003",
      status: "Open",
      description: "Wholesale grain traders threatened by armed enforcers demanding monthly protection payments in South Mumbai. CCTV verifies Vikram Singh's close associates."
    },
    {
      id: "INC-204",
      type: "Stolen Goods Warehousing",
      districtId: "UP_D1",
      severity: "Medium",
      timestamp: "2026-05-28T14:20:00Z",
      coords: [28.5370, 77.3930],
      offenderId: "OFF-004",
      status: "Resolved",
      description: "Raid on industrial warehouse in Noida Sector 62 uncovered 400 stolen laptop chipsets. Logistics company leased to Amit Verma's shell corporation."
    },
    {
      id: "INC-205",
      type: "Narcotics Trafficking",
      districtId: "TN_D1",
      severity: "High",
      timestamp: "2026-05-28T01:10:00Z",
      coords: [13.0840, 80.2720],
      offenderId: "OFF-005",
      status: "Open",
      description: "Intercepted courier carrying 150g synthetic meth pills near T-Nagar Market in Chennai. Drop logs coordinate with Karan Gill's distribution network."
    },
    {
      id: "INC-206",
      type: "Database Credential Harvesting",
      districtId: "TG_D1",
      severity: "Medium",
      timestamp: "2026-05-27T11:05:00Z",
      coords: [17.3870, 78.4880],
      offenderId: "OFF-006",
      status: "Resolved",
      description: "Unauthorized access warnings on city administrative portals in Hyderabad. Logins traced to a VPS server rented under Nisha Patel's alias."
    },
    {
      id: "INC-207",
      type: "Substation Wire Sabotage",
      districtId: "HR_D1",
      severity: "Low",
      timestamp: "2026-05-26T23:50:00Z",
      coords: [28.4610, 77.0280],
      offenderId: "OFF-004",
      status: "Resolved",
      description: "Copper cabling theft at Gurugram electrical substation. Scrap metals traced to Amit Verma's auto salvage sorting yard."
    },
    {
      id: "INC-208",
      type: "Border Transit Affray",
      districtId: "AS_D1",
      severity: "High",
      timestamp: "2026-05-25T18:40:00Z",
      coords: [26.1460, 91.7380],
      offenderId: "OFF-007",
      status: "Resolved",
      description: "Violent dispute between cargo drivers at Guwahati border checkpoint. Deepak Yadav identified as weapon supplier and primary instigator."
    },
    {
      id: "INC-209",
      type: "Luxury SUV Larceny Spike",
      districtId: "DL_D1",
      severity: "Medium",
      timestamp: "2026-05-24T15:30:00Z",
      coords: [28.6330, 77.2120],
      offenderId: "OFF-001",
      status: "Open",
      description: "Three luxury SUVs stolen within 4 hours in Chanakyapuri. Modus operandi bypasses keyless ignition systems, matching Rajesh Kumar's tech profile."
    },
    {
      id: "INC-210",
      type: "Corporate Accounts Diversion",
      districtId: "MH_D1",
      severity: "Low",
      timestamp: "2026-05-22T10:00:00Z",
      coords: [18.9790, 72.8220],
      offenderId: "OFF-008",
      status: "Resolved",
      description: "Audit discrepancy of 45 Lakhs INR in export custom filings in South Mumbai. Forensic banking paths led directly to accounts managed by Sanjay Joshi."
    },
    {
      id: "INC-211",
      type: "Smuggling at Sea",
      districtId: "GA_D1",
      severity: "High",
      timestamp: "2026-05-20T22:30:00Z",
      coords: [15.4920, 73.8290],
      offenderId: "OFF-009",
      status: "Open",
      description: "Offshore interception of speed boat carrying contraband near Panaji coastline. Navigational GPS linked back to Arjun Sen's weapons cache."
    },
    {
      id: "INC-212",
      type: "Card Skimming Ring",
      districtId: "GJ_D1",
      severity: "Medium",
      timestamp: "2026-05-18T12:00:00Z",
      coords: [23.0240, 72.5730],
      offenderId: "OFF-002",
      status: "Resolved",
      description: "Algorithmic correlation matches multiple cloned credit cards used on Ashram Road, Ahmedabad. Digital tags link to Pooja Sharma's proxies."
    },
    {
      id: "INC-213",
      type: "Illegal Weapons Lab",
      districtId: "PB_D1",
      severity: "Critical",
      timestamp: "2026-05-15T10:30:00Z",
      coords: [30.9030, 75.8590],
      offenderId: "OFF-009",
      status: "Open",
      description: "Clandestine firearms assembly workshop uncovered in Ludhiana industrial park. Small arms configurations verify Arjun Sen's custom blueprint."
    },
    {
      id: "INC-214",
      type: "Bank Wire Impersonation",
      districtId: "WB_D1",
      severity: "Low",
      timestamp: "2026-05-12T14:40:00Z",
      coords: [22.5740, 88.3650],
      offenderId: "OFF-008",
      status: "Resolved",
      description: "Phishing attack redirection on corporate accounting firm in Salt Lake, Kolkata. diversion paths match Sanjay Joshi's fund routing."
    },
    {
      id: "INC-215",
      type: "Coal Truck Extortion",
      districtId: "JH_D1",
      severity: "High",
      timestamp: "2026-05-10T09:20:00Z",
      coords: [23.3460, 85.3110],
      offenderId: "OFF-003",
      status: "Open",
      description: "Coal transportation trucks hijacked and held for ransom on Ranchi bypass route. Assailants identified as Vikram Singh's mining syndicate enforcers."
    }
  ];

  // Procedural generator targeting remaining districts
  const crimeTypes = [
    { type: "Commercial Burglary", severity: "Medium" as const },
    { type: "Residential Theft", severity: "Low" as const },
    { type: "Narcotics Distribution", severity: "High" as const },
    { type: "Cyber Fraud Node", severity: "Medium" as const },
    { type: "Protection Extortion", severity: "High" as const },
    { type: "Armed Assault", severity: "Critical" as const },
    { type: "Vehicle Larceny", severity: "Low" as const },
    { type: "Illegal Weapons Trade", severity: "Critical" as const }
  ];

  const statuses = ["Open" as const, "Dispatched" as const, "Resolved" as const];
  const districtList = Object.values(districts);

  // Distribute 140 deterministic incidents throughout India
  for (let i = 0; i < 140; i++) {
    const dist = districtList[(i * 29) % districtList.length];

    // Avoid cluttering core override districts
    if (dist.id.endsWith("_D1") || dist.id.endsWith("_D2") || dist.id.endsWith("_D3") || dist.id.endsWith("_D4")) {
      continue;
    }

    const typeInfo = crimeTypes[(i * 7) % crimeTypes.length];
    const status = statuses[(i * 13) % statuses.length];

    // Slight variance around center coordinates
    const latOffset = Math.sin(i * 1.5) * 0.012;
    const lonOffset = Math.cos(i * 1.5) * 0.012;
    const coords: [number, number] = [
      dist.center[0] + latOffset,
      dist.center[1] + lonOffset
    ];

    const dayOffset = (i % 20);
    const date = new Date("2026-05-30T10:00:00Z");
    date.setDate(date.getDate() - dayOffset);
    date.setHours(8 + (i % 12), (i * 13) % 60, 0);

    const offenderId = (i % 4 === 0) ? `OFF-00${1 + (i % 9)}` : null;

    incidents.push({
      id: `INC-GEN-${2000 + i}`,
      type: typeInfo.type,
      districtId: dist.id,
      severity: typeInfo.severity,
      timestamp: date.toISOString(),
      coords,
      offenderId,
      status,
      description: `Tactical telemetry signal triggered: Suspected incident of ${typeInfo.type.toLowerCase()} reported in the vicinity of ${dist.name}. Patrol unit assigned and responding under status ${status}.`
    });
  }

  return incidents;
};

export const MOCK_INCIDENTS = buildIncidents(MOCK_DISTRICTS);

// Socio-Economic Profiles: Deterministic generation of socio-economic statistics for all 783 districts
const buildSocioEconomic = (districts: Record<string, District>): SocioEconomicData[] => {
  const data: SocioEconomicData[] = [
    { districtId: "DL_D1", districtName: "New Delhi Central", unemploymentRate: 4.2, avgIncome: 125, streetLighting: 92, policePatrol: 8, crimeRate: 21.5 },
    { districtId: "DL_D2", districtName: "East Delhi Border", unemploymentRate: 9.8, avgIncome: 35, streetLighting: 48, policePatrol: 4, crimeRate: 58.2 },
    { districtId: "DL_D3", districtName: "South Delhi Tech Corridor", unemploymentRate: 3.5, avgIncome: 110, streetLighting: 88, policePatrol: 7, crimeRate: 15.6 },
    { districtId: "DL_D4", districtName: "North Delhi Industrial Sector", unemploymentRate: 8.5, avgIncome: 45, streetLighting: 55, policePatrol: 5, crimeRate: 46.8 },
    { districtId: "MH_D1", districtName: "Mumbai South CBD", unemploymentRate: 3.8, avgIncome: 135, streetLighting: 90, policePatrol: 8, crimeRate: 19.8 },
    { districtId: "MH_D2", districtName: "Pune Tech Zone", unemploymentRate: 4.1, avgIncome: 105, streetLighting: 85, policePatrol: 7, crimeRate: 18.2 },
    { districtId: "KA_D1", districtName: "Bengaluru CBD", unemploymentRate: 3.2, avgIncome: 120, streetLighting: 93, policePatrol: 8, crimeRate: 16.5 },
    { districtId: "KA_D2", districtName: "Mysuru Palace District", unemploymentRate: 5.6, avgIncome: 65, streetLighting: 75, policePatrol: 6, crimeRate: 22.4 },
    { districtId: "UP_D1", districtName: "Noida Sector 62", unemploymentRate: 6.8, avgIncome: 85, streetLighting: 80, policePatrol: 6, crimeRate: 34.5 },
    { districtId: "UP_D2", districtName: "Lucknow Hazratganj", unemploymentRate: 7.2, avgIncome: 55, streetLighting: 70, policePatrol: 5, crimeRate: 29.8 },
    { districtId: "WB_D1", districtName: "Kolkata Salt Lake", unemploymentRate: 6.1, avgIncome: 75, streetLighting: 82, policePatrol: 7, crimeRate: 24.1 },
    { districtId: "WB_D2", districtName: "Darjeeling Mall Road", unemploymentRate: 8.4, avgIncome: 40, streetLighting: 60, policePatrol: 4, crimeRate: 32.7 }
  ];

  // Map remaining entries
  Object.values(districts).forEach((dist) => {
    const exists = data.some(d => d.districtId === dist.id);
    if (exists) return;

    // Use deterministic hash of district ID to keep profiles stable
    const hash = dist.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const unemploymentRate = parseFloat((3.5 + (hash % 85) / 10).toFixed(1));
    const avgIncome = 28 + (hash % 113);
    const streetLighting = 45 + (hash % 51);
    const policePatrol = 3 + (hash % 7);

    // Negative indicators lead to higher baseline crime rate
    const baseline = 28 + (unemploymentRate * 2.2) - (avgIncome * 0.12) - (streetLighting * 0.08) - (policePatrol * 0.7);
    const crimeRate = parseFloat(Math.max(6.0, Math.min(88.0, baseline + (hash % 13))).toFixed(1));

    data.push({
      districtId: dist.id,
      districtName: dist.name,
      unemploymentRate,
      avgIncome,
      streetLighting,
      policePatrol,
      crimeRate
    });
  });

  return data;
};

export const MOCK_SOCIO_ECONOMIC = buildSocioEconomic(MOCK_DISTRICTS);

export const MOCK_ANOMALIES: Anomaly[] = [
  {
    id: "ALRT-101",
    title: "Burglary Spike Detected",
    districtId: "DL_D1",
    type: "Spike Anomaly",
    probability: 94.2,
    description: "A 350% increase in high-severity commercial burglaries has been detected in Delhi - Connaught Place over the past 7 days. Modus operandi matches Viper group.",
    severity: "Critical",
    timestamp: "2026-05-30T08:00:00Z"
  },
  {
    id: "ALRT-102",
    title: "Extortion Surge Warning",
    districtId: "MH_D1",
    type: "Pattern Matching",
    probability: 88.5,
    description: "Protection extortion signals rising in Mumbai South CBD warehouses. Algorithmic telemetry suggests links to Vikram Singh's associates.",
    severity: "High",
    timestamp: "2026-05-29T17:45:00Z"
  },
  {
    id: "ALRT-103",
    title: "Cyber Phishing Operations",
    districtId: "KA_D1",
    type: "Network Attack",
    probability: 72.1,
    description: "Crypto diversion phishing servers actively registered. Phishing nodes point to coordinates inside Bengaluru CBD.",
    severity: "Medium",
    timestamp: "2026-05-28T11:30:00Z"
  }
];

export const AI_SIMULATION_WEIGHTS = {
  unemployment: 1.85,    // positive impact on crime
  income: -0.45,         // negative impact on crime
  lighting: -0.95,       // negative impact on crime
  patrol: -1.40          // negative impact on crime
};
