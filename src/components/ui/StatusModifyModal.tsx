'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import GlassPanel from './GlassPanel';
import { X, ChevronRight, ChevronLeft, ShieldCheck, Lock, AlertTriangle, CheckCircle, Edit3, Eye, EyeOff } from 'lucide-react';
import { MOCK_DISTRICTS, type Incident } from '@/lib/data';
import { DISTRICT_STATIONS } from '@/lib/stations';
import DateTimePicker from './DateTimePicker';

const RAW_STATUSES = [
  'Open',
  'Under Investigation',
  'Charge Sheet Filed',
  'Closed',
  'Transferred',
] as const;

const CLOSURE_SUB_STATUSES = [
  'Acquittal',
  'Conviction',
  'Compromise',
  'Referred',
  'Undetected / Unsolved',
  'Final Report (FR)',
] as const;

const DESIGNATIONS = [
  'Sub-Inspector of Police',
  'Inspector of Police',
  'Deputy Superintendent of Police (DySP)',
  'Assistant Superintendent of Police (ASP)',
  'Additional Superintendent of Police (Addl. SP)',
  'Superintendent of Police (SP)',
  'Senior Superintendent of Police (SSP)',
  'Deputy Inspector General of Police (DIG)',
  'Inspector General of Police (IGP)',
  'Additional Director General of Police (ADGP)',
  'Director General of Police (DGP)',
] as const;

interface StatusModifyModalProps {
  incident: Incident;
  onClose: () => void;
}

type Step = 'select' | 'closure' | 'credentials';

