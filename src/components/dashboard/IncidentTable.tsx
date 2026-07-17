'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { SeverityBadge, StatusBadgeClickable } from '../ui/Badge';
import { formatTimestamp, exportIncidentMatrixToCSV } from '@/lib/utils';
import { Download, Eye, FileSpreadsheet, ShieldAlert, Search } from 'lucide-react';
import { MOCK_DISTRICTS, Incident } from '@/lib/data';
import StatusModifyModal from '../ui/StatusModifyModal';

export default function IncidentTable() {
  const { filteredIncidents, offenders, setSelectedIncidentId, setSelectedOffenderId } = useApp();
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 25;
  const [tableSearchQuery, setTableSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [statusModifyIncident, setStatusModifyIncident] = React.useState<Incident | null>(null);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredIncidents.length, tableSearchQuery, statusFilter]);

  const searchedIncidents = React.useMemo(() => {
    let list = filteredIncidents;
    if (statusFilter !== 'ALL') {
      list = list.filter(inc => inc.status === statusFilter);
    }
    if (!tableSearchQuery.trim()) return list;
    const query = tableSearchQuery.toLowerCase().trim();
    return list.filter(inc => {
      const district = MOCK_DISTRICTS[inc.districtId] || { name: inc.districtId };
      const offender = offenders.find(o => o.id === inc.offenderId);
      const offenderName = offender ? `${offender.name} ${offender.alias}` : 'unassigned';
      
      return (
        inc.id.toLowerCase().includes(query) ||
        inc.type.toLowerCase().includes(query) ||
        district.name.toLowerCase().includes(query) ||
        inc.severity.toLowerCase().includes(query) ||
        inc.status.toLowerCase().includes(query) ||
        offenderName.toLowerCase().includes(query) ||
        inc.description.toLowerCase().includes(query)
      );
    });
  }, [filteredIncidents, tableSearchQuery, statusFilter, offenders]);

  const handleExport = () => {
    exportIncidentMatrixToCSV(searchedIncidents, offenders);
  };

  const totalItems = searchedIncidents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = searchedIncidents.slice(startIndex, endIndex);

  return (
    <div className="panel-table glass-panel">
      <div className="panel-header-row">
        <h2>
          <ShieldAlert size={16} style={{ color: 'var(--color-red)' }} />
          Active Tactical Incident Matrix
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            className="filter-select"
            style={{ 
              height: '32px', 
              padding: '0 1.5rem 0 0.75rem', 
              fontSize: '0.75rem' 
            }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Resolved">Resolved</option>
          </select>
          <div className="filter-input-wrap" style={{ margin: 0 }}>
            <Search className="filter-icon" size={14} />
            <input
              type="text"
              placeholder="Search table..."
              className="filter-search"
              style={{ 
                padding: '0.4rem 0.75rem 0.4rem 2.2rem', 
                fontSize: '0.75rem', 
                width: '180px',
                height: '32px'
              }}
              value={tableSearchQuery}
              onChange={(e) => setTableSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', height: '32px', fontSize: '0.75rem' }}
            onClick={handleExport}
            disabled={searchedIncidents.length === 0}
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
        ) : searchedIncidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dark)' }}>
            No files to display 
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
              {currentItems.map(inc => {
                const district = MOCK_DISTRICTS[inc.districtId] || { name: inc.districtId };
                const suspectsList = inc.accusedSuspects || [];

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
                      {suspectsList.length === 0 ? (
                        <span style={{ color: 'var(--text-dark)', fontStyle: 'italic' }}>Unassigned</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {suspectsList.map((suspect: any, idx: number) => {
                            const offender = offenders.find(o => o.name.toLowerCase() === suspect.name.toLowerCase());
                            if (offender) {
                              return (
                                <button
                                  key={idx}
                                  className="btn-link"
                                  style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', padding: 0 }}
                                  onClick={() => setSelectedOffenderId(offender.id)}
                                >
                                  {offender.name} ({offender.alias})
                                </button>
                              );
                            }
                            return (
                              <span key={idx} style={{ color: 'var(--text-primary)' }}>
                                {suspect.name || 'Unknown'}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadgeClickable
                        status={inc.status}
                        rawStatus={inc.rawCaseStatus}
                        onClick={() => setStatusModifyIncident(inc)}
                      />
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
      {totalItems > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--panel-border)',
          background: 'rgba(6, 10, 18, 0.25)',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px'
        }}>
          <div 
            className={`pagination-btn-container ${currentPage === 1 ? 'disabled' : ''}`}
            onClick={() => {
              if (currentPage > 1) setCurrentPage(prev => Math.max(prev - 1, 1));
            }}
            style={{ justifyContent: 'flex-start' }}
          >
            <button
              className="pagination-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (currentPage > 1) setCurrentPage(prev => Math.max(prev - 1, 1));
              }}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              &lt;
            </button>
            <span className={`pagination-btn-label ${currentPage === 1 ? 'disabled' : ''}`}>
              Previous
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{totalItems === 0 ? 0 : startIndex + 1}</strong>–<strong style={{ color: 'var(--text-primary)' }}>{endIndex}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong> cases
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>Go to:</span>
                <select
                  className="filter-select"
                  style={{
                    height: '26px',
                    padding: '0 1.25rem 0 0.4rem',
                    fontSize: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderColor: 'var(--panel-border)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                >
                  {Array.from({ length: totalPages }, (_, idx) => {
                    const pageNum = idx + 1;
                    const start = idx * itemsPerPage + 1;
                    const end = Math.min(pageNum * itemsPerPage, totalItems);
                    return (
                      <option 
                        key={pageNum} 
                        value={pageNum} 
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      >
                        {start}–{end}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
          <div 
            className={`pagination-btn-container ${(currentPage === totalPages || totalPages === 0) ? 'disabled' : ''}`}
            onClick={() => {
              if (currentPage < totalPages && totalPages > 0) setCurrentPage(prev => Math.min(prev + 1, totalPages));
            }}
            style={{ justifyContent: 'flex-end' }}
          >
            <span className={`pagination-btn-label ${(currentPage === totalPages || totalPages === 0) ? 'disabled' : ''}`}>
              Next
            </span>
            <button
              className="pagination-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (currentPage < totalPages && totalPages > 0) setCurrentPage(prev => Math.min(prev + 1, totalPages));
              }}
              disabled={currentPage === totalPages || totalPages === 0}
              aria-label="Next page"
            >
              &gt;
            </button>
          </div>
        </div>
      )}

      {/* Status Modify Modal */}
      {statusModifyIncident && (
        <StatusModifyModal
          incident={statusModifyIncident}
          onClose={() => setStatusModifyIncident(null)}
        />
      )}
    </div>
  );
}
