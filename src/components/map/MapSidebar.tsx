'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { MOCK_DISTRICTS, MOCK_STATES } from '@/lib/data';
import GlassPanel from '../ui/GlassPanel';
import { MapPin, Info, ArrowLeft, Globe } from 'lucide-react';

const getStateColor = (stateId: string, theme?: 'light' | 'dark') => {
  let hash = 0;
  for (let i = 0; i < stateId.length; i++) {
    hash = stateId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  // Since the map is dark navy in both light and dark themes, we keep lightness at 65% for high visibility
  const l = '65%';
  return `hsl(${h}, 80%, ${l})`;
};

export default function MapSidebar() {
  const { 
    selectedStateId, 
    setSelectedStateId, 
    districtFilter, 
    setDistrictFilter, 
    incidents,
    resolvedTheme 
  } = useApp();

  const handleStateClick = (stateId: string) => {
    setSelectedStateId(stateId);
    setDistrictFilter('ALL'); // Reset district filter
  };

  const handleDistrictClick = (distId: string) => {
    if (districtFilter === distId) {
      setDistrictFilter('ALL');
    } else {
      setDistrictFilter(distId);
    }
  };

  const handleBackToAllStates = () => {
    setSelectedStateId('ALL');
    setDistrictFilter('ALL');
  };

  // Group active incidents by state for summary counts
  const getActiveIncidentsCountForState = (stateId: string) => {
    return incidents.filter(inc => {
      const dist = MOCK_DISTRICTS[inc.districtId];
      return dist && dist.stateId === stateId && inc.status !== 'Resolved';
    }).length;
  };

  // Get active incidents for a district
  const getActiveIncidentsCountForDistrict = (distId: string) => {
    return incidents.filter(i => i.districtId === distId && i.status !== 'Resolved').length;
  };

  const isStateSelected = selectedStateId !== 'ALL';
  const selectedStateName = isStateSelected ? MOCK_STATES[selectedStateId]?.name : '';

  return (
    <aside className="map-sidebar glass-panel">
      {isStateSelected ? (
        // State-specific District list
        <>
          <div className="map-sidebar-title" style={{ justifyContent: 'space-between', display: 'flex', width: '100%', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}
              onClick={handleBackToAllStates}
            >
              <ArrowLeft size={12} />
              National
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: getStateColor(selectedStateId, resolvedTheme) }}>
              {selectedStateId}
            </span>
          </div>

          <div style={{ margin: '0.25rem 0 0.5rem 0' }}>
            <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-family-title)', fontWeight: 800 }}>
              {selectedStateName} Sectors
            </h3>
          </div>

          <div className="district-list">
            {Object.values(MOCK_DISTRICTS)
              .filter(d => d.stateId === selectedStateId)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(dist => {
                const isActive = districtFilter === dist.id;
                const dotColor = getStateColor(selectedStateId, resolvedTheme);
                const activeCount = getActiveIncidentsCountForDistrict(dist.id);

                return (
                  <div
                    key={dist.id}
                    className={`district-card ${isActive ? 'active' : ''}`}
                    onClick={() => handleDistrictClick(dist.id)}
                  >
                    <div className="district-card-header">
                      <span className="district-card-name">{dist.name.split(' (')[0]}</span>
                      <span 
                        className="district-indicator" 
                        style={{ 
                          backgroundColor: dotColor,
                          boxShadow: `0 0 6px ${dotColor}`
                        }}
                      ></span>
                    </div>
                    <div className="district-card-stat">
                      {activeCount} active tactical files
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      ) : (
        // National overview (List of all States)
        <>
          <div className="map-sidebar-title">
            <Globe size={18} style={{ color: 'var(--color-blue)' }} />
            <h2>National Mappings</h2>
          </div>

          <div className="district-list" style={{ overflowY: 'auto', flexGrow: 1 }}>
            {Object.values(MOCK_STATES)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(st => {
              const activeCount = getActiveIncidentsCountForState(st.id);
              const color = getStateColor(st.id, resolvedTheme);

              return (
                <div
                  key={st.id}
                  className="district-card"
                  onClick={() => handleStateClick(st.id)}
                  style={{ borderLeft: `3px solid ${color}` }}
                >
                  <div className="district-card-header">
                    <span className="district-card-name" style={{ fontWeight: 700 }}>{st.name}</span>
                    {activeCount > 0 && (
                      <span 
                        style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 'bold', 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          color: 'var(--color-red)', 
                          padding: '0.1rem 0.4rem', 
                          borderRadius: '10px',
                          border: '1px solid rgba(239, 68, 68, 0.2)' 
                        }}
                      >
                        {activeCount} Alert{activeCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="district-card-stat">
                    Click to drill down sector boundaries
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Legend */}
      <GlassPanel className="map-legend-card" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <span className="map-legend-title">Risk Density Model</span>
        <div className="legend-list">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'var(--color-red)' }}></span>
            <span>Critical (Pulsing Grid)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'var(--color-yellow)' }}></span>
            <span>High Severity</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'var(--color-blue)' }}></span>
            <span>Medium Severity</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'var(--color-success)' }}></span>
            <span>Low Severity</span>
          </div>
        </div>
      </GlassPanel>

      {/* Navigation Tips */}
      <div className="insight-point" style={{ background: 'rgba(59, 130, 246, 0.03)', borderColor: 'rgba(59, 130, 246, 0.1)' }}>
        <Info size={16} className="insight-icon" />
        <div className="insight-text">
          <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Geospatial Commands</h4>
          <p style={{ fontSize: '0.65rem', margin: 0, lineHeight: 1.3 }}>
            Select states to zoom. Click district perimeters to filter logs. Pulsing nodes represent active tactical incidents.
          </p>
        </div>
      </div>
    </aside>
  );
}
