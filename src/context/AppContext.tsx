'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  MOCK_INCIDENTS, MOCK_OFFENDERS, MOCK_ANOMALIES, MOCK_DISTRICTS,
  MOCK_SYNDICATE_LINKS, MOCK_SYNDICATE_CLUSTERS, MOCK_CENTRALITY_MAP,
  Incident, Offender, Anomaly, SyndicateLink, SyndicateCluster, CentralityData,
  rawCrimeData, adaptSupabaseRecord, processRawIncidentsData, mapCaseStatusToConviction
} from '@/lib/data';
import { ALL_SIGNAL_TYPES } from '@/lib/syndicateAnalysis';
import { supabase } from '@/lib/supabase';

export type ActiveView = 'dashboard' | 'map' | 'network' | 'offenders' | 'socio' | 'predictor' | 'admin' | 'profile' | 'report';
export type ThemeMode = 'system' | 'light' | 'dark';

interface AppContextType {
  currentView: ActiveView;
  setCurrentView: (view: ActiveView) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  severityFilter: string;
  setSeverityFilter: (severity: string) => void;
  selectedStateId: string;
  setSelectedStateId: (stateId: string) => void;
  districtFilter: string;
  setDistrictFilter: (districtId: string) => void;
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  selectedOffenderId: string | null;
  setSelectedOffenderId: (id: string | null) => void;
  incidents: Incident[];
  offenders: Offender[];
  anomalies: Anomaly[];
  filteredIncidents: Incident[];
  resetFilters: () => void;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  sessionTerminationReason: string | null;
  setSessionTerminationReason: (reason: string | null) => void;
  currentUser: {
    username: string;
    name: string;
    role: string;
    isAdmin: boolean;
    level?: number;
    email?: string;
    phone?: string;
    department?: string;
    badgeNumber?: string;
    joinedDate?: string;
    mustChangePassword?: boolean;
  } | null;
  fetchAuditLogs: (searchUser?: string) => Promise<any[]>;
  fetchUsers: () => Promise<{ normal: any[]; admin: any[] }>;
  createUser: (user: { name: string; role: string; phone: string }, type: 'normal' | 'admin', level?: number) => Promise<{ username: string; otp: string }>;
  deleteUser: (username: string, type: 'normal' | 'admin') => Promise<boolean>;
  updateProfile: (details: { name: string; role: string; email: string; phone: string; department: string }) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  terminateSession: (username: string) => Promise<boolean>;
  reportIncident: (newRecord: any, formattedIncident: Incident, newOffender?: Offender) => Promise<string | null>;
  verifyCredentials: (username: string, password: string) => Promise<{ valid: boolean; name: string; username: string }>;
  updateIncidentStatus: (incidentId: string, newRawStatus: string, remarks: string, modifiedBy: string, modifiedByUserId: string, closureDetails?: any, chargeSheetFiled?: boolean) => Promise<void>;
  // Syndicate analysis
  syndicateLinks: SyndicateLink[];
  syndicateClusters: SyndicateCluster[];
  centralityMap: Map<string, CentralityData>;
  selectedSyndicateId: string | null;
  setSelectedSyndicateId: (id: string | null) => void;
  linkStrengthFilter: number;
  setLinkStrengthFilter: (value: number) => void;
  activeSignalFilters: string[];
  setActiveSignalFilters: (signals: string[]) => void;
  highlightedNodeId: string | null;
  setHighlightedNodeId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Base64 encoding helpers for URL-safe path params
const toUrlSafeBase64 = (str: string) => {
  try {
    let standardBase64 = '';
    if (typeof window !== 'undefined') {
      standardBase64 = window.btoa(unescape(encodeURIComponent(str)));
    } else {
      standardBase64 = Buffer.from(str, 'utf8').toString('base64');
    }
    return standardBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (e) {
    console.error('Base64 encode error:', e);
    return '';
  }
};

const fromUrlSafeBase64 = (base64: string) => {
  try {
    let str = base64.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    if (typeof window !== 'undefined') {
      return decodeURIComponent(escape(window.atob(str)));
    } else {
      return Buffer.from(str, 'base64').toString('utf8');
    }
  } catch (e) {
    console.error('Base64 decode error:', e);
    return '';
  }
};

const fetchDbValue = async (key: string): Promise<string> => {
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get', key })
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      if (json.error) {
        throw new Error(`Server returned error: ${json.error}`);
      }
      const val = json.data || '';
      if (val === 'Value Not Found' || val === 'Not Found' || val.includes('error')) {
        return '';
      }
      return val;
    } catch (parseErr) {
      const snippet = text.substring(0, 80).replace(/\s+/g, ' ');
      throw new Error(`Invalid JSON: "${snippet}"`);
    }
  } catch (err: any) {
    throw new Error(`fetchDbValue('${key}') failed: ${err.message || err}`);
  }
};

