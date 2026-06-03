'use client';

import React from 'react';
import { Offender } from '@/lib/data';
import { useApp } from '@/context/AppContext';
import GlassPanel from '../ui/GlassPanel';
import { StatusBadge } from '../ui/Badge';
import { ShieldAlert, Award, Radio } from 'lucide-react';

interface OffenderCardProps {
  offender: Offender;
}

export default function OffenderCard({ offender }: OffenderCardProps) {
  const { setSelectedOffenderId, offenders } = useApp();

  const getRiskColor = (score: number) => {
    if (score >= 85) return 'var(--color-red)';
    if (score >= 60) return 'var(--color-yellow)';
    return 'var(--color-blue)';
  };

  const riskColor = getRiskColor(offender.riskScore);

  return (
    <GlassPanel 
      className="offender-card" 
      hoverable 
      onClick={() => setSelectedOffenderId(offender.id)}
    >
      <div className="offender-card-header">
        <div className="offender-avatar-box">
          <img 
            src={offender.avatar} 
            alt={offender.name}
            className="offender-avatar-img"
          />
        </div>
        <div className="offender-name-alias">
          <span className="offender-name">{offender.name}</span>
          <span className="offender-alias-badge">ALIAS: {offender.alias}</span>
        </div>
        <span className={`offender-glow-dot ${offender.status}`}></span>
      </div>

      <div className="offender-stats-row">
        <div className="offender-stat-item">
          <span className="offender-stat-label">AI Risk</span>
          <span className="offender-stat-value" style={{ color: riskColor }}>
            {offender.riskScore}%
          </span>
        </div>
        <div className="offender-stat-item">
          <span className="offender-stat-label">Arrests</span>
          <span className="offender-stat-value">{offender.arrestCount}</span>
        </div>
        <div className="offender-stat-item">
          <span className="offender-stat-label">Status</span>
          <span className="offender-stat-value" style={{ fontSize: '0.6rem' }}>
            <StatusBadge status={offender.status} />
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
          <ShieldAlert size={14} className="text-dark" style={{ color: 'var(--text-dark)' }} />
          <span style={{ fontWeight: 600 }}>{offender.primaryCrime}</span>
        </div>
        
        {/* Associate links list */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Radio size={12} className="text-dark" style={{ color: 'var(--text-dark)' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {offender.associates.slice(0, 3).map(assocId => {
              const assoc = offenders.find(o => o.id === assocId);
              if (!assoc) return null;
              return (
                <span key={assocId} className="offender-tag" style={{ fontSize: '0.6rem', padding: '0.05rem 0.25rem' }}>
                  {assoc.alias}
                </span>
              );
            })}
            {offender.associates.length > 3 && (
              <span className="offender-tag" style={{ fontSize: '0.6rem', padding: '0.05rem 0.25rem' }}>
                +{offender.associates.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
