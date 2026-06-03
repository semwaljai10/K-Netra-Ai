'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { SeverityBadge, StatusBadge } from '../ui/Badge';
import { formatTimestamp, exportIncidentMatrixToCSV } from '@/lib/utils';
import { Download, Eye, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { MOCK_DISTRICTS } from '@/lib/data';

export default function IncidentTable() {
  const { filteredIncidents, offenders, setSelectedIncidentId, setSelectedOffenderId } = useApp();

  const handleExport = () => {
    exportIncidentMatrixToCSV(filteredIncidents, offenders);
  };

  return (
    <div className="panel-table glass-panel">
      <div className="panel-header-row">
        <h2>
          <ShieldAlert size={16} style={{ color: 'var(--color-red)' }} />
          Active Tactical Incident Matrix
        </h2>
        <div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={handleExport}
            disabled={filteredIncidents.length === 0}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="table-container">
        {filteredIncidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dark)' }}>
            No incident reports matching active console filters.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Classification</th>
                <th>Sector / Zone</th>
                <th>Severity</th>
                <th>Recorded Time</th>
                <th>Linked Suspect</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Telemetry</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map(inc => {
                const district = MOCK_DISTRICTS[inc.districtId] || { name: inc.districtId };
                const offender = offenders.find(o => o.id === inc.offenderId);

                return (
                  <tr key={inc.id}>
                    <td style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--color-blue)', fontWeight: 'bold' }}>
                      {inc.id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{inc.type}</td>
                    <td>{district.name.split(' (')[0]}</td>
                    <td>
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatTimestamp(inc.timestamp)}
                    </td>
                    <td>
                      {offender ? (
                        <button
                          className="btn-link"
                          style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}
                          onClick={() => setSelectedOffenderId(offender.id)}
                        >
                          {offender.name} ({offender.alias})
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-dark)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={inc.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}
                        onClick={() => setSelectedIncidentId(inc.id)}
                      >
                        <Eye size={12} />
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