const updateDbValue = async (key: string, value: string): Promise<boolean> => {
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', key, value })
  });
  if (!res.ok) {
    throw new Error(`Failed to update key "${key}" via proxy: ${res.status}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`Failed to update key "${key}" via proxy: ${json.error}`);
  }
  return !!json.success;
};


// Delimited string format: "user|ip|loc|time|dev|timestamp"
const encodeLogs = (logsList: any[]) => {
  return logsList.map(log => {
    const clean = (val: any) => val ? String(val).replace(/[|;]/g, ' ') : ''; // remove delimiters
    return `${clean(log.user)}|${clean(log.ip)}|${clean(log.loc)}|${clean(log.time)}|${clean(log.dev)}|${clean(log.timestamp || '')}`;
  }).join(';');
};

const decodeLogs = (encodedStr: string) => {
  if (!encodedStr || encodedStr === 'Not Found' || encodedStr.includes('error')) return [];
  try {
    const decodedStr = fromUrlSafeBase64(encodedStr);
    if (!decodedStr) return [];
    return decodedStr.split(';').map(row => {
      const parts = row.split('|');
      return {
        user: parts[0] || 'Unknown',
        ip: parts[1] || 'Unknown',
        loc: parts[2] || 'Unknown',
        time: parts[3] || 'Unknown',
        dev: parts[4] || 'Unknown',
        timestamp: parts[5] ? Number(parts[5]) : 0
      };
    });
  } catch (err) {
    console.error('Failed to decode logs:', err);
    return [];
  }
};

const encryptPassword = (password: string): string => {
  if (!password) return '';
  const key = 'AETHER_SECURE_2026';
  let xorStr = '';
  for (let i = 0; i < password.length; i++) {
    xorStr += String.fromCharCode(password.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  let base64 = '';
  if (typeof window !== 'undefined') {
    base64 = window.btoa(unescape(encodeURIComponent(xorStr)));
  } else {
    base64 = Buffer.from(xorStr, 'utf8').toString('base64');
  }
  return 'enc_' + base64;
};

const decryptPassword = (encrypted: string): string => {
  if (!encrypted) return '';
  if (!encrypted.startsWith('enc_')) return encrypted;
  const base64Part = encrypted.substring(4);
  const key = 'AETHER_SECURE_2026';
  try {
    let xorStr = '';
    if (typeof window !== 'undefined') {
      xorStr = decodeURIComponent(escape(window.atob(base64Part)));
    } else {
      xorStr = Buffer.from(base64Part, 'base64').toString('utf8');
    }
    let result = '';
    for (let i = 0; i < xorStr.length; i++) {
      result += String.fromCharCode(xorStr.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch (e) {
    console.error('Password decryption error:', e);
    return encrypted;
  }
};

const decodeUsers = (encodedStr: string) => {
  if (!encodedStr || encodedStr === 'Not Found' || encodedStr.includes('error')) return [];
  try {
    const decodedStr = fromUrlSafeBase64(encodedStr);
    if (!decodedStr) return [];
    
    // Check if it's JSON (starts with '[') or delimited format
    if (decodedStr.trim().startsWith('[')) {
      const list = JSON.parse(decodedStr);
      return list.map((u: any) => ({
        ...u,
        password: decryptPassword(u.password)
      }));
    }
    
    return decodedStr.split(';').map(row => {
      const parts = row.split('|');
      return {
        username: parts[0] || '',
        password: decryptPassword(parts[1] || ''),
        mustChangePassword: parts[2] === '1',
        name: parts[3] || '',
        role: parts[4] || '',
        level: parts[5] ? Number(parts[5]) : undefined,
        phone: parts[6] || ''
      };
    }).filter(u => u.username && u.username.trim());
  } catch (err) {
    console.error('Failed to decode users:', err);
    return [];
  }
};

const encodeUsers = (usersList: any[]) => {
  try {
    const delimitedStr = usersList.map(u => {
      const clean = (val: any) => val ? String(val).replace(/[|;]/g, ' ') : '';
      const encPass = encryptPassword(u.password);
      return `${clean(u.username)}|${encPass}|${u.mustChangePassword ? '1' : '0'}|${clean(u.name)}|${clean(u.role)}|${u.level !== undefined ? u.level : ''}|${clean(u.phone)}`;
    }).join(';');
    return toUrlSafeBase64(delimitedStr);
  } catch (err) {
    console.error('Failed to encode users:', err);
    return '';
  }
};

const getDeviceDetails = () => {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  if (ua.indexOf('Win') !== -1) os = 'Windows';
  else if (ua.indexOf('Mac') !== -1) os = 'macOS';
  else if (ua.indexOf('Linux') !== -1) os = 'Linux';
  else if (ua.indexOf('Android') !== -1) os = 'Android';
  else if (ua.indexOf('like Mac') !== -1) os = 'iOS';

  let browser = 'Unknown Browser';
  if (ua.indexOf('Chrome') !== -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') !== -1) browser = 'Safari';
  else if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
  else if (ua.indexOf('Edge') !== -1) browser = 'Edge';

  return `${browser} (${os})`;
};

const getPreciseLocation = (): Promise<string | null> => {
  if (typeof window === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      (error) => {
        console.warn('Geolocation permission or lookup failed:', error.message);
        resolve(null);
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  });
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedStateId, setSelectedStateId] = useState('KA');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedOffenderId, setSelectedOffenderId] = useState<string | null>(null);
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sessionTerminationReason, setSessionTerminationReason] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    name: string;
    role: string;
    isAdmin: boolean;
    level?: number;
    email?: string;
    phone?: string;
    department?: string;
    badgeNumber?: string;
    joinedDate?: string;
    mustChangePassword?: boolean;
  } | null>(null);


  // Syndicate analysis state
  const [selectedSyndicateId, setSelectedSyndicateId] = useState<string | null>(null);
  const [linkStrengthFilter, setLinkStrengthFilter] = useState<number>(0.30);
  const [activeSignalFilters, setActiveSignalFilters] = useState<string[]>([...ALL_SIGNAL_TYPES]);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  const [rawIncidents, setRawIncidents] = useState<any[]>(() => [...rawCrimeData]);

  const {
    incidents,
    offenders,
    syndicateLinks,
    syndicateClusters,
    centralityMap
  } = useMemo(() => {
    return processRawIncidentsData(rawIncidents);
  }, [rawIncidents]);


  // Load session from storage during runtime
  useEffect(() => {
    const session = localStorage.getItem('aether_session');
    if (session === 'authorized') {
      setIsAuthenticated(true);
      const username = localStorage.getItem('aether_username') || 'v27022004';
      const name = localStorage.getItem('aether_operator_name') || 'Officer A. Sharma';
      const role = localStorage.getItem('aether_operator_role') || 'Control Room';
      const isAdmin = localStorage.getItem('aether_operator_is_admin') === 'true';
      const levelStr = localStorage.getItem('aether_operator_level');
      const level = levelStr ? Number(levelStr) : undefined;
      const email = localStorage.getItem('aether_operator_email') || `${username}@k-netra.gov.in`;
      const phone = localStorage.getItem('aether_operator_phone') || '+91 98765 43210';
      const department = localStorage.getItem('aether_operator_department') || 'Karnataka Tactical Unit';
      const badgeNumber = localStorage.getItem('aether_operator_badge') || `${isAdmin ? 'BADGE-A' : 'BADGE-V'}-${username.substring(1)}`;
      const joinedDate = localStorage.getItem('aether_operator_joined') || '2024-03-15';
      const mustChangePassword = localStorage.getItem('aether_operator_must_change_password') === 'true';
      
      setCurrentUser({
        username,
        name,
        role,
        isAdmin,
        level,
        email,
        phone,
        department,
        badgeNumber,
        joinedDate,
        mustChangePassword
      });
    }
  }, []);

  // Load theme from storage during runtime
  useEffect(() => {
    const savedTheme = localStorage.getItem('aether_theme') as ThemeMode;
    if (savedTheme && ['system', 'light', 'dark'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('aether_theme', newTheme);
  };

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      let targetTheme: 'light' | 'dark' = 'dark';

      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        targetTheme = systemPrefersDark ? 'dark' : 'light';
      } else {
        targetTheme = theme;
      }

      setResolvedTheme(targetTheme);

      if (targetTheme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const logout = () => {
    if (typeof window !== 'undefined') {
      const username = localStorage.getItem('aether_username');
      if (username) {
        updateDbValue(`active_session_${username.trim().toLowerCase()}`, '').catch(err => {
          console.error('Failed to clear remote session ID on logout:', err);
        });
      }
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('aether_session');
    localStorage.removeItem('aether_session_id');
    localStorage.removeItem('aether_username');
    localStorage.removeItem('aether_operator_name');
    localStorage.removeItem('aether_operator_role');
    localStorage.removeItem('aether_operator_is_admin');
    localStorage.removeItem('aether_operator_level');
    localStorage.removeItem('aether_operator_email');
    localStorage.removeItem('aether_operator_phone');
    localStorage.removeItem('aether_operator_department');
    localStorage.removeItem('aether_operator_badge');
    localStorage.removeItem('aether_operator_joined');
    localStorage.removeItem('aether_operator_must_change_password');
  };

  const fetchUsers = async () => {
    let normal: any[] = [];
    let admin: any[] = [];
    
    try {
      const rawNormal = await fetchDbValue('normal_users');
      normal = decodeUsers(rawNormal);
    } catch (e) {
      console.error('Failed to fetch normal users:', e);
      throw e;
    }
    
    try {
      const rawAdmin = await fetchDbValue('admin_users');
      admin = decodeUsers(rawAdmin);
    } catch (e) {
      console.error('Failed to fetch admin users:', e);
      throw e;
    }
    
    return {
      normal: normal.map(u => ({
        ...u,
        name: u.name || (u.username.toLowerCase() === 'v27022004' ? 'Officer A. Sharma' : 'Officer'),
        role: u.role || 'Control Room'
      })),
      admin: admin.map(u => ({
        ...u,
        name: u.name || (u.username.toLowerCase() === 'a11022004' ? 'Administrator' : u.username.toLowerCase() === 'a35999562' ? 'Jai vardhan' : 'System Admin'),
        role: u.role || (u.level === 2 ? 'System administrator L2' : 'System administrator L1')
      }))
    };
  };

  const createUser = async (
    user: { name: string; role: string; phone: string },
    type: 'normal' | 'admin',
    level?: number
  ): Promise<{ username: string; otp: string }> => {
    const { normal, admin } = await fetchUsers();
    
    const existingUsernames = [
      ...normal.map(u => u?.username).filter(Boolean),
      ...admin.map(u => u?.username).filter(Boolean)
    ];
    
    const prefix = type === 'admin' ? 'A' : 'V';
    let newUsername = '';
    while (true) {
      let digits = '';
      for (let i = 0; i < 8; i++) {
        digits += Math.floor(Math.random() * 10);
      }
      const attempt = prefix + digits;
      const lowerExisting = existingUsernames.map(u => String(u).toLowerCase());
      if (!lowerExisting.includes(attempt.toLowerCase())) {
        newUsername = attempt;
        break;
      }
    }

    // Generate 6-digit numeric OTP
    let otp = '';
    for (let i = 0; i < 6; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    
    // Simulate SMS dispatch
    console.log(`[SMS GATEWAY] Securely dispatched 6-digit access OTP ${otp} to operator number: ${user.phone}`);
    
    if (type === 'admin') {
      const newUser = {
        username: newUsername,
        password: otp,
        mustChangePassword: true,
        name: user.name,
        role: user.role,
        level: level || 1,
        phone: user.phone
      };
      const updatedAdmins = [...admin, newUser];
      const encoded = encodeUsers(updatedAdmins);
      await updateDbValue('admin_users', encoded);
    } else {
      const newUser = {
        username: newUsername,
        password: otp,
        mustChangePassword: true,
        name: user.name,
        role: user.role,
        phone: user.phone
      };
      const updatedNormals = [...normal, newUser];
      const encoded = encodeUsers(updatedNormals);
      await updateDbValue('normal_users', encoded);
    }
    
    return { username: newUsername, otp };
  };

  const deleteUser = async (username: string, type: 'normal' | 'admin'): Promise<boolean> => {
    const { normal, admin } = await fetchUsers();
    const cleanUsername = username.trim().toLowerCase();
    
    const loggedInUser = localStorage.getItem('aether_username');
    if (loggedInUser && loggedInUser.trim().toLowerCase() === cleanUsername) {
      console.warn('Cannot delete self.');
      return false;
    }
    
    if (type === 'admin') {
      const updatedAdmins = admin.filter(u => u.username.trim().toLowerCase() !== cleanUsername);
      if (updatedAdmins.length === admin.length) return false;
      const encoded = encodeUsers(updatedAdmins);
      await updateDbValue('admin_users', encoded);
    } else {
      const updatedNormals = normal.filter(u => u.username.trim().toLowerCase() !== cleanUsername);
      if (updatedNormals.length === normal.length) return false;
      const encoded = encodeUsers(updatedNormals);
      await updateDbValue('normal_users', encoded);
    }
    
    return true;
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setSessionTerminationReason(null);
    await new Promise(resolve => setTimeout(resolve, 1400));
    
    const cleanUsername = username.trim().toLowerCase();
    let isAuthorized = false;
    let operatorName = '';
    let operatorRole = '';
    let isAdmin = false;
    let level: number | undefined = undefined;

    const { normal, admin } = await fetchUsers();

    const normalUser = normal.find(u => u.username.trim().toLowerCase() === cleanUsername);
    const adminUser = admin.find(u => u.username.trim().toLowerCase() === cleanUsername);

    if (normalUser && normalUser.password === password) {
      operatorName = normalUser.name;
      operatorRole = normalUser.role;
      isAdmin = false;
      isAuthorized = true;
    } else if (adminUser && adminUser.password === password) {
      operatorName = adminUser.name;
      operatorRole = adminUser.role;
      isAdmin = true;
      level = adminUser.level || 1;
      isAuthorized = true;
    }

    if (isAuthorized) {
      const newSessionId = typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      localStorage.setItem('aether_session', 'authorized');
      localStorage.setItem('aether_session_id', newSessionId);
      localStorage.setItem('aether_username', cleanUsername);
      localStorage.setItem('aether_operator_name', operatorName);
      localStorage.setItem('aether_operator_role', operatorRole);
      localStorage.setItem('aether_operator_is_admin', isAdmin ? 'true' : 'false');
      if (level !== undefined) {
        localStorage.setItem('aether_operator_level', String(level));
      } else {
        localStorage.removeItem('aether_operator_level');
      }

      const userObj = adminUser || normalUser;
      const mustChangePassword = userObj?.mustChangePassword || false;
      const details = {
        username: cleanUsername,
        name: operatorName,
        role: operatorRole,
        isAdmin,
        level,
        email: userObj?.email || `${cleanUsername}@k-netra.gov.in`,
        phone: userObj?.phone || '+91 98765 43210',
        department: userObj?.department || 'Karnataka Tactical Unit',
        badgeNumber: userObj?.badgeNumber || `${isAdmin ? 'BADGE-A' : 'BADGE-V'}-${cleanUsername.substring(1)}`,
        joinedDate: userObj?.joinedDate || '2024-03-15',
        mustChangePassword
      };

      localStorage.setItem('aether_operator_email', details.email);
      localStorage.setItem('aether_operator_phone', details.phone);
      localStorage.setItem('aether_operator_department', details.department);
      localStorage.setItem('aether_operator_badge', details.badgeNumber);
      localStorage.setItem('aether_operator_joined', details.joinedDate);
      localStorage.setItem('aether_operator_must_change_password', mustChangePassword ? 'true' : 'false');

      setCurrentUser(details);
      
      try {
        await updateDbValue(`active_session_${cleanUsername}`, newSessionId);
      } catch (err) {
        console.error('Failed to sync session ID with remote server:', err);
      }

      try {
        let ip = '127.0.0.1';
        let loc = 'Local Loopback';
        
        try {
          const ipRes = await fetch('https://ipapi.co/json/');
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            ip = ipData.ip || '127.0.0.1';
            const city = ipData.city || '';
            const region = ipData.region || '';
            const country = ipData.country_name || '';
            loc = [city, region, country].filter(Boolean).join(', ') || 'Unknown Location';
          }
        } catch (err) {
          console.error('Failed to retrieve geo-IP metadata:', err);
        }

        try {
          const gpsLoc = await getPreciseLocation();
          if (gpsLoc) {
            loc = `${loc} (GPS: ${gpsLoc})`;
          }
        } catch (err) {
          console.error('Failed to retrieve precise GPS coordinates:', err);
        }

        const dev = getDeviceDetails();
        const logTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const newLog = {
          user: adminUser ? adminUser.username : (normalUser ? normalUser.username : cleanUsername.toUpperCase()),
          ip,
          loc,
          time: logTime,
          dev,
          timestamp: Date.now()
        };

        let currentLogs: any[] = [];
        try {
          const rawLogs = await fetchDbValue(`audit_logs_${cleanUsername}`);
          currentLogs = decodeLogs(rawLogs);
        } catch (e) {
          console.warn('No active audit logs or failed to fetch:', e);
        }

        currentLogs.unshift(newLog);
        const limitedLogs = currentLogs.slice(0, 8);
        
        const encodedLogs = encodeLogs(limitedLogs);
        const encodedBase64 = toUrlSafeBase64(encodedLogs);

        await updateDbValue(`audit_logs_${cleanUsername}`, encodedBase64);
      } catch (err) {
        console.error('Failed to update audit log:', err);
      }
      
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const fetchAuditLogs = async (searchUser?: string) => {
    let usernames: string[] = [];
    try {
      const { normal, admin } = await fetchUsers();
      const dbUsernames = [
        ...normal.map(u => u.username.trim().toLowerCase()),
        ...admin.map(u => u.username.trim().toLowerCase())
      ];
      
      if (searchUser && searchUser.trim()) {
        const cleanSearch = searchUser.trim().toLowerCase();
        usernames = [cleanSearch];
      } else {
        usernames = Array.from(new Set(dbUsernames));
      }
    } catch (e) {
      console.error('Failed to fetch user database for dynamic log audit:', e);
      if (searchUser && searchUser.trim()) {
        usernames = [searchUser.trim().toLowerCase()];
      }
    }

    let allLogs: any[] = [];
    try {
      await Promise.all(usernames.map(async (uname) => {
        try {
          const activeSessionId = await fetchDbValue(`active_session_${uname}`);
          if (activeSessionId && activeSessionId !== 'terminated') {
            const rawLogs = await fetchDbValue(`audit_logs_${uname}`);
            if (rawLogs) {
              const decoded = decodeLogs(rawLogs);
              if (decoded.length > 0) {
                // Only return the most recent log of the active session
                allLogs.push(decoded[0]);
              }
            }
          }
        } catch (e) {
          console.error(`Failed to fetch logs for ${uname}:`, e);
        }
      }));
      
      allLogs.sort((a, b) => {
        const timeA = a.timestamp || new Date(a.time).getTime() || 0;
        const timeB = b.timestamp || new Date(b.time).getTime() || 0;
        return timeB - timeA;
      });
      
      return allLogs;
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
    return [];
  };

  // Periodically check if active session ID on remote server matches local session ID
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSessionActivity = async () => {
      const localSessionId = localStorage.getItem('aether_session_id');
      const username = localStorage.getItem('aether_username');
      if (!localSessionId || !username) return;

      try {
        const remoteSessionId = await fetchDbValue(`active_session_${username.trim().toLowerCase()}`);
        if (remoteSessionId) {
          if (remoteSessionId === 'terminated') {
            console.warn('[SECURITY] Session terminated by administrator.');
            setSessionTerminationReason('terminated');
            logout();
          } else if (remoteSessionId !== localSessionId) {
            console.warn('[SECURITY] Multi-device login detected. Logging out of this session.');
            setSessionTerminationReason('new-login');
            logout();
          }
        }
      } catch (err) {
        console.error('Error polling remote session state:', err);
      }
    };

    checkSessionActivity();
    const checkInterval = setInterval(checkSessionActivity, 5000);
    return () => clearInterval(checkInterval);
  }, [isAuthenticated]);

  const anomalies = useMemo(() => MOCK_ANOMALIES, []);

  useEffect(() => {
    const loadDynamicData = async () => {
      try {
        const res = await fetch('/api/incidents');
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const result = await res.json();
        if (result.success && Array.isArray(result.records)) {
          if (result.records.length === 0) {
            console.log('[SUPABASE] Database is empty. Seeding might be required.');
            return;
          }
          
          const adapted = result.records.map(adaptSupabaseRecord).filter(Boolean);
          setRawIncidents(adapted);
          console.log(`[SUPABASE] Loaded ${adapted.length} incidents dynamically from Supabase.`);
        }
      } catch (err) {
        console.error('[SUPABASE] Failed to load data:', err);
      }
    };

    loadDynamicData();

    // Subscribe to real-time database changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'fir_records',
        },
        (payload) => {
          console.log('[SUPABASE REALTIME] Change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newAdapted = adaptSupabaseRecord(payload.new);
            if (newAdapted) {
              setRawIncidents(prev => {
                if (prev.some(item => item.case_information.unique_id === newAdapted.case_information.unique_id)) {
                  return prev;
                }
                return [newAdapted, ...prev];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedAdapted = adaptSupabaseRecord(payload.new);
            if (updatedAdapted) {
              setRawIncidents(prev => prev.map(item => 
                item.case_information.unique_id === updatedAdapted.case_information.unique_id
                  ? updatedAdapted
                  : item
              ));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            if (deletedId) {
              setRawIncidents(prev => prev.filter(item => item.db_id !== deletedId));
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`[SUPABASE REALTIME] Subscription status: ${status}`, err || '');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const reportIncident = async (newRecord: any, formattedIncident: Incident, newOffender?: Offender): Promise<string | null> => {
    try {
      const res = await fetch('/api/incident/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      if (!res.ok) {
        throw new Error(`Failed to report incident: ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.record) {
        const generatedId = data.unique_id;
        
        // Adapt and append the newly created record to our raw state
        const newAdapted = adaptSupabaseRecord(data.record);
        if (newAdapted) {
          setRawIncidents(prev => [newAdapted, ...prev]);
        }
        return generatedId;
      }
      return null;
    } catch (err) {
      console.error('Error reporting incident:', err);
      return null;
    }
  };

  const verifyCredentials = async (username: string, password: string): Promise<{ valid: boolean; name: string; username: string }> => {
    const cleanUsername = username.trim().toLowerCase();
    try {
      const { normal, admin } = await fetchUsers();
      const normalUser = normal.find((u: any) => u.username.trim().toLowerCase() === cleanUsername);
      const adminUser = admin.find((u: any) => u.username.trim().toLowerCase() === cleanUsername);

      if (normalUser && normalUser.password === password) {
        return { valid: true, name: normalUser.name || normalUser.username, username: normalUser.username };
      }
      if (adminUser && adminUser.password === password) {
        return { valid: true, name: adminUser.name || adminUser.username, username: adminUser.username };
      }
    } catch (err) {
      console.error('Error verifying credentials:', err);
    }
    return { valid: false, name: '', username: '' };
  };

  const mapRawStatusToAppStatus = (rawStatus: string): 'Open' | 'Dispatched' | 'Resolved' => {
    switch (rawStatus) {
      case 'Closed': return 'Resolved';
      case 'Charge Sheet Filed': return 'Dispatched';
      case 'Transferred': return 'Dispatched';
      case 'Under Investigation': return 'Open';
      case 'Open':
      default: return 'Open';
    }
  };

  const updateIncidentStatus = async (
    incidentId: string,
    newRawStatus: string,
    remarks: string,
    modifiedBy: string,
    modifiedByUserId: string,
    closureDetails?: any,
    chargeSheetFiled?: boolean
  ) => {
    try {
      const res = await fetch(`/api/incidents/${encodeURIComponent(incidentId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_status: newRawStatus,
          remarks,
          modifiedBy,
          modifiedByUserId,
          closureDetails,
          chargeSheetFiled,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update status: ${res.status}`);
      }

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Server rejected status update');
      }

      // 1. Update React state (rawIncidents)
      setRawIncidents(prev => prev.map(item => {
        if (item.case_information.unique_id !== incidentId) return item;
        
        return {
          ...item,
          case_status: newRawStatus,
          legal_outcome: {
            ...item.legal_outcome,
            charge_sheet_filed: chargeSheetFiled !== undefined ? chargeSheetFiled : (item.legal_outcome?.charge_sheet_filed || false),
            conviction_status: newRawStatus
          },
          status_modification: {
            previousStatus: item.case_status || 'Open',
            newStatus: newRawStatus,
            remarks,
            modifiedAt: new Date().toISOString(),
            modifiedBy,
            modifiedByUserId,
            closureDetails: closureDetails || undefined,
          }
        };
      }));

      // 2. Update rawCrimeData in-place for generated PDF correctness
      const caseData = rawCrimeData.find((item: any) => item.case_information.unique_id === incidentId);
      if (caseData) {
        if (!caseData.legal_outcome) {
          caseData.legal_outcome = {};
        }
        if (chargeSheetFiled !== undefined) {
          caseData.legal_outcome.charge_sheet_filed = chargeSheetFiled;
        }
        caseData.legal_outcome.conviction_status = newRawStatus;
      }
      console.log(`[SUPABASE] Updated incident status: ${incidentId} -> ${newRawStatus}`);
    } catch (err) {
      console.error('[SUPABASE] Failed to update incident status:', err);
    }
  };


  // Compute filtered incidents dynamically
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      // 1. Search Query filter (matches classification, ID, or description)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesType = inc.type.toLowerCase().includes(query);
        const matchesId = inc.id.toLowerCase().includes(query);
        const matchesDesc = inc.description.toLowerCase().includes(query);
        
        // Match suspect name if linked
        let matchesSuspect = false;
        if (inc.offenderId) {
          const offender = offenders.find(o => o.id === inc.offenderId);
          if (offender) {
            matchesSuspect = offender.name.toLowerCase().includes(query) || 
                             offender.alias.toLowerCase().includes(query);
          }
        }

        if (!matchesType && !matchesId && !matchesDesc && !matchesSuspect) {
          return false;
        }
      }

      // 2. Severity Filter
      if (severityFilter !== 'ALL' && inc.severity !== severityFilter) {
        return false;
      }

      // 3. State Filter
      if (selectedStateId !== 'ALL') {
        const district = MOCK_DISTRICTS[inc.districtId];
        if (!district || district.stateId !== selectedStateId) {
          return false;
        }
      }

      // 4. District/Sector Filter
      if (districtFilter !== 'ALL' && inc.districtId !== districtFilter) {
        return false;
      }

      return true;
    });
  }, [incidents, offenders, searchQuery, severityFilter, selectedStateId, districtFilter]);

  const resetFilters = () => {
    setSearchQuery('');
    setSeverityFilter('ALL');
    setSelectedStateId('ALL');
    setDistrictFilter('ALL');
  };

  const updateProfile = async (details: { name: string; role: string; email: string; phone: string; department: string }): Promise<boolean> => {
    if (!currentUser) return false;
    
    const { normal, admin } = await fetchUsers();
    const cleanUsername = currentUser.username.trim().toLowerCase();
    
    let userFound = false;
    let updatedNormals = [...normal];
    let updatedAdmins = [...admin];
    
    if (currentUser.isAdmin) {
      updatedAdmins = admin.map(u => {
        if (u.username.trim().toLowerCase() === cleanUsername) {
          userFound = true;
          return {
            ...u,
            name: details.name,
            role: details.role,
            email: details.email,
            phone: details.phone,
            department: details.department
          };
        }
        return u;
      });
      
      if (userFound) {
        const encoded = encodeUsers(updatedAdmins);
        await updateDbValue('admin_users', encoded);
      }
    } else {
      updatedNormals = normal.map(u => {
        if (u.username.trim().toLowerCase() === cleanUsername) {
          userFound = true;
          return {
            ...u,
            name: details.name,
            role: details.role,
            email: details.email,
            phone: details.phone,
            department: details.department
          };
        }
        return u;
      });
      
      if (userFound) {
        const encoded = encodeUsers(updatedNormals);
        await updateDbValue('normal_users', encoded);
      }
    }
    
    if (userFound) {
      const updatedUser = {
        ...currentUser,
        name: details.name,
        role: details.role,
        email: details.email,
        phone: details.phone,
        department: details.department
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('aether_operator_name', details.name);
      localStorage.setItem('aether_operator_role', details.role);
      localStorage.setItem('aether_operator_email', details.email);
      localStorage.setItem('aether_operator_phone', details.phone);
      localStorage.setItem('aether_operator_department', details.department);
      return true;
    }
    
    return false;
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'No active session' };
    
    const { normal, admin } = await fetchUsers();
    const cleanUsername = currentUser.username.trim().toLowerCase();
    
    let userFound = false;
    let oldPasswordMatches = false;
    let updatedNormals = [...normal];
    let updatedAdmins = [...admin];
    
    if (currentUser.isAdmin) {
      const currentDbUser = admin.find(u => u.username.trim().toLowerCase() === cleanUsername);
      if (currentDbUser) {
        if (currentDbUser.password === oldPassword) {
          oldPasswordMatches = true;
          updatedAdmins = admin.map(u => {
            if (u.username.trim().toLowerCase() === cleanUsername) {
              return { ...u, password: newPassword, mustChangePassword: false };
            }
            return u;
          });
          const encoded = encodeUsers(updatedAdmins);
          await updateDbValue('admin_users', encoded);
          userFound = true;
        }
      }
    } else {
      const currentDbUser = normal.find(u => u.username.trim().toLowerCase() === cleanUsername);
      if (currentDbUser) {
        if (currentDbUser.password === oldPassword) {
          oldPasswordMatches = true;
          updatedNormals = normal.map(u => {
            if (u.username.trim().toLowerCase() === cleanUsername) {
              return { ...u, password: newPassword, mustChangePassword: false };
            }
            return u;
          });
          const encoded = encodeUsers(updatedNormals);
          await updateDbValue('normal_users', encoded);
          userFound = true;
        }
      }
    }
    
    if (!oldPasswordMatches) {
      return { success: false, message: 'Current password does not match' };
    }
    
    if (userFound) {
      setCurrentUser(prev => prev ? { ...prev, mustChangePassword: false } : null);
      localStorage.setItem('aether_operator_must_change_password', 'false');
      return { success: true, message: 'Password updated successfully' };
    }
    
    return { success: false, message: 'User record not found' };
  };

  const terminateSession = async (targetUsername: string): Promise<boolean> => {
    if (!currentUser || !currentUser.isAdmin || currentUser.level !== 2) {
      console.warn('Unauthorized session termination attempt.');
      return false;
    }

    const cleanTarget = targetUsername.trim().toLowerCase();
    const cleanSelf = currentUser.username.trim().toLowerCase();

    if (cleanTarget === cleanSelf) {
      console.warn('Cannot terminate own session.');
      return false;
    }

    const { normal, admin } = await fetchUsers();
    
    const targetNormal = normal.find(u => u.username.toLowerCase() === cleanTarget);
    const targetAdmin = admin.find(u => u.username.toLowerCase() === cleanTarget);

    if (!targetNormal && !targetAdmin) {
      console.warn('Target user not found.');
      return false;
    }

    // Level 2 admins cannot logout other Level 2 admins
    if (targetAdmin && targetAdmin.level === 2) {
      console.warn('Unauthorized: Cannot log out a Level 2 Admin.');
      return false;
    }

    try {
      await updateDbValue(`active_session_${cleanTarget}`, 'terminated');
      return true;
    } catch (e) {
      console.error('Failed to terminate remote session:', e);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        searchQuery,
        setSearchQuery,
        severityFilter,
        setSeverityFilter,
        selectedStateId,
        setSelectedStateId,
        districtFilter,
        setDistrictFilter,
        selectedIncidentId,
        setSelectedIncidentId,
        selectedOffenderId,
        setSelectedOffenderId,
        incidents,
        offenders,
        anomalies,
        filteredIncidents,
        resetFilters,
        isAuthenticated,
        login,
        logout,
        theme,
        setTheme,
        resolvedTheme,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        sessionTerminationReason,
        setSessionTerminationReason,
        currentUser,
        fetchAuditLogs,
        fetchUsers,
        createUser,
        deleteUser,
        updateProfile,
        changePassword,
        terminateSession,
        reportIncident,
        verifyCredentials,
        updateIncidentStatus,
        syndicateLinks,
        syndicateClusters,
        centralityMap,
        selectedSyndicateId,
        setSelectedSyndicateId,
        linkStrengthFilter,
        setLinkStrengthFilter,
        activeSignalFilters,
        setActiveSignalFilters,
        highlightedNodeId,
        setHighlightedNodeId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