export default function StatusModifyModal({ incident, onClose }: StatusModifyModalProps) {
  const { verifyCredentials, updateIncidentStatus, currentUser } = useApp();

  // Determine the current raw status
  const currentRawStatus = incident.rawCaseStatus || (() => {
    // Reverse-map from app status to a likely raw status
    switch (incident.status) {
      case 'Resolved': return 'Closed';
      case 'Dispatched': return 'Charge Sheet Filed';
      case 'Open':
      default: return 'Open';
    }
  })();

  // Parent and sub-status helper mappers
  const getParentStatus = (raw: string) => {
    if (raw === 'Closed' || raw === 'Resolved') return 'Resolved';
    if (raw === 'Transferred' || raw === 'Charge Sheet Filed' || raw === 'Dispatched') return 'Dispatched';
    return 'Open';
  };

  const getSubStatus = (raw: string) => {
    if (raw === 'Closed' || raw === 'Resolved') return 'Closed';
    if (raw === 'Transferred' || raw === 'Charge Sheet Filed' || raw === 'Dispatched') return 'Transferred';
    if (raw === 'Under Investigation') return 'Under Investigation';
    return 'Open';
  };

  const initialParent = getParentStatus(currentRawStatus);
  const initialSub = getSubStatus(currentRawStatus);
  const initialChargeSheetFiled = !!incident.legal_outcome?.charge_sheet_filed;

  // Step management
  const [step, setStep] = useState<Step>('select');

  // Helper for local datetime string
  const getLocalDatetimeString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  // Step 1: Status selection
  const [selectedParentStatus, setSelectedParentStatus] = useState<string>(initialParent);
  const [selectedSubStatus, setSelectedSubStatus] = useState<string>(initialSub);
  const [chargeSheetFiled, setChargeSheetFiled] = useState<boolean>(initialChargeSheetFiled);
  const [remarks, setRemarks] = useState('');
  const [modificationDate] = useState(getLocalDatetimeString());

  // Step 2: Closure details
  const [closureDate, setClosureDate] = useState(getLocalDatetimeString());
  const [closureSubStatus, setClosureSubStatus] = useState('');
  const [reasonForClosure, setReasonForClosure] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [designation, setDesignation] = useState('');
  const [jurisdiction, setJurisdiction] = useState(incident.districtId || '');
  const [closingPoliceStation, setClosingPoliceStation] = useState(incident.policeStation?.name || '');

  const handleDistrictChange = (newDistrictId: string) => {
    setJurisdiction(newDistrictId);
    const stations = DISTRICT_STATIONS[newDistrictId] || [];
    if (stations.length > 0) {
      setClosingPoliceStation(stations[0].name);
    } else {
      setClosingPoliceStation('');
    }
  };

  const closingPoliceStationCode = React.useMemo(() => {
    if (!jurisdiction || !closingPoliceStation) return '';
    const stations = DISTRICT_STATIONS[jurisdiction] || [];
    const found = stations.find(s => s.name === closingPoliceStation);
    return found ? found.code : '';
  }, [jurisdiction, closingPoliceStation]);
  const [verdict, setVerdict] = useState('');
  const [courtName, setCourtName] = useState('');
  const [caseNumberCourt, setCaseNumberCourt] = useState('');
  const [sentenceDuration, setSentenceDuration] = useState('');
  const [fineAmount, setFineAmount] = useState('');
  const [judgmentDate, setJudgmentDate] = useState('');
  const [finalRemarks, setFinalRemarks] = useState('');

  // Step 3: Credential verification
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState('');
  const [success, setSuccess] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isClosed = selectedParentStatus === 'Resolved';
  
  const hasChanges = 
    selectedParentStatus !== initialParent ||
    selectedSubStatus !== initialSub ||
    chargeSheetFiled !== initialChargeSheetFiled;

  const isStep1Valid = hasChanges && remarks.trim().length > 0;

  // Validation for step 2 (closure)
  const isStep2Valid = 
    closureDate.trim() !== '' &&
    closureSubStatus.trim() !== '' &&
    reasonForClosure.trim() !== '' &&
    officerName.trim() !== '' &&
    designation.trim() !== '' &&
    closingPoliceStation.trim() !== '' &&
    jurisdiction.trim() !== '';

  const handleParentStatusChange = (newParent: string) => {
    setSelectedParentStatus(newParent);
    if (newParent === 'Open') {
      setChargeSheetFiled(false);
    }
    if (newParent === initialParent) {
      setSelectedSubStatus(initialSub);
      if (newParent !== 'Open') {
        setChargeSheetFiled(initialChargeSheetFiled);
      }
    } else {
      if (newParent === 'Open') {
        setSelectedSubStatus('Under Investigation');
      } else if (newParent === 'Dispatched') {
        setSelectedSubStatus('Transferred');
      } else if (newParent === 'Resolved') {
        setSelectedSubStatus('Closed');
      }
    }
  };

  const handleNext = () => {
    if (step === 'select') {
      if (isClosed) {
        setStep('closure');
      } else {
        setStep('credentials');
      }
    } else if (step === 'closure') {
      setStep('credentials');
    }
  };

  const handleBack = () => {
    if (step === 'credentials') {
      setStep(isClosed ? 'closure' : 'select');
    } else if (step === 'closure') {
      setStep('select');
    }
    setAuthError('');
  };

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setAuthError('Both username and password are required.');
      return;
    }

    setVerifying(true);
    setAuthError('');

    try {
      const result = await verifyCredentials(username, password);
      if (!result.valid) {
        setAuthError('Invalid credentials. Access denied.');
        setVerifying(false);
        return;
      }

      // Security check: only the originally logged-in user can modify status
      if (currentUser && result.username.trim().toLowerCase() !== currentUser.username.trim().toLowerCase()) {
        const errorMsg = 'Only the user that has originally logged in can modify the status.';
        alert(errorMsg);
        setAuthError(errorMsg);
        setVerifying(false);
        return;
      }

      // Build closure details if status is Closed
      const closureDetails = isClosed ? {
        closureDate,
        closureSubStatus,
        reasonForClosure,
        closingAuthority: {
          officerName,
          designation,
          policeStation: closingPoliceStation,
          policeStationCode: closingPoliceStationCode,
          jurisdiction: MOCK_DISTRICTS[jurisdiction]?.name || jurisdiction,
        },
        outcome: (verdict || courtName || caseNumberCourt) ? {
          verdict: verdict || undefined,
          courtName: courtName || undefined,
          caseNumberCourt: caseNumberCourt || undefined,
          sentenceDuration: sentenceDuration || undefined,
          fineAmount: fineAmount || undefined,
          judgmentDate: judgmentDate || undefined,
        } : undefined,
        finalRemarks: finalRemarks || undefined,
      } : undefined;

      updateIncidentStatus(
        incident.id,
        selectedSubStatus,
        remarks,
        result.name || username,
        result.username || username,
        closureDetails,
        selectedParentStatus === 'Open' ? false : chargeSheetFiled
      );

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setAuthError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const stepIndex = step === 'select' ? 0 : step === 'closure' ? 1 : (isClosed ? 2 : 1);
  const totalSteps = isClosed ? 3 : 2;

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <GlassPanel
          className="modal-box animate-zoom status-modify-modal"
          style={{ width: '90%', maxWidth: '480px', padding: '2.5rem', textAlign: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="status-modify-success">
            <CheckCircle size={56} style={{ color: 'var(--color-success)', marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              Status Modified Successfully
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              FIR <strong>{incident.firNumber || incident.id}</strong> status changed to <strong>{selectedSubStatus}</strong>
            </p>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <GlassPanel
        className="modal-box animate-zoom status-modify-modal"
        style={{
          width: '90%',
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--panel-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit3 size={20} style={{ color: 'var(--color-blue)' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Modify FIR Status</h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                FIR: {incident.firNumber || incident.id}
              </span>
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Step Progress */}
        <div className="status-modify-progress" style={{ padding: '0.75rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <React.Fragment key={i}>
                <div
                  className={`status-modify-step-dot ${i <= stepIndex ? 'active' : ''} ${i < stepIndex ? 'completed' : ''}`}
                >
                  {i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`status-modify-step-line ${i < stepIndex ? 'active' : ''}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {step === 'select' && 'Select New Status'}
            {step === 'closure' && 'Closure Details (Mandatory)'}
            {step === 'credentials' && 'Credential Verification'}
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem 0' }}>

          {/* ── STEP 1: Status Selection ── */}
          {step === 'select' && (
            <div className="status-modify-step-content">
              <div className="sm-field-group">
                <label className="sm-label">Current Status</label>
                <div className="sm-current-status">
                  <span className="sm-status-chip">{currentRawStatus}</span>
                </div>
              </div>

              <div className="sm-field-group">
                <label className="sm-label">New Status <span className="sm-required">*</span></label>
                <select
                  className="sm-select"
                  value={selectedParentStatus}
                  onChange={(e) => handleParentStatusChange(e.target.value)}
                >
                  <option value="Open">Open</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div className="sm-field-group">
                <label className="sm-label">Sub Status <span className="sm-required">*</span></label>
                <select
                  className="sm-select"
                  value={selectedSubStatus}
                  onChange={(e) => setSelectedSubStatus(e.target.value)}
                >
                  {selectedParentStatus === 'Open' && (
                    <>
                      <option value="Open">Open</option>
                      <option value="Under Investigation">Under Investigation</option>
                    </>
                  )}
                  {selectedParentStatus === 'Dispatched' && (
                    <>
                      <option value="Transferred">Transferred</option>
                    </>
                  )}
                  {selectedParentStatus === 'Resolved' && (
                    <>
                      <option value="Closed">Closed</option>
                    </>
                  )}
                </select>
                {isClosed && (
                  <div className="sm-info-banner">
                    <AlertTriangle size={14} />
                    <span>Setting status to <strong>Closed</strong> requires mandatory closure details in the next step.</span>
                  </div>
                )}
              </div>

              {/* Charge Sheet Filed Checkbox */}
              <div className="sm-field-group" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem', marginBottom: '0.5rem', opacity: selectedParentStatus === 'Open' ? 0.5 : 1 }}>
                <input
                  type="checkbox"
                  id="chargeSheetFiled"
                  checked={selectedParentStatus === 'Open' ? false : chargeSheetFiled}
                  disabled={selectedParentStatus === 'Open'}
                  onChange={(e) => setChargeSheetFiled(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: selectedParentStatus === 'Open' ? 'not-allowed' : 'pointer',
                    accentColor: 'var(--color-blue)',
                    borderRadius: '4px',
                    border: '1px solid var(--panel-border)'
                  }}
                />
                <label htmlFor="chargeSheetFiled" className="sm-label" style={{ margin: 0, cursor: selectedParentStatus === 'Open' ? 'not-allowed' : 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Charge Sheet Filed: <strong style={{ color: (selectedParentStatus !== 'Open' && chargeSheetFiled) ? 'var(--color-success)' : 'var(--text-muted)' }}>{(selectedParentStatus !== 'Open' && chargeSheetFiled) ? 'YES' : 'NO'}</strong>
                </label>
              </div>

              <div className="sm-field-group">
                <label className="sm-label">Modification Date</label>
                <input
                  type="datetime-local"
                  className="sm-input"
                  value={modificationDate}
                  readOnly
                  style={{ opacity: 0.7 }}
                />
              </div>

              <div className="sm-field-group">
                <label className="sm-label">Remarks <span className="sm-required">*</span></label>
                <textarea
                  className="sm-textarea"
                  placeholder="Provide justification for the status change..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* ── STEP 2: Closure Details ── */}
          {step === 'closure' && (
            <div className="status-modify-step-content">
              <div className="sm-section-header">
                <ShieldCheck size={16} />
                Closure Information
              </div>

              <div className="sm-field-row">
                <div className="sm-field-group" style={{ flex: 1 }}>
                  <label className="sm-label">Closure Date <span className="sm-required">*</span></label>
                  <DateTimePicker
                    value={closureDate}
                    onChange={(val) => setClosureDate(val)}
                    required
                  />
                </div>
                <div className="sm-field-group" style={{ flex: 1 }}>
                  <label className="sm-label">Closure Sub-Status <span className="sm-required">*</span></label>
                  <select
                    className="sm-select"
                    value={closureSubStatus}
                    onChange={(e) => setClosureSubStatus(e.target.value)}
                  >
                    <option value="">Select sub-status...</option>
                    {CLOSURE_SUB_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm-field-group">
                <label className="sm-label">Reason for Closure <span className="sm-required">*</span></label>
                <textarea
                  className="sm-textarea"
                  placeholder="Provide the detailed reason for closure..."
                  value={reasonForClosure}
                  onChange={(e) => setReasonForClosure(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="sm-section-header" style={{ marginTop: '0.75rem' }}>
                <ShieldCheck size={16} />
                Closing Authority <span className="sm-required">*</span>
              </div>

              <div className="sm-field-row">
                <div className="sm-field-group" style={{ flex: 1 }}>
                  <label className="sm-label">Officer Name <span className="sm-required">*</span></label>
                  <input
                    type="text"
                    className="sm-input"
                    placeholder="Full name of closing officer"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                  />
                </div>
                <div className="sm-field-group" style={{ flex: 1 }}>
                  <label className="sm-label">Designation <span className="sm-required">*</span></label>
                  <select
                    className="sm-select"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  >
                    <option value="">Select designation...</option>
                    {DESIGNATIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm-field-row">
                <div className="sm-field-group" style={{ flex: 1 }}>
                  <label className="sm-label">Jurisdiction (District) <span className="sm-required">*</span></label>
                  <select
                    className="sm-select"
                    value={jurisdiction}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                  >
                    <option value="">Select district...</option>
                    {Object.values(MOCK_DISTRICTS).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm-field-group" style={{ flex: 1 }}>
                  <label className="sm-label">Police Station <span className="sm-required">*</span></label>
                  <select
                    className="sm-select"
                    value={closingPoliceStation}
                    onChange={(e) => setClosingPoliceStation(e.target.value)}
                    disabled={!jurisdiction}
                  >
                    <option value="">Select police station...</option>
                    {(DISTRICT_STATIONS[jurisdiction] || []).map(s => (
                      <option key={s.code} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                  {closingPoliceStationCode && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                      Station Code: <strong style={{ color: 'var(--color-blue)', fontFamily: 'var(--font-family-mono)' }}>{closingPoliceStationCode}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="sm-section-header" style={{ marginTop: '0.75rem' }}>
                <ShieldCheck size={16} />
                Outcome (Optional)
              </div>

              <div className="sm-field-row">
                <div className="sm-field-group" style={{ flex: 1 }}>
                  <label className="sm-label">Verdict</label>
                  <select
                    className="sm-select"
                    value={verdict}
                    onChange={(e) => setVerdict(e.target.value)}
                  >
                    <option value="">Select verdict...</option>
                    <option value="Acquitted">Acquitted</option>
                    <option value="Convicted">Convicted</option>
                    <option value="Discharged">Discharged</option>
                    <option value="Compounded">Compounded</option>
                  </select>
                </div>
                <div className="sm-field-group" style={{ flex: 1 }}>
                  <label className="sm-label">Court Name</label>
                  <input
                    type="text"
                    className="sm-input"
                    placeholder="e.g. District & Sessions Court"
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                  />
                </div>
              </div>

              <div className="sm-field-row">
                <div className="sm-field-group" style={{ flex: 1 }}>
                  <label className="sm-label">Case Number (Court)</label>
                  <input
                    type="text"
                    className="sm-input"
                    placeholder="e.g. CC No. 1234/2026"
                    value={caseNumberCourt}
                    onChange={(e) => setCaseNumberCourt(e.target.value)}
                  />
                </div>
                <div className="sm-field-group" style={{ flex: 1 }}>
                  <label className="sm-label">Judgment Date</label>
                  <DateTimePicker
                    value={judgmentDate}
                    onChange={(val) => setJudgmentDate(val)}
                    placeholder="Select Judgment Date"
                  />
                </div>
              </div>

              <div className="sm-field-row">
                <div className="sm-field-group" style={{ flex: 1 }}>
                  <label className="sm-label">Sentence Duration</label>
                  <input
                    type="text"
                    className="sm-input"
                    placeholder="e.g. 2 years RI"
                    value={sentenceDuration}
                    onChange={(e) => setSentenceDuration(e.target.value)}
                  />
                </div>
                <div className="sm-field-group" style={{ flex: 1 }}>
                  <label className="sm-label">Fine Amount</label>
                  <input
                    type="text"
                    className="sm-input"
                    placeholder="e.g. ₹25,000"
                    value={fineAmount}
                    onChange={(e) => setFineAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="sm-field-group">
                <label className="sm-label">Final Remarks</label>
                <textarea
                  className="sm-textarea"
                  placeholder="Additional closing remarks (optional)..."
                  value={finalRemarks}
                  onChange={(e) => setFinalRemarks(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* ── STEP 3: Credential Verification ── */}
          {step === 'credentials' && (
            <div className="status-modify-step-content">
              <div className="sm-credential-header">
                <Lock size={32} style={{ color: 'var(--color-yellow)' }} />
                <h3 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Authorization Required
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0 auto', maxWidth: '380px' }}>
                  Enter your credentials to authorize this status modification. This action will be recorded in the audit log.
                </p>
              </div>

              <div className="sm-credential-summary">
                <div className="sm-credential-summary-row">
                  <span>FIR Number</span>
                  <strong>{incident.firNumber || incident.id}</strong>
                </div>
                <div className="sm-credential-summary-row">
                  <span>Status Change</span>
                  <strong>{currentRawStatus} → {selectedSubStatus}</strong>
                </div>
                {remarks && (
                  <div className="sm-credential-summary-row">
                    <span>Remarks</span>
                    <strong style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{remarks}</strong>
                  </div>
                )}
              </div>

              <div className="sm-field-group">
                <label className="sm-label">Username <span className="sm-required">*</span></label>
                <input
                  type="text"
                  name="sm-username"
                  className="sm-input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setAuthError(''); }}
                  autoComplete="new-password"
                />
              </div>

              <div className="sm-field-group">
                <label className="sm-label">Password <span className="sm-required">*</span></label>
                <div className="sm-password-input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="sm-password"
                    className="sm-input sm-password-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="sm-password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="sm-auth-error">
                  <AlertTriangle size={14} />
                  {authError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="status-modify-footer" style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {step !== 'select' && (
                <button className="btn btn-secondary sm-btn" onClick={handleBack}>
                  <ChevronLeft size={14} />
                  Back
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary sm-btn" onClick={onClose}>
                Cancel
              </button>
              {step !== 'credentials' ? (
                <button
                  className="btn btn-primary sm-btn sm-btn-next"
                  onClick={handleNext}
                  disabled={step === 'select' ? !isStep1Valid : !isStep2Valid}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  className="btn btn-primary sm-btn sm-btn-submit"
                  onClick={handleSubmit}
                  disabled={verifying || !username.trim() || !password.trim()}
                >
                  {verifying ? (
                    <>
                      <span className="sm-spinner" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      Submit Modification
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
