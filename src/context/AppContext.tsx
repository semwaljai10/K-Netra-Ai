'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { MOCK_INCIDENTS, MOCK_OFFENDERS, MOCK_ANOMALIES, MOCK_DISTRICTS, Incident, Offender, Anomaly } from '@/lib/data';

export type ActiveView = 'dashboard' | 'map' | 'network' | 'offenders' | 'socio' | 'predictor' | 'admin' | 'profile';
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
  createUser: (user: { name: string; role: string }, type: 'normal' | 'admin', level?: number) => Promise<{ username: string; otp: string }>;
  deleteUser: (username: string, type: 'normal' | 'admin') => Promise<boolean>;
  updateProfile: (details: { name: string; role: string; email: string; phone: string; department: string }) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
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
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'get', key })
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch key "${key}" from proxy: ${res.status}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`Failed to fetch key "${key}" from proxy: ${json.error}`);
  }
  return json.data || '';
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
        level: parts[5] ? Number(parts[5]) : undefined
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
      return `${clean(u.username)}|${encPass}|${u.mustChangePassword ? '1' : '0'}|${clean(u.name)}|${clean(u.role)}|${u.level !== undefined ? u.level : ''}`;
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
  const [selectedStateId, setSelectedStateId] = useState('ALL');
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
      const email = localStorage.getItem('aether_operator_email') || `${username}@aether.gov.in`;
      const phone = localStorage.getItem('aether_operator_phone') || '+91 98765 43210';
      const department = localStorage.getItem('aether_operator_department') || 'NCR Tactical Unit';
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
    user: { name: string; role: string },
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

    let otp = '';
    for (let i = 0; i < 8; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    
    if (type === 'admin') {
      const newUser = {
        username: newUsername,
        password: otp,
        mustChangePassword: true,
        name: user.name,
        role: user.role,
        level: level || 1
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
        role: user.role
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
        email: userObj?.email || `${cleanUsername}@aether.gov.in`,
        phone: userObj?.phone || '+91 98765 43210',
        department: userObj?.department || 'NCR Tactical Unit',
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
          const rawLogs = await fetchDbValue(`audit_logs_${uname}`);
          if (rawLogs) {
            const decoded = decodeLogs(rawLogs);
            allLogs = allLogs.concat(decoded);
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
      
      return allLogs.slice(0, 16);
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
          if (remoteSessionId !== localSessionId) {
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

  const incidents = useMemo(() => MOCK_INCIDENTS, []);
  const offenders = useMemo(() => MOCK_OFFENDERS, []);
  const anomalies = useMemo(() => MOCK_ANOMALIES, []);

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
        changePassword
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
