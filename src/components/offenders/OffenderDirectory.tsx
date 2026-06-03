'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import OffenderCard from './OffenderCard';
import GlassPanel from '../ui/GlassPanel';
import { ArrowUpDown, Users, Filter } from 'lucide-react';

type SortOption = 'threat-desc' | 'threat-asc' | 'arrests-desc';
type StatusFilterOption = 'ALL' | 'Active' | 'Parole' | 'Incarcerated';

export default function OffenderDirectory() {
  const { offenders, searchQuery } = useApp();
  const [sortBy, setSortBy] = useState<SortOption>('threat-desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('ALL');

  // Filter and sort offenders list
  const processedOffenders = useMemo(() => {
    let result = [...offenders];

    // 1. Apply global search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.name.toLowerCase().includes(q) || 
        o.alias.toLowerCase().includes(q) || 
        o.primaryCrime.toLowerCase().includes(q)
      );
    }

    // 2. Apply status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(o => o.status === statusFilter);
    }

    // 3. Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'threat-desc') {
        return b.riskScore - a.riskScore;
      }
      if (sortBy === 'threat-asc') {
        return a.riskScore - b.riskScore;
      }
      if (sortBy === 'arrests-desc') {
        return b.arrestCount - a.arrestCount;
      }
      return 0;
    });

    return result;
  }, [offenders, searchQuery, sortBy, statusFilter]);

  return (
    <div className="offenders-directory-layout">
      {/* Directory Filter Console */}
      <GlassPanel style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={16} className="text-blue" style={{ color: 'var(--color-blue)' }} />
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontFamily: 'var(--font-family-title)' }}>Dossier Registry Index</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Status filter dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Filter size={12} />
            <select
              className="filter-select"
              style={{ padding: '0.35rem 1.25rem 0.35rem 0.5rem', fontSize: '0.75rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilterOption)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Parole">On Parole</option>
              <option value="Incarcerated">Incarcerated</option>
            </select>
          </div>

          {/* Sort dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <ArrowUpDown size={12} />
            <select
              className="filter-select"
              style={{ padding: '0.35rem 1.25rem 0.35rem 0.5rem', fontSize: '0.75rem' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="threat-desc">Highest Threat Index</option>
              <option value="threat-asc">Lowest Threat Index</option>
              <option value="arrests-desc">Arrests Count</option>
            </select>
          </div>
        </div>
      </GlassPanel>

      {/* Directory Grid */}
      {processedOffenders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-dark)' }}>
          No offender dossiers matching active index filters.
        </div>
      ) : (
        <div className="offenders-grid">
          {processedOffenders.map(offender => (
            <OffenderCard key={offender.id} offender={offender} />
          ))}
        </div>
      )}
    </div>
  );
}
