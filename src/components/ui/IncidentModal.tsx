'use client';

import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { formatTimestamp } from '@/lib/utils';
import { SeverityBadge, StatusBadge } from './Badge';
import GlassPanel from './GlassPanel';
import { FileText, ShieldAlert, X } from 'lucide-react';
import { MOCK_DISTRICTS } from '@/lib/data';

export default function IncidentModal() {
  const { 
    selectedIncidentId, 
    setSelectedIncidentId, 
    incidents, 
    offenders, 
    setSelectedOffenderId 
  } = useApp();

  const incident = incidents.find(i => i.id === selectedIncidentId);

  // Close on escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIncidentId(null);
      }
    };
    if (selectedIncidentId) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIncidentId, setSelectedIncidentId]);

  if (!incident) return null;

  const district = MOCK_DISTRICTS[incident.districtId] || { name: incident.districtId };
  const offender = offenders.find(o => o.id === incident.offenderId);

  const handleInspectSuspect = () => {
    if (incident.offenderId) {
      setSelectedOffenderId(incident.offenderId);
      setSelectedIncidentId(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setSelectedIncidentId(null)}>
      <GlassPanel 
        className="modal-box animate-zoom" 
        onClick={(e) => e.stopPropagation()} // Stop bubble up to backdrop
      >
        <div className="modal-header">
          <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert className="text-red" style={{ color: 'var(--color-red)' }} size={20} />
            <h2 style={{ margin: 0 }}>Incident Tactical Dossier</h2>
          </div>
          <button className="close-modal-btn" onClick={() => setSelectedIncidentId(null)}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="dossier-grid">
            <div className="dossier-item">
              <span className="dossier-label">File Index ID</span>
              <span className="dossier-val" style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--color-blue)' }}>
                {incident.id}
              </span>
            </div>
            <div className="dossier-item">
              <span className="dossier-label">Severity Level</span>
              <div>
                <SeverityBadge severity={incident.severity} />
              </div>
            </div>
            <div className="dossier-item">
              <span className="dossier-label">Classification</span>
              <span className="dossier-val">{incident.type}</span>
            </div>
            <div className="dossier-item">
              <span className="dossier-label">Dispatch Status</span>
              <div>
                <StatusBadge status={incident.status} />
              </div>
            </div>
            <div className="dossier-item">
              <span className="dossier-label">Sector Zone</span>
              <span className="dossier-val">{district.name}</span>
            </div>
            <div className="dossier-item">
              <span className="dossier-label">Timestamp (Recorded)</span>
              <span className="dossier-val">{formatTimestamp(incident.timestamp)}</span>
            </div>
          </div>

          <div className="dossier-description">
            <span className="dossier-label">Operational Case Analysis</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
              {incident.description}
            </p>
          </div>

          {offender && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '8px',
                marginTop: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="dossier-label" style={{ fontSize: '0.6rem' }}>Primary Linked Suspect</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{offender.name} ({offender.alias})</span>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                onClick={handleInspectSuspect}
              >
                Inspect Dossier
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setSelectedIncidentId(null)}>
            Close File
          </button>
          {offender && (
            <button className="btn btn-primary" onClick={handleInspectSuspect}>
              Inspect Suspect Profile
            </button>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
