'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Search, RefreshCw, Menu } from 'lucide-react';
import { MOCK_DISTRICTS, MOCK_STATES } from '@/lib/data';

export default function Header() {
  const {
    currentView,
    searchQuery,
    setSearchQuery,
    severityFilter,
    setSeverityFilter,
    selectedStateId,
    setSelectedStateId,
    districtFilter,
    setDistrictFilter,
    resetFilters,
    filteredIncidents,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useApp();

  // Compute view specific headings
  const getHeaderInfo = () => {
    switch (currentView) {
      case 'dashboard':
        return {
          title: 'Operations Dashboard',
          subtitle: 'Real-time national tactical feed & anomaly telemetry'
        };
      case 'map':
        return {
          title: 'Geospatial Hotspots',
          subtitle: 'Interactive map scaling national sector boundaries and incident perimeters'
        };
      case 'network':
        return {
          title: 'Syndicate Link Analysis',
          subtitle: 'Force-directed link chart mapping criminal associates across state lines'
        };
      case 'offenders':
        return {
          title: 'Criminal Dossiers',
          subtitle: 'Browse profiling indexes & AI threat risk evaluations'
        };
      case 'socio':
        return {
          title: 'Socio-Economic Analytics',
          subtitle: 'Correlating unemployment, lighting, and income indicators with crime density'
        };
      case 'predictor':
        return {
          title: 'Predictive Threat Simulator',
          subtitle: 'Execute neural forecast models on patrol levels and streetlight infrastructure'
        };
      case 'profile':
        return {
          title: 'Operator Profile',
          subtitle: 'Manage Command Station credentials and tactical profile configuration'
        };
      case 'report':
        return {
          title: 'Report Incident',
          subtitle: 'Create a new First Information Report (FIR) and persist it to the K-NETRA database'
        };
      default:
        return {
          title: 'Command Center',
          subtitle: 'K-NETRA Command and Control console'
        };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  // Dynamically filter districts shown in selector based on selected state
  const visibleDistricts = useMemo(() => {
    const list = Object.values(MOCK_DISTRICTS);
    const filtered = selectedStateId === 'ALL' ? list : list.filter(dist => dist.stateId === selectedStateId);
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedStateId]);

  return (
    <header className="viewport-header">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button 
          className="menu-toggle-btn"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label="Toggle Navigation"
          style={{ marginRight: '1rem' }}
        >
          <Menu size={20} />
        </button>
        <div className="header-title">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      {/* Global Command Console Filters - hide for predictor, profile and report views */}
      {currentView !== 'predictor' && currentView !== 'profile' && currentView !== 'report' && (
        <div className="console-filters">
          <div className="filter-input-wrap">
            <Search className="filter-icon" size={14} />
            <input
              type="text"
              placeholder="Search index/classification/suspect..."
              className="filter-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* State selector */}
          <select
            className="filter-select"
            value={selectedStateId}
            onChange={(e) => {
              setSelectedStateId(e.target.value);
              setDistrictFilter('ALL'); // Reset district lock when switching state
            }}
          >
            <option value="ALL">All India (States/UTs)</option>
            {Object.values(MOCK_STATES).map(st => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>

          {/* District selector */}
          <select
            className="filter-select"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
          >
            <option value="ALL">All Districts</option>
            {visibleDistricts.map(dist => (
              <option key={dist.id} value={dist.id}>
                {dist.name.split(' (')[0]}
              </option>
            ))}
          </select>

          {(searchQuery || severityFilter !== 'ALL' || selectedStateId !== 'ALL' || districtFilter !== 'ALL') && (
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              onClick={resetFilters}
            >
              <RefreshCw size={12} />
              Reset
            </button>
          )}

          <div style={{ fontSize: '0.65rem', color: 'var(--text-dark)', padding: '0 0.5rem', fontFamily: 'var(--font-family-mono)' }}>
            N={filteredIncidents.length}
          </div>
        </div>
      )}
    </header>
  );
}
