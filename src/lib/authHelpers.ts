// Base64 encoding helpers for URL-safe path params
export const toUrlSafeBase64 = (str: string) => {
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

export const fromUrlSafeBase64 = (base64: string) => {
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

export const fetchDbValue = async (key: string): Promise<string> => {
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

export const updateDbValue = async (key: string, value: string): Promise<boolean> => {
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
export const encodeLogs = (logsList: any[]) => {
  return logsList.map(log => {
    const clean = (val: any) => val ? String(val).replace(/[|;]/g, ' ') : ''; // remove delimiters
    return `${clean(log.user)}|${clean(log.ip)}|${clean(log.loc)}|${clean(log.time)}|${clean(log.dev)}|${clean(log.timestamp || '')}`;
  }).join(';');
};

export const decodeLogs = (encodedStr: string) => {
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

export const encryptPassword = (password: string): string => {
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

export const decryptPassword = (encrypted: string): string => {
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

export const decodeUsers = (encodedStr: string) => {
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

export const encodeUsers = (usersList: any[]) => {
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

export const getDeviceDetails = () => {
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

export const getPreciseLocation = (): Promise<string | null> => {
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
