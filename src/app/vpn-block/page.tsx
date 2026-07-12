import React from 'react';

interface VpnBlockPageProps {
  searchParams: Promise<{ ip?: string; provider?: string; type?: string }>;
}

export const metadata = {
  title: 'Gateway Refused - K-NETRA',
};

export default async function VpnBlockPage({ searchParams }: VpnBlockPageProps) {
  const params = await searchParams;
  const ip = params.ip ?? 'UNKNOWN';
  const provider = params.provider ?? 'DATACENTER BLOCK';
  const type = params.type ?? 'VPN/Proxy Tunnel';

  // Inline styles — avoids any CSS string parsing issues
  const S = {
    body: {
      margin: 0,
      padding: 0,
      background: '#060b18',
      color: '#e2e8f0',
      fontFamily: "'Courier New', monospace",
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties,
    card: {
      width: 'min(560px, 94vw)',
      background: 'rgba(8,12,24,0.92)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: '16px',
      padding: '2.5rem 2rem',
      boxShadow: '0 0 60px rgba(239,68,68,0.1), 0 20px 60px rgba(0,0,0,0.5)',
    } as React.CSSProperties,
    tag: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'rgba(239,68,68,0.12)',
      border: '1px solid rgba(239,68,68,0.3)',
      color: '#f87171',
      fontSize: '0.7rem',
      letterSpacing: '0.12em',
      padding: '0.3rem 0.75rem',
      borderRadius: '4px',
      marginBottom: '1.25rem',
      fontWeight: 600,
    } as React.CSSProperties,
    icon: {
      width: '72px',
      height: '72px',
      background: 'rgba(239,68,68,0.15)',
      border: '2px solid rgba(239,68,68,0.4)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1.25rem',
      fontSize: '2rem',
      color: '#ef4444',
    } as React.CSSProperties,
    h1: {
      fontSize: '1.35rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: '#fff',
      textTransform: 'uppercase' as const,
      margin: '0 0 0.4rem',
    } as React.CSSProperties,
    subtitle: {
      fontSize: '0.72rem',
      letterSpacing: '0.12em',
      color: '#f87171',
      textTransform: 'uppercase' as const,
      marginBottom: '1.75rem',
      fontWeight: 600,
    } as React.CSSProperties,
    p: {
      fontSize: '0.82rem',
      color: '#94a3b8',
      lineHeight: 1.7,
      marginBottom: '1.5rem',
    } as React.CSSProperties,
    table: {
      background: 'rgba(239,68,68,0.05)',
      border: '1px solid rgba(239,68,68,0.15)',
      borderRadius: '8px',
      overflow: 'hidden' as const,
      marginBottom: '1.5rem',
    } as React.CSSProperties,
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.65rem 1rem',
      gap: '1rem',
      borderBottom: '1px solid rgba(239,68,68,0.1)',
      fontSize: '0.75rem',
    } as React.CSSProperties,
    rowLast: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.65rem 1rem',
      gap: '1rem',
      fontSize: '0.75rem',
    } as React.CSSProperties,
    label: {
      color: '#64748b',
      letterSpacing: '0.06em',
      textTransform: 'uppercase' as const,
      flexShrink: 0,
    } as React.CSSProperties,
    value: {
      color: '#e2e8f0',
      fontWeight: 600,
      textAlign: 'right' as const,
      wordBreak: 'break-all' as const,
    } as React.CSSProperties,
    valueAlert: {
      color: '#ef4444',
      fontWeight: 700,
      textAlign: 'right' as const,
    } as React.CSSProperties,
    rem: {
      background: 'rgba(15,23,42,0.6)',
      border: '1px solid rgba(148,163,184,0.1)',
      borderRadius: '8px',
      padding: '1rem 1.25rem',
      marginBottom: '1.75rem',
    } as React.CSSProperties,
    remH: {
      fontSize: '0.7rem',
      letterSpacing: '0.1em',
      color: '#64748b',
      textTransform: 'uppercase' as const,
      fontWeight: 700,
      marginBottom: '0.75rem',
    } as React.CSSProperties,
    ul: {
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem',
      padding: 0,
      margin: 0,
    } as React.CSSProperties,
    li: {
      fontSize: '0.8rem',
      color: '#94a3b8',
      paddingLeft: '1.25rem',
    } as React.CSSProperties,
    btn: {
      width: '100%',
      padding: '0.85rem',
      background: 'rgba(239,68,68,0.12)',
      border: '1px solid rgba(239,68,68,0.35)',
      borderRadius: '8px',
      color: '#f87171',
      fontFamily: 'inherit',
      fontSize: '0.82rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      textDecoration: 'none',
    } as React.CSSProperties,
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Gateway Refused - K-NETRA</title>
      </head>
      <body style={S.body}>
        <div style={S.card}>
          <div style={S.tag}>SECURITY ALGORITHM E-32</div>
          <div style={S.icon}>&#9888;</div>
          <h1 style={S.h1}>Gateway Connection Refused</h1>
          <p style={S.subtitle}>NON-RESIDENTIAL ENDPOINT ACCESS RESTRICTED</p>

          <p style={S.p}>
            Your current network signature indicates routing through a Virtual Private Network (VPN),
            anonymous proxy, or hosting datacenter. Direct console access from non-residential endpoints
            is blocked under <strong style={{ color: '#e2e8f0' }}>K-NETRA Secure Protocol 12.4</strong> to
            prevent session hijacking and database exfiltration.
          </p>

          <div style={S.table}>
            <div style={S.row}>
              <span style={S.label}>CLIENT ENDPOINT IP</span>
              <span style={S.value}>{ip}</span>
            </div>
            <div style={S.row}>
              <span style={S.label}>NETWORK ISP/ORG</span>
              <span style={S.value}>{provider}</span>
            </div>
            <div style={S.row}>
              <span style={S.label}>SIGNATURE TYPE</span>
              <span style={S.valueAlert}>{type}</span>
            </div>
            <div style={S.rowLast}>
              <span style={S.label}>GATEWAY SECURITY</span>
              <span style={S.value}>REFUSED (STATUS 403)</span>
            </div>
          </div>

          <div style={S.rem}>
            <div style={S.remH}>REMEDIATION ACTIONS</div>
            <ul style={S.ul}>
              <li style={S.li}>&#8594; Disconnect from your VPN provider, Tor node, or proxy gateway.</li>
              <li style={S.li}>&#8594; Ensure you are connecting from an authorized residential ISP connection.</li>
              <li style={S.li}>&#8594; If this warning persists, contact the Karnataka Tactical Command administrator.</li>
            </ul>
          </div>

          <a href="/" style={S.btn}>
            RE-EVALUATE CONNECTION
          </a>
        </div>
      </body>
    </html>
  );
}
