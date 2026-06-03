'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import GlassPanel from '../ui/GlassPanel';
import { Share2, BarChart2, Terminal } from 'lucide-react';

export default function NetworkSidebar() {
  const { offenders } = useApp();

  // Compute syndicate statistics
  const totalNodes = offenders.length;
  
  // Total undirected links calculation
  let totalLinksCount = 0;
  const recorded = new Set<string>();
  offenders.forEach(o => {
    o.associates.forEach(assocId => {
      const key = [o.id, assocId].sort().join('-');
      if (!recorded.has(key)) {
        recorded.add(key);
        // Ensure associate actually exists in dataset
        if (offenders.some(other => other.id === assocId)) {
          totalLinksCount++;
        }
      }
    });
  });

  // Graph density calculation: Actual links / Possible links
  // Max possible links in undirected graph: N * (N - 1) / 2
  const maxPossibleLinks = (totalNodes * (totalNodes - 1)) / 2;
  const densityPercent = maxPossibleLinks > 0 
    ? ((totalLinksCount / maxPossibleLinks) * 100).toFixed(1)
    : '0';

  // Find enforcer suspect (suspect with highest associate link count)
  let primaryEnforcer = 'None';
  let maxAssociates = 0;
  offenders.forEach(o => {
    if (o.associates.length > maxAssociates) {
      maxAssociates = o.associates.length;
      primaryEnforcer = `${o.name} (${o.alias})`;
    }
  });

  return (
    <aside className="network-sidebar glass-panel">
      <div className="map-sidebar-title">
        <Share2 size={18} style={{ color: 'var(--color-blue)' }} />
        <h2>Syndicate Graph</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <span className="map-legend-title">Link Telemetry</span>
        
        <GlassPanel style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.015)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Graph Nodes (Suspects)</span>
              <span style={{ fontWeight: 'bold' }}>{totalNodes}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Graph Edges (Links)</span>
              <span style={{ fontWeight: 'bold' }}>{totalLinksCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Network Density</span>
              <span style={{ fontWeight: 'bold', color: 'var(--color-blue)' }}>{densityPercent}%</span>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.015)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span className="dossier-label" style={{ fontSize: '0.6rem' }}>Primary Hub Node</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{primaryEnforcer}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)' }}>
              Linked to {maxAssociates} major active associates
            </span>
          </div>
        </GlassPanel>
      </div>

      {/* Legend */}
      <GlassPanel className="map-legend-card" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <span className="map-legend-title">Node Status Key</span>
        <div className="legend-list">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'var(--color-red)' }}></span>
            <span>Active Outlaw</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'var(--color-yellow)' }}></span>
            <span>On Parole / Release</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'var(--color-blue)' }}></span>
            <span>Incarcerated</span>
          </div>
        </div>
      </GlassPanel>

      {/* Log feed simulation */}
      <div className="terminal-log-card" style={{ marginTop: 'auto' }}>
        <div className="term-header">
          <span>AI LINK ANALYSIS DEPLOYED</span>
          <div className="term-dot"></div>
        </div>
        <div className="term-body" style={{ height: '70px', fontSize: '0.6rem', padding: '0.5rem 0.75rem' }}>
          <span>[SYSTEM] Clustering algorithms active...</span><br/>
          <span>[SYSTEM] Found 2 distinct syndicate hubs.</span><br/>
          <span style={{ color: 'var(--color-success)' }}>[OK] Convergence criteria met.</span>
        </div>
      </div>
    </aside>
  );
}
