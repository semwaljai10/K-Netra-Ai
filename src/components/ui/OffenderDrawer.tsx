'use client';

import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { StatusBadge } from './Badge';
import GlassPanel from './GlassPanel';
import { User, Activity, AlertTriangle, Calendar, X } from 'lucide-react';

export default function OffenderDrawer() {
  const { selectedOffenderId, setSelectedOffenderId, offenders } = useApp();

  const offender = offenders.find(o => o.id === selectedOffenderId);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedOffenderId(null);
      }
    };
    if (selectedOffenderId) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOffenderId, setSelectedOffenderId]);

  if (!offender) return null;

  // Color grade for risk scores
  const getRiskColor = (score: number) => {
    if (score >= 85) return 'var(--color-red)';
    if (score >= 60) return 'var(--color-yellow)';
    return 'var(--color-blue)';
  };

  const riskColor = getRiskColor(offender.riskScore);

  return (
    <div className="drawer-overlay" onClick={() => setSelectedOffenderId(null)}>
      <GlassPanel 
        className="drawer-panel" 
        onClick={(e) => e.stopPropagation()} // Stop propagation
      >
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User className="text-primary" size={20} style={{ color: 'var(--color-blue)' }} />
            <h2 style={{ margin: 0 }}>Tactical Criminal Dossier</h2>
          </div>
          <button className="close-drawer-btn" onClick={() => setSelectedOffenderId(null)}>
            <X size={24} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Profile Card */}
          <div className="drawer-profile-summary">
            <div className="drawer-avatar-box">
              <img 
                src={offender.avatar} 
                alt={offender.name} 
                className="drawer-avatar-img"
              />
            </div>
            <div className="drawer-profile-info">
              <span className="drawer-name">{offender.name}</span>
              <span className="offender-alias-badge">ALIAS: {offender.alias}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '0.2rem' }}>
                Age: {offender.age} | System Status: <StatusBadge status={offender.status} />
              </span>
            </div>
          </div>

          {/* Threat Meter */}
          <div className="drawer-threat-meter">
            <div className="threat-meter-labels">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertTriangle size={14} style={{ color: riskColor }} />
                AI Recidivism Threat Index
              </span>
              <span style={{ color: riskColor, fontFamily: 'var(--font-family-mono)' }}>
                {offender.riskScore}% Risk
              </span>
            </div>
            <div className="threat-meter-bar-bg">
              <div 
                className="threat-meter-bar-fill" 
                style={{ 
                  width: `${offender.riskScore}%`,
                  backgroundColor: riskColor,
                  boxShadow: `0 0 10px ${riskColor}`
                }}
              ></div>
            </div>
          </div>

          {/* Biography */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span className="dossier-label">Dossier Narrative</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
              {offender.bio}
            </p>
          </div>

          {/* Syndicate Connections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span className="dossier-label">Linked Syndicate Associates</span>
            <div className="drawer-associates-list">
              {offender.associates.length > 0 ? (
                offender.associates.map(assocId => {
                  const associate = offenders.find(o => o.id === assocId);
                  if (!associate) return null;
                  return (
                    <span 
                      key={assocId} 
                      className="drawer-associate-badge"
                      onClick={() => setSelectedOffenderId(assocId)}
                    >
                      {associate.alias} ({associate.name.split(' ')[0]})
                    </span>
                  );
                })
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontStyle: 'italic' }}>
                  No active links recorded
                </span>
              )}
            </div>
          </div>

          {/* Offence Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <span className="dossier-label">Arrest & Conviction Log (N={offender.arrestCount})</span>
            <div className="history-timeline">
              {offender.history.map((hist, idx) => (
                <div key={idx} className="timeline-event">
                  <div className="event-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Calendar size={12} />
                      {hist.date}
                    </span>
                    <span>{hist.location}</span>
                  </div>
                  <div className="event-title">{hist.crime}</div>
                  <div className="event-status">Disposition: {hist.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
