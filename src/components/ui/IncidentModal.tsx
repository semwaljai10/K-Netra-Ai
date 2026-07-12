'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatTimestamp } from '@/lib/utils';
import { SeverityBadge, StatusBadge } from './Badge';
import GlassPanel from './GlassPanel';
import { FileText, ShieldAlert, X, User, Users, FolderOpen, AlertCircle, FileSpreadsheet, MapPin, History } from 'lucide-react';
import { MOCK_DISTRICTS } from '@/lib/data';
import { generateFIRPDF } from '@/lib/pdfGenerator';

type TabType = 'general' | 'people' | 'evidence' | 'analysis' | 'history';

export default function IncidentModal() {
  const { 
    selectedIncidentId, 
    setSelectedIncidentId, 
    incidents, 
    offenders, 
    setSelectedOffenderId 
  } = useApp();

  const [pdfPreview, setPdfPreview] = useState<{ url: string; fileName: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('general');

  const incident = incidents.find(i => i.id === selectedIncidentId);

  const handleViewFile = () => {
    const res = generateFIRPDF(incident!.id, incident);
    if (res) {
      setPdfPreview(res);
    }
  };

  const handleClosePreview = () => {
    if (pdfPreview) {
      URL.revokeObjectURL(pdfPreview.url);
      setPdfPreview(null);
    }
  };

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

  const handleInspectSuspectName = (suspectName: string) => {
    const matchedOffender = offenders.find(o => o.name.toLowerCase() === suspectName.toLowerCase());
    if (matchedOffender) {
      setSelectedOffenderId(matchedOffender.id);
      setSelectedIncidentId(null);
    }
  };

  // Helper to extract suspects & victims from _source if available, otherwise fallback to old fields
  const accusedList = incident.accusedSuspects || (incident as any)._source?.all_suspects || [];
  const victimsList = incident.victims || (incident as any)._source?.all_victims || [];
  const witnessesList = incident.witnesses || (incident as any)._source?.witnesses || [];
  const evidenceList = incident.evidenceCollected || (incident as any)._source?.evidence_collected || [];
  const spatiotemporal = incident.analyticalTags?.spatiotemporal || (incident as any)._source?.analytical_tags?.spatiotemporal || {};
  const trendIndicators = incident.analyticalTags?.trend_indicators || (incident as any)._source?.analytical_tags?.trend_indicators || {};
  const complainant = incident.complainant || (incident as any)._source?.complainant;

  return (
    <div className="modal-overlay" onClick={() => setSelectedIncidentId(null)}>
      <GlassPanel 
        className="modal-box animate-zoom" 
        style={{ width: '90%', maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.25rem' }}
        onClick={(e) => e.stopPropagation()} // Stop bubble up to backdrop
      >
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--panel-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert className="text-red" style={{ color: 'var(--color-red)' }} size={22} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Tactical Inquest Dossier</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FIR No: {incident.firNumber || incident.id}</span>
            </div>
          </div>
          <button className="close-modal-btn" onClick={() => setSelectedIncidentId(null)}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Headers */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--panel-border)', margin: '0.75rem 0 1rem 0' }}>
          {(['general', 'people', 'evidence', 'analysis', 'history'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === tab ? 'var(--color-blue)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--color-blue)' : '2px solid transparent',
                padding: '0.5rem 0.25rem',
                fontSize: '0.85rem',
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {tab === 'general' && <FolderOpen size={14} />}
              {tab === 'people' && <Users size={14} />}
              {tab === 'evidence' && <FileSpreadsheet size={14} />}
              {tab === 'analysis' && <MapPin size={14} />}
              {tab === 'history' && <History size={14} />}
              {tab === 'history' ? 'Audit Log' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="dossier-grid" style={{ gap: '0.75rem' }}>
                <div className="dossier-item">
                  <span className="dossier-label">Unique Case ID</span>
                  <span className="dossier-val" style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--color-blue)' }}>
                    {incident.id}
                  </span>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Severity Level</span>
                  <div><SeverityBadge severity={incident.severity} /></div>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Crime Classification</span>
                  <span className="dossier-val">{incident.type}</span>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Dispatch Status</span>
                  <div><StatusBadge status={incident.status} /></div>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Sector Zone</span>
                  <span className="dossier-val">{district.name}</span>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Filing Timestamp</span>
                  <span className="dossier-val">{formatTimestamp(incident.timestamp)}</span>
                </div>
              </div>

              {/* Police Station */}
              {incident.policeStation && (
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  <span className="dossier-label" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>Jurisdiction Station</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div><strong>Name:</strong> {incident.policeStation.name}</div>
                    <div><strong>Code:</strong> {incident.policeStation.stationCode}</div>
                    <div><strong>District:</strong> {incident.policeStation.district}</div>
                    <div><strong>State:</strong> {incident.policeStation.state}</div>
                  </div>
                </div>
              )}

              {/* Investigating Officer */}
              {incident.investigatingOfficer && (
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  <span className="dossier-label" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>Assigned Investigating Officer</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div><strong>Name:</strong> {incident.investigatingOfficer.name}</div>
                    <div><strong>Officer ID:</strong> {incident.investigatingOfficer.officerId}</div>
                    <div><strong>Designation:</strong> {incident.investigatingOfficer.designation}</div>
                    <div><strong>Contact:</strong> {incident.investigatingOfficer.contact || 'N/A'}</div>
                  </div>
                </div>
              )}

              <div className="dossier-description" style={{ marginTop: '0.25rem' }}>
                <span className="dossier-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Operational Case Narrative Summary</span>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.45', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {incident.description}
                </p>
              </div>
            </div>
          )}

          {/* PEOPLE TAB */}
          {activeTab === 'people' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Complainant Section */}
              {complainant && (
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--color-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={15} /> Complainant Details
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', background: 'rgba(255, 255, 255, 0.01)' }}>
                    <div><strong>Name:</strong> {complainant.name}</div>
                    <div><strong>Age / Gender:</strong> {complainant.age || 'N/A'} / {complainant.gender || 'N/A'}</div>
                    {complainant.contactPhone && <div><strong>Phone:</strong> {complainant.contactPhone}</div>}
                    {complainant.contactEmail && <div><strong>Email:</strong> {complainant.contactEmail}</div>}
                    {complainant.idType && <div style={{ gridColumn: 'span 2' }}><strong>Identification:</strong> {complainant.idType} - {complainant.idNumber}</div>}
                    {complainant.address && <div style={{ gridColumn: 'span 2', fontSize: '0.75rem', color: 'var(--text-muted)' }}><strong>Address:</strong> {complainant.address}</div>}
                  </div>
                </div>
              )}

              {/* Accused Suspects Section */}
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--color-red)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldAlert size={15} /> Accused / Suspects ({accusedList.length})
                </h3>
                {accusedList.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No accused listed in FIR.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {accusedList.map((suspect: any, idx: number) => {
                      const matchedOffender = offenders.find(o => o.name.toLowerCase() === suspect.name.toLowerCase());
                      return (
                        <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', background: 'rgba(239, 68, 68, 0.02)', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{suspect.name} {suspect.alias ? `(${suspect.alias})` : ''}</span>
                            <span style={{
                              fontSize: '0.65rem',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                              backgroundColor: suspect.arrest_status === 'Arrested' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: suspect.arrest_status === 'Arrested' ? 'var(--color-success)' : 'var(--color-red)',
                            }}>
                              {suspect.arrest_status || 'Not Arrested'}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem' }}>
                            <div><strong>Suspect ID:</strong> {suspect.suspect_id || 'N/A'}</div>
                            <div><strong>Age / Gender:</strong> {suspect.age || 'N/A'} / {suspect.gender || 'N/A'}</div>
                            {suspect.contact_phone && <div><strong>Phone:</strong> {suspect.contact_phone}</div>}
                            {suspect.prior_record_id && <div><strong>Prior Case ID:</strong> {suspect.prior_record_id}</div>}
                            {suspect.arrest_date && <div style={{ gridColumn: 'span 2' }}><strong>Arrest Date:</strong> {suspect.arrest_date}</div>}
                            {suspect.address && <div style={{ gridColumn: 'span 2', fontSize: '0.75rem', color: 'var(--text-muted)' }}><strong>Address:</strong> {suspect.address}</div>}
                          </div>
                          {matchedOffender && (
                            <button
                              className="btn btn-secondary"
                              style={{ position: 'absolute', right: '0.75rem', bottom: '0.75rem', padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                              onClick={() => handleInspectSuspectName(suspect.name)}
                            >
                              Inspect Profile
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Victims Section */}
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={15} /> Victims ({victimsList.length})
                </h3>
                {victimsList.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>No victims listed in FIR.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {victimsList.map((victim: any, idx: number) => (
                      <div key={idx} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', background: 'rgba(255, 255, 255, 0.01)' }}>
                        <div style={{ fontWeight: 'bold' }}>{victim.name}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          <div><strong>Age / Gender:</strong> {victim.age || 'N/A'} / {victim.gender || 'N/A'}</div>
                          <div><strong>Relation to Suspect:</strong> {victim.relation_to_accused || 'N/A'}</div>
                          {victim.injury_description && <div style={{ gridColumn: 'span 2', color: 'var(--color-yellow)', fontSize: '0.75rem' }}><strong>Injury Description:</strong> {victim.injury_description}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* EVIDENCE & WITNESSES TAB */}
          {activeTab === 'evidence' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Evidence list */}
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--color-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileSpreadsheet size={15} /> Evidence Collected ({evidenceList.length})
                </h3>
                {evidenceList.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>No evidence logged for this case.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.4rem' }}>Type</th>
                          <th style={{ padding: '0.4rem' }}>Description</th>
                          <th style={{ padding: '0.4rem' }}>Date</th>
                          <th style={{ padding: '0.4rem' }}>Custodian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evidenceList.map((evidence: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                            <td style={{ padding: '0.4rem', fontWeight: 600 }}>{evidence.evidence_type}</td>
                            <td style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>{evidence.description}</td>
                            <td style={{ padding: '0.4rem', whiteSpace: 'nowrap' }}>{evidence.collection_date || 'N/A'}</td>
                            <td style={{ padding: '0.4rem', fontSize: '0.75rem' }}>{evidence.custodian || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Witnesses list */}
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--color-yellow)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={15} /> Witness Inquests ({witnessesList.length})
                </h3>
                {witnessesList.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>No witness testimonies logged.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {witnessesList.map((witness: any, idx: number) => (
                      <div key={idx} style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', background: 'rgba(255, 255, 255, 0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 'bold' }}>{witness.name}</span>
                          {witness.contact_phone && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{witness.contact_phone}</span>}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontStyle: 'italic' }}>
                          "{witness.statement_summary}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ANALYSIS TAB */}
          {activeTab === 'analysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Spatiotemporal and Trend Indicators */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                
                {/* Spatiotemporal */}
                <div style={{ border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.01)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--color-blue)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertCircle size={14} /> Spatiotemporal Profiles
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div><strong>Time of Day:</strong> {spatiotemporal.time_of_day || 'N/A'}</div>
                    <div><strong>Day of Week:</strong> {spatiotemporal.day_of_week || 'N/A'}</div>
                    <div><strong>Weekend:</strong> {spatiotemporal.is_weekend === true ? 'Yes' : spatiotemporal.is_weekend === false ? 'No' : 'N/A'}</div>
                    <div><strong>Season:</strong> {spatiotemporal.season || 'N/A'}</div>
                  </div>
                </div>

                {/* Trend Indicators */}
                <div style={{ border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.01)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--color-red)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertCircle size={14} /> Behavioral Analytics
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div><strong>Crime Classification:</strong> {trendIndicators.crime_category || 'N/A'}</div>
                    <div><strong>Repeat Suspect:</strong> {trendIndicators.is_repeat_offender === true ? 'Yes' : trendIndicators.is_repeat_offender === false ? 'No' : 'N/A'}</div>
                    <div><strong>Organized Syndicate:</strong> {trendIndicators.is_organized_crime === true ? 'Yes' : trendIndicators.is_organized_crime === false ? 'No' : 'N/A'}</div>
                  </div>
                </div>

              </div>

              {/* Coordinates Map Meta */}
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.01)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={14} /> Telemetric Coordinates
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div><strong>Latitude:</strong> {incident.coords[0]}</div>
                  <div><strong>Longitude:</strong> {incident.coords[1]}</div>
                  {incident.policeStation && <div style={{ gridColumn: 'span 2' }}><strong>Assigned Precinct Code:</strong> {incident.policeStation.stationCode}</div>}
                </div>
              </div>

            </div>
          )}

          {/* AUDIT LOG / HISTORY TAB */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* User Modification History */}
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.01)' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--color-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <History size={14} /> Status Modification History
                </h4>
                
                {incident.statusModification ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', background: 'rgba(255,255,255,0.04)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                          {incident.statusModification.previousStatus}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-blue)', textTransform: 'uppercase', background: 'var(--color-blue-badge)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-blue)' }}>
                          {incident.statusModification.newStatus}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(incident.statusModification.modifiedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <div><strong>Modified By User:</strong> <span style={{ color: 'var(--color-blue)' }}>{incident.statusModification.modifiedBy}</span></div>
                      <div><strong>User ID:</strong> <span style={{ color: 'var(--color-yellow)', fontFamily: 'var(--font-family-mono)' }}>{(incident.statusModification.modifiedByUserId || '').toUpperCase()}</span></div>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--panel-border)', fontSize: '0.8rem' }}>
                      <strong>Justification / Remarks:</strong>
                      <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.4' }}>
                        "{incident.statusModification.remarks}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>
                    No manual status modifications have been recorded for this FIR.
                  </p>
                )}
              </div>

              {/* Case Closure details if closed originally or through modification */}
              {((incident as any)._source?.closure_details || incident.statusModification?.closureDetails) && (() => {
                const cd = (incident as any)._source?.closure_details || incident.statusModification?.closureDetails;
                return (
                  <div style={{ border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.01)' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={14} /> Case Closure Dossier
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <div><strong>Closure Date:</strong> {cd.closure_date ? formatTimestamp(cd.closure_date) : cd.closureDate ? new Date(cd.closureDate).toLocaleString('en-IN') : 'N/A'}</div>
                        <div><strong>Closure Sub-Status:</strong> <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>{cd.closure_sub_status || cd.closureSubStatus || 'N/A'}</span></div>
                      </div>

                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--panel-border)', fontSize: '0.8rem' }}>
                        <strong>Reason for Closure:</strong>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {cd.reason_for_closure || cd.reasonForClosure || 'N/A'}
                        </p>
                      </div>

                      {/* Closing Authority */}
                      {cd.closing_authority && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Closing Authority</span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.8rem' }}>
                            <div><strong>Officer Name:</strong> {cd.closing_authority.officer_name || cd.closing_authority.officerName || 'N/A'}</div>
                            <div><strong>Designation:</strong> {cd.closing_authority.designation || 'N/A'}</div>
                            <div><strong>Police Station:</strong> {cd.closing_authority.police_station || cd.closing_authority.policeStation || 'N/A'}</div>
                            <div><strong>Jurisdiction:</strong> {cd.closing_authority.jurisdiction || 'N/A'}</div>
                          </div>
                        </div>
                      )}

                      {/* Outcome / Judicial */}
                      {cd.outcome && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Judicial Outcome / Verdict</span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.8rem' }}>
                            <div><strong>Verdict:</strong> {cd.outcome.verdict || 'N/A'}</div>
                            <div><strong>Court Name:</strong> {cd.outcome.court_name || cd.outcome.courtName || 'N/A'}</div>
                            <div><strong>Case Number:</strong> {cd.outcome.case_number_court || cd.outcome.caseNumberCourt || 'N/A'}</div>
                            {cd.outcome.judgment_date && <div><strong>Judgment Date:</strong> {cd.outcome.judgment_date || cd.outcome.judgmentDate || 'N/A'}</div>}
                            {cd.outcome.sentence_duration && <div><strong>Sentence Duration:</strong> {cd.outcome.sentence_duration || cd.outcome.sentenceDuration || 'N/A'}</div>}
                            {cd.outcome.fine_amount && <div><strong>Fine Amount:</strong> {cd.outcome.fine_amount || cd.outcome.fineAmount || 'N/A'}</div>}
                          </div>
                        </div>
                      )}

                      {/* Final Remarks */}
                      {(cd.final_remarks || cd.finalRemarks) && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.5rem', fontSize: '0.8rem' }}>
                          <strong>Final Remarks:</strong>
                          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            {cd.final_remarks || cd.finalRemarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setSelectedIncidentId(null)}>
            Close Inquest
          </button>
          
          <button 
            className="btn btn-secondary" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--color-success)',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}
            onClick={handleViewFile}
          >
            <FileText size={14} />
            Generate FIR PDF
          </button>

          {/* Primary suspect inspect button */}
          {accusedList.length > 0 && offenders.some(o => o.name.toLowerCase() === accusedList[0].name.toLowerCase()) && (
            <button 
              className="btn btn-primary" 
              onClick={() => handleInspectSuspectName(accusedList[0].name)}
            >
              Inspect Suspect Profile
            </button>
          )}
        </div>
      </GlassPanel>

      {/* PDF View Modal Overlay */}
      {pdfPreview && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1100, background: 'rgba(0, 0, 0, 0.75)' }} 
          onClick={(e) => {
            e.stopPropagation();
            handleClosePreview();
          }}
        >
          <GlassPanel 
            className="modal-box animate-zoom" 
            style={{ 
              width: '85%', 
              maxWidth: '950px', 
              height: '85vh', 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '1.5rem',
              backgroundColor: 'var(--panel-bg)',
              borderColor: 'var(--panel-border)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText style={{ color: 'var(--color-success)' }} size={20} />
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Case FIR Inquest: {incident.id}</h2>
              </div>
              <button className="close-modal-btn" onClick={handleClosePreview}>
                <X size={20} />
              </button>
            </div>

            <div style={{ 
              flexGrow: 1, 
              width: '100%', 
              height: 'calc(100% - 110px)', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              backgroundColor: 'var(--bg-primary)', 
              border: '1px solid var(--panel-border)' 
            }}>
              <iframe 
                src={`${pdfPreview.url}#toolbar=0&navpanes=0`}
                title="PDF Inquest Document"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
            </div>

            <div className="modal-footer" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: 0, border: 'none', background: 'transparent' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleClosePreview}
              >
                Close Preview
              </button>
              <a 
                href={pdfPreview.url} 
                download={pdfPreview.fileName}
                className="btn btn-primary"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  textDecoration: 'none',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-success)',
                  borderColor: 'var(--color-success)',
                  color: '#fff'
                }}
              >
                Download PDF
              </a>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
