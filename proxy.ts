import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// --- In-Memory IP Cache (15-minute TTL per IP) -------------------------------
const vpnCache = new Map<string, { isVpn: boolean; provider: string; type: string; ttl: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// --- IP Extraction ------------------------------------------------------------
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

// --- Localhost Whitelist -------------------------------------------------------
function isLocalIp(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  );
}

// --- VPN Detection ------------------------------------------------------------
async function detectVpn(ip: string): Promise<{ isVpn: boolean; provider: string; type: string }> {
  const NOT_VPN = { isVpn: false, provider: '', type: '' };

  const cached = vpnCache.get(ip);
  if (cached && Date.now() < cached.ttl) {
    return { isVpn: cached.isVpn, provider: cached.provider, type: cached.type };
  }

  // Primary: proxycheck.io
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`https://proxycheck.io/v2/${ip}?vpn=1&risk=1`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && data[ip]) {
        const info = data[ip];
        if (info.proxy === 'yes' || info.type === 'VPN' || info.type === 'TOR' || info.type === 'PROXY') {
          const result = { isVpn: true, provider: info.provider || info.asn || 'Unknown Provider', type: info.type || 'VPN/Proxy' };
          vpnCache.set(ip, { ...result, ttl: Date.now() + CACHE_TTL_MS });
          return result;
        }
        vpnCache.set(ip, { ...NOT_VPN, ttl: Date.now() + CACHE_TTL_MS });
        return NOT_VPN;
      }
    }
  } catch {
    // Fall through to backup
  }

  // Fallback: ip-api.com
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=proxy,hosting,org,isp`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.proxy === true || data.hosting === true) {
        const result = { isVpn: true, provider: data.org || data.isp || 'Unknown Provider', type: data.proxy ? 'Proxy/VPN' : 'Hosting/Datacenter' };
        vpnCache.set(ip, { ...result, ttl: Date.now() + CACHE_TTL_MS });
        return result;
      }
    }
  } catch {
    // Fail open
  }

  vpnCache.set(ip, { ...NOT_VPN, ttl: Date.now() + CACHE_TTL_MS });
  return NOT_VPN;
}

// --- Proxy Function (Next.js 16) ---------------------------------------------
export async function proxy(request: NextRequest) {
  const { nextUrl } = request;

  // Allow simulation via URL param
  if (nextUrl.searchParams.get('simulate_vpn') === 'true' || nextUrl.searchParams.get('vpn') === 'true') {
    const blockUrl = new URL('/vpn-block', request.url);
    blockUrl.searchParams.set('ip', '198.51.100.45');
    blockUrl.searchParams.set('provider', 'Mullvad VPN / Simulated Node');
    blockUrl.searchParams.set('type', 'VPN (Simulated)');
    return NextResponse.redirect(blockUrl);
  }

  const ip = getClientIp(request);

  if (isLocalIp(ip)) return NextResponse.next();

  const { isVpn, provider, type } = await detectVpn(ip);

  if (isVpn) {
    if (nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'GATEWAY_REFUSED', message: 'VPN/proxy connections are not permitted.', code: 403 },
        { status: 403 }
      );
    }
    const blockUrl = new URL('/vpn-block', request.url);
    blockUrl.searchParams.set('ip', ip);
    blockUrl.searchParams.set('provider', provider);
    blockUrl.searchParams.set('type', type);
    return NextResponse.redirect(blockUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|vpn-block).*)'],
};
