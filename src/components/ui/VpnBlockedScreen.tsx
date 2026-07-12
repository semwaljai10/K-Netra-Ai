'use client';

import React from 'react';
import { ShieldAlert, RefreshCw, WifiOff, Terminal } from 'lucide-react';

interface VpnBlockedScreenProps {
  details: {
    ip?: string;
    provider?: string;
    type?: string;
  } | null;
}

// Note: VPN blocking is now handled server-side in proxy.ts.
// This component is kept for legacy compatibility but is no longer rendered.
export default function VpnBlockedScreen({ details }: VpnBlockedScreenProps) {
  return (
    <div className="vpn-blocked-container">
      <div className="login-grid-bg" />
      <div className="vpn-blocked-glow" />

      <div className="vpn-blocked-card glass-panel">
        <div className="vpn-blocked-header">
          <div className="vpn-alert-icon">
            <ShieldAlert size={36} />
          </div>
          <div className="vpn-terminal-tag">
            <Terminal size={12} />
            <span>SECURITY ALGORITHM E-32</span>
          </div>
          <h1>GATEWAY CONNECTION REFUSED</h1>
          <p className="vpn-alert-subtitle">NON-RESIDENTIAL ENDPOINT ACCESS RESTRICTED</p>
        </div>

        <div className="vpn-blocked-body">
          <p>
            Your current network signature indicates routing through a Virtual Private Network (VPN),
            anonymous proxy, or hosting datacenter. Direct console access from non-residential endpoints
            is blocked under <strong>K-NETRA Secure Protocol 12.4</strong> to prevent session hijacking and database exfiltration.
          </p>

          <div className="vpn-details-table">
            <div className="vpn-details-row">
              <span className="details-label">CLIENT ENDPOINT IP</span>
              <span className="details-value">{details?.ip || 'UNKNOWN'}</span>
            </div>
            <div className="vpn-details-row">
              <span className="details-label">NETWORK ISP/ORG</span>
              <span className="details-value">{details?.provider || 'DATACENTER BLOCK'}</span>
            </div>
            <div className="vpn-details-row">
              <span className="details-label">SIGNATURE TYPE</span>
              <span className="details-value-alert">{details?.type || 'VPN/Proxy Tunnel'}</span>
            </div>
            <div className="vpn-details-row">
              <span className="details-label">GATEWAY SECURITY</span>
              <span className="details-value">REFUSED (STATUS 403)</span>
            </div>
          </div>

          <div className="vpn-remediation-box">
            <div className="remediation-header">
              <WifiOff size={16} />
              <span>REMEDIATION ACTIONS</span>
            </div>
            <ul>
              <li>Disconnect from your VPN provider, Tor node, or proxy gateway.</li>
              <li>Ensure you are connecting from an authorized residential ISP connection.</li>
              <li>If this warning persists, contact the Karnataka Tactical Command administrator.</li>
            </ul>
          </div>
        </div>

        <a
          href="/"
          className="btn btn-danger vpn-retry-btn"
          style={{ width: '100%', gap: '0.75rem', padding: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <RefreshCw size={16} />
          <span>RE-EVALUATE CONNECTION</span>
        </a>
      </div>
    </div>
  );
}

