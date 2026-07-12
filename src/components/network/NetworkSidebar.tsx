'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import GlassPanel from '../ui/GlassPanel';
import { SIGNAL_METADATA, ALL_SIGNAL_TYPES } from '@/lib/syndicateAnalysis';
import {
  Share2, ChevronDown, ChevronUp, Users, Target, Eye, EyeOff,
  Crosshair, Activity
} from 'lucide-react';

export default function NetworkSidebar() {
  const {
    offenders,
    syndicateLinks,
    syndicateClusters,
    centralityMap,
    linkStrengthFilter,
    setLinkStrengthFilter,
    activeSignalFilters,
    setActiveSignalFilters,
    selectedSyndicateId,
    setSelectedSyndicateId,
    highlightedNodeId,
    setHighlightedNodeId,
    setSelectedOffenderId,
  } = useApp();

  const [expandedSyndicate, setExpandedSyndicate] = useState<string | null>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  // Compute statistics
  const totalNodes = offenders.length;

  // Filtered links based on current controls
  const enabledSignals = new Set(activeSignalFilters);
  const filteredLinks = syndicateLinks.filter(link => {
    if (link.score < linkStrengthFilter) return false;
    return link.signals.some(s => enabledSignals.has(s));
  });

  const totalLinksCount = filteredLinks.length;
  const maxPossibleLinks = (totalNodes * (totalNodes - 1)) / 2;
  const densityPercent = maxPossibleLinks > 0
    ? ((totalLinksCount / maxPossibleLinks) * 100).toFixed(2)
    : '0';

  // Non-singleton syndicates (2+ members)
  const activeSyndicates = syndicateClusters.filter(c => c.members.length > 1);
  const isolatedCount = syndicateClusters.filter(c => c.members.length === 1).length;

  // Top hub nodes by degree
  const topHubs = [...offenders]
    .map(o => ({
      ...o,
      degree: centralityMap.get(o.id)?.degree || 0,
      betweenness: centralityMap.get(o.id)?.betweenness || 0,
    }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 5);

  // Terminal log simulation
  useEffect(() => {
    const lines = [
      '[INIT] Multi-signal syndicate analysis engine loaded.',
      `[SCAN] Processing ${totalNodes} suspect nodes...`,
      `[LINK] ${syndicateLinks.length} evidence-based links detected.`,
      `[ALGO] Community detection (BFS) complete.`,
      `[RESULT] ${activeSyndicates.length} active syndicates identified.`,
      `[RESULT] ${isolatedCount} isolated nodes (no links).`,
    ];
    setTerminalLines([]);
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < lines.length) {
        const lineToAdd = lines[idx];
        setTerminalLines(prev => [...prev, lineToAdd]);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [totalNodes, syndicateLinks.length, activeSyndicates.length, isolatedCount]);

  // Signal toggle handler
  const toggleSignal = (signal: string) => {
    if (activeSignalFilters.includes(signal)) {
      setActiveSignalFilters(activeSignalFilters.filter(s => s !== signal));
    } else {
      setActiveSignalFilters([...activeSignalFilters, signal]);
    }
  };

  return (
    <aside className="network-sidebar glass-panel">
      <div className="map-sidebar-title">
        <Share2 size={18} style={{ color: 'var(--color-blue)' }} />
        <h2>Syndicate Analysis</h2>
      </div>

      {/* ─── LINK TELEMETRY ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <span className="map-legend-title">Link Telemetry</span>

        <GlassPanel style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.015)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Suspect Nodes</span>
              <span style={{ fontWeight: 'bold' }}>{totalNodes}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Evidence Links</span>
              <span style={{ fontWeight: 'bold' }}>{totalLinksCount} / {syndicateLinks.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Syndicates</span>
              <span style={{ fontWeight: 'bold', color: 'var(--color-blue)' }}>{activeSyndicates.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Network Density</span>
              <span style={{ fontWeight: 'bold', color: 'var(--color-blue)' }}>{densityPercent}%</span>
            </div>
          </div>
        </GlassPanel>

        {/* ─── LINK STRENGTH FILTER ───────────────────────────────────── */}
        <GlassPanel style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.015)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="dossier-label" style={{ fontSize: '0.6rem', margin: 0 }}>Min Link Strength</span>
              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-family-mono)', fontWeight: 'bold', color: 'var(--color-blue)' }}>
                {(linkStrengthFilter * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={linkStrengthFilter * 100}
              onChange={(e) => setLinkStrengthFilter(Number(e.target.value) / 100)}
              style={{
                width: '100%',
                accentColor: 'var(--color-blue)',
                height: '4px',
                cursor: 'pointer',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'var(--text-dark)' }}>
              <span>Permissive</span>
              <span>Conservative</span>
            </div>
          </div>
        </GlassPanel>

        {/* ─── SIGNAL TYPE TOGGLES ────────────────────────────────────── */}
        <GlassPanel style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.015)' }}>
          <span className="dossier-label" style={{ fontSize: '0.6rem', marginBottom: '0.4rem', display: 'block' }}>Evidence Signals</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {ALL_SIGNAL_TYPES.map(signal => {
              const meta = SIGNAL_METADATA[signal];
              const isActive = activeSignalFilters.includes(signal);
              return (
                <button
                  key={signal}
                  onClick={() => toggleSignal(signal)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.25rem 0.4rem',
                    fontSize: '0.65rem',
                    background: isActive ? `${meta.color}15` : 'transparent',
                    border: `1px solid ${isActive ? meta.color + '40' : 'transparent'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: isActive ? meta.color : 'var(--text-dark)',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                >
                  {isActive ? <Eye size={10} /> : <EyeOff size={10} />}
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: isActive ? meta.color : 'var(--text-dark)',
                    flexShrink: 0,
                  }} />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      {/* ─── SYNDICATE LIST ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        <span className="map-legend-title" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Users size={12} />
          Detected Syndicates ({activeSyndicates.length})
        </span>

        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {activeSyndicates.map(cluster => {
            const isSelected = selectedSyndicateId === cluster.id;
            const isExpanded = expandedSyndicate === cluster.id;

            return (
              <GlassPanel
                key={cluster.id}
                style={{
                  padding: '0.5rem 0.7rem',
                  background: isSelected ? `${cluster.color}15` : 'rgba(255,255,255,0.015)',
                  border: isSelected ? `1px solid ${cluster.color}50` : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => {
                    setSelectedSyndicateId(isSelected ? null : cluster.id);
                    setHighlightedNodeId(null);
                  }}
                >
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    backgroundColor: cluster.color, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cluster.name}
                    </div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-dark)' }}>
                      {cluster.members.length} members · Avg Risk {cluster.avgRiskScore}%
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedSyndicate(isExpanded ? null : cluster.id);
                    }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: '2px',
                    }}
                  >
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-dark)', marginBottom: '0.3rem' }}>
                      Primary: {cluster.primaryCrimeType} · Hub: {offenders.find(o => o.id === cluster.hubNode)?.alias || 'N/A'} · Region: {cluster.geographicFocus}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                      {cluster.members.map(memberId => {
                        const member = offenders.find(o => o.id === memberId);
                        if (!member) return null;
                        return (
                          <span
                            key={memberId}
                            onClick={(e) => {
                              e.stopPropagation();
                              setHighlightedNodeId(memberId);
                              setSelectedOffenderId(memberId);
                            }}
                            style={{
                              fontSize: '0.55rem',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '3px',
                              backgroundColor: `${cluster.color}20`,
                              border: `1px solid ${cluster.color}30`,
                              color: cluster.color,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {member.alias}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </GlassPanel>
            );
          })}
        </div>
      </div>

      {/* ─── TOP HUB NODES ────────────────────────────────────────────── */}
      <GlassPanel style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.015)', marginTop: '0.5rem' }}>
        <span className="dossier-label" style={{ fontSize: '0.6rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Target size={10} />
          Top Hub Nodes
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {topHubs.map((hub, idx) => (
            <div
              key={hub.id}
              onClick={() => {
                setHighlightedNodeId(hub.id);
                setSelectedOffenderId(hub.id);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.2rem 0.3rem', borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.65rem',
                background: highlightedNodeId === hub.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                transition: 'background 0.15s ease',
              }}
            >
              <span style={{
                width: '16px', height: '16px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.55rem', fontWeight: 'bold',
                backgroundColor: idx === 0 ? 'var(--color-red)' : idx === 1 ? 'var(--color-yellow)' : 'var(--color-blue)',
                color: '#fff',
              }}>
                {idx + 1}
              </span>
              <span style={{ flex: 1, fontWeight: idx === 0 ? 'bold' : 'normal' }}>
                {hub.alias} ({hub.name.split(' ')[0]})
              </span>
              <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--text-dark)' }}>
                D:{hub.degree}
              </span>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* ─── LEGEND ───────────────────────────────────────────────────── */}
      <GlassPanel className="map-legend-card" style={{ background: 'rgba(255,255,255,0.015)', marginTop: '0.5rem' }}>
        <span className="map-legend-title">Node Status Ring</span>
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

      {/* ─── TERMINAL LOG ─────────────────────────────────────────────── */}
      <div className="terminal-log-card" style={{ marginTop: 'auto' }}>
        <div className="term-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Activity size={10} />
            SYNDICATE ANALYSIS ENGINE
          </span>
          <div className="term-dot"></div>
        </div>
        <div className="term-body" style={{ height: '90px', fontSize: '0.55rem', padding: '0.4rem 0.6rem', overflowY: 'auto' }}>
          {terminalLines.map((line, i) => (
            <span key={i} style={{
              display: 'block',
              color: line?.includes('[RESULT]') ? 'var(--color-success)' :
                     line?.includes('[LINK]') ? '#06b6d4' :
                     line?.includes('[ALGO]') ? '#a855f7' :
                     'var(--text-muted)',
            }}>
              {line}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
