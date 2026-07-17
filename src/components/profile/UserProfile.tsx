'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import GlassPanel from '../ui/GlassPanel';
import { 
  User, 
  Lock, 
  Activity, 
  Mail, 
  Phone, 
  Building, 
  ShieldCheck, 
  Calendar, 
  RefreshCw, 
  CheckCircle,
  AlertTriangle,
  Monitor,
  Globe,
  Terminal
} from 'lucide-react';

export default function UserProfile() {
  const { currentUser, updateProfile, changePassword, fetchAuditLogs } = useApp();
  const [activeTab, setActiveTab] = useState<'details' | 'password' | 'logs'>('details');

  // Edit details state
  const [name, setName] = useState(currentUser?.name || '');
  const [role, setRole] = useState(currentUser?.role || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [department, setDepartment] = useState(currentUser?.department || '');

  // Password reset state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Status indicators
  const [savingDetails, setSavingDetails] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setRole(currentUser.role || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setDepartment(currentUser.department || '');
    }
  }, [currentUser]);

  const loadUserLogs = async () => {
    if (!currentUser) return;
    setLogsLoading(true);
    try {
      const allLogs = await fetchAuditLogs(currentUser.username);
      const userLogs = allLogs.filter(
        (log: any) => log.user.trim().toLowerCase() === currentUser.username.trim().toLowerCase()
      );
      setLogs(userLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      loadUserLogs();
    }
  }, [activeTab, currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingDetails(true);
    setDetailsSuccess(null);
    setDetailsError(null);

    try {
      const success = await updateProfile({ name, role, email, phone, department });
      if (success) {
        setDetailsSuccess('Operational profile updated successfully.');
        setTimeout(() => setDetailsSuccess(null), 5000);
      } else {
        setDetailsError('Failed to update profile details.');
      }
    } catch (err) {
      console.error(err);
      setDetailsError('An error occurred during updating.');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess(null);
    setPassError(null);

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 4) {
      setPassError('New password must be at least 4 characters long.');
      return;
    }

    setChangingPass(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setPassSuccess(res.message);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPassSuccess(null), 5000);
      } else {
        setPassError(res.message);
      }
    } catch (err) {
      console.error(err);
      setPassError('An error occurred while changing password.');
    } finally {
      setChangingPass(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dark)' }}>
        No operator details found. Authenticate terminal.
      </div>
    );
  }

  const clearanceLabel = currentUser.isAdmin 
    ? `Level ${currentUser.level || 1} Admin` 
    : 'Field Analyst';

  const badgeColor = currentUser.isAdmin
    ? (currentUser.level === 2 ? 'var(--color-red)' : 'var(--color-purple)')
    : 'var(--color-blue)';

  const badgeBg = currentUser.isAdmin
    ? (currentUser.level === 2 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(168, 85, 247, 0.08)')
    : 'rgba(59, 130, 246, 0.08)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
      
      {/* LEFT COLUMN: TACTICAL BADGE CARD */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <GlassPanel style={{ padding: '2rem 1.5rem', textAlign: 'center', borderTop: `4px solid ${badgeColor}` }}>
          
          {/* Avatar Container */}
          <div style={{ position: 'relative', width: '96px', height: '96px', margin: '0 auto 1.5rem auto' }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: `2px solid ${badgeColor}`,
              boxShadow: `0 0 15px ${badgeColor}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
              color: badgeColor
            }}>
              <User size={40} />
            </div>
            <span style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: 'var(--color-success)',
              border: '2px solid var(--bg-secondary)',
              boxShadow: '0 0 8px var(--color-success)'
            }} title="Operator Connected" />
          </div>

          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 0.25rem 0', fontFamily: 'var(--font-family-title)' }}>
            {currentUser.name}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
            {currentUser.role}
          </p>

          <div style={{
            display: 'inline-block',
            fontSize: '0.65rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '100px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: badgeColor,
            background: badgeBg,
            border: `1px solid ${badgeColor}30`,
            marginBottom: '1.5rem'
          }}>
            {clearanceLabel}
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '0 0 1.25rem 0' }} />

          {/* Core Telemetry Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dark)' }}>SIGNATURE ID:</span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-family-mono)', fontWeight: 'bold' }}>{currentUser.username.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dark)' }}>BADGE NUMBER:</span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-family-mono)' }}>{currentUser.badgeNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dark)' }}>JOINED DATE:</span>
              <span style={{ color: 'var(--text-primary)' }}>{currentUser.joinedDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dark)' }}>DIVISION:</span>
              <span style={{ color: 'var(--text-primary)' }}>{currentUser.department}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dark)' }}>STATUS:</span>
              <span style={{ color: 'var(--color-success)', fontWeight: '500' }}>ACTIVE ONLINE</span>
            </div>
          </div>

        </GlassPanel>

        <div style={{ fontSize: '0.65rem', color: 'var(--text-dark)', textAlign: 'center', fontFamily: 'var(--font-family-mono)', padding: '0.25rem' }}>
          KARNATAKA LOGICAL AUTH LEVEL :: SECURE_PORT_{currentUser.isAdmin ? 'A' : 'V'}
        </div>
      </div>

      {/* RIGHT COLUMN: CONFIGURATION PANELS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Tab Selection Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', gap: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('details')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'details' ? '2px solid var(--color-blue)' : '2px solid transparent',
              color: activeTab === 'details' ? 'var(--color-blue)' : 'var(--text-muted)',
              padding: '0.75rem 0.25rem',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'details' ? 'bold' : 'normal',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <User size={15} />
            Basic Profile Details
          </button>
          
          <button
            onClick={() => setActiveTab('password')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'password' ? '2px solid var(--color-blue)' : '2px solid transparent',
              color: activeTab === 'password' ? 'var(--color-blue)' : 'var(--text-muted)',
              padding: '0.75rem 0.25rem',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'password' ? 'bold' : 'normal',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <Lock size={15} />
            Security & Password
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'logs' ? '2px solid var(--color-blue)' : '2px solid transparent',
              color: activeTab === 'logs' ? 'var(--color-blue)' : 'var(--text-muted)',
              padding: '0.75rem 0.25rem',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'logs' ? 'bold' : 'normal',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <Activity size={15} />
            Logon Access History
          </button>
        </div>

        {/* Dynamic Panels */}
        <div style={{ flexGrow: 1 }}>
          
          {/* TAB 1: BASIC DETAILS EDIT */}
          {activeTab === 'details' && (
            <GlassPanel style={{ padding: '1.75rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                  Basic Details Configuration
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Modify your public identifier settings. These changes sync with the network control directory.
                </p>
              </div>

              {detailsSuccess && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem'
                }}>
                  <CheckCircle size={15} />
                  {detailsSuccess}
                </div>
              )}

              {detailsError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--color-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem'
                }}>
                  <AlertTriangle size={15} />
                  {detailsError}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Operator Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        padding: '0.55rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Operational Role</label>
                    <input 
                      type="text" 
                      value={role}
                      disabled
                      required
                      style={{
                        background: 'rgba(0,0,0,0.15)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '6px',
                        padding: '0.55rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Contact Email</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Mail size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-dark)' }} />
                      <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '0.55rem 0.55rem 0.55rem 2.2rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          outline: 'none',
                          width: '100%',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Contact Phone</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Phone size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-dark)' }} />
                      <input 
                        type="text" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '0.55rem 0.55rem 0.55rem 2.2rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          outline: 'none',
                          width: '100%',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Assigned Division / Department</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Building size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-dark)' }} />
                    <input 
                      type="text" 
                      value={department}
                      disabled
                      required
                      style={{
                        background: 'rgba(0,0,0,0.15)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '6px',
                        padding: '0.55rem 0.55rem 0.55rem 2.2rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        width: '100%',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingDetails}
                  style={{
                    padding: '0.65rem',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    marginTop: '0.5rem',
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {savingDetails ? (
                    <>
                      <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      Saving Profile Changes...
                    </>
                  ) : (
                    'Save Details'
                  )}
                </button>
              </form>
            </GlassPanel>
          )}

          {/* TAB 2: PASSWORD CHANGE */}
          {activeTab === 'password' && (
            <GlassPanel style={{ padding: '1.75rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                  Terminal Security Configuration
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Modify local command station access key. This will update credentials globally.
                </p>
              </div>

              {passSuccess && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem'
                }}>
                  <CheckCircle size={15} />
                  {passSuccess}
                </div>
              )}

              {passError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--color-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem'
                }}>
                  <AlertTriangle size={15} />
                  {passError}
                </div>
              )}

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Current Security Password</label>
                  <input 
                    type="password" 
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      padding: '0.55rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>New Password Key</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        padding: '0.55rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        padding: '0.55rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={changingPass}
                  style={{
                    padding: '0.65rem',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    marginTop: '0.5rem',
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {changingPass ? (
                    <>
                      <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      Re-routing credential registry...
                    </>
                  ) : (
                    'Update Access Key'
                  )}
                </button>
              </form>
            </GlassPanel>
          )}

          {/* TAB 3: LOGON ACCESS HISTORY */}
          {activeTab === 'logs' && (
            <GlassPanel className="panel-table" style={{ margin: 0, padding: '1.5rem' }}>
              <div className="panel-header-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                    Operator Logon Access & Security History
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Access records for signature ID: <span style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--color-blue)' }}>{currentUser.username}</span>
                  </p>
                </div>
                <button
                  onClick={loadUserLogs}
                  disabled={logsLoading}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <RefreshCw size={12} className={logsLoading ? 'animate-spin' : ''} style={{ animation: logsLoading ? 'spin 1s linear infinite' : undefined }} />
                  Sync Access
                </button>
              </div>

              <div className="table-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {logsLoading && logs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dark)' }}>
                    <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
                    <div>Syncing terminal access records...</div>
                  </div>
                ) : logs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dark)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    No audit accesses logged for this terminal signature.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', fontSize: '0.65rem', padding: '0.5rem 0.75rem', color: 'var(--text-dark)' }}>Logon Time (IST)</th>
                        <th style={{ textAlign: 'left', fontSize: '0.65rem', padding: '0.5rem 0.75rem', color: 'var(--text-dark)' }}>IP Address</th>
                        <th style={{ textAlign: 'left', fontSize: '0.65rem', padding: '0.5rem 0.75rem', color: 'var(--text-dark)' }}>Geographic Coordinates</th>
                        <th style={{ textAlign: 'right', fontSize: '0.65rem', padding: '0.5rem 0.75rem', color: 'var(--text-dark)' }}>DeviceSignature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none' }}>
                            <Calendar size={11} style={{ color: 'var(--text-dark)' }} />
                            {log.time}
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.75rem', fontFamily: 'var(--font-family-mono)', color: 'var(--text-primary)' }}>
                            {log.ip}
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Globe size={11} style={{ color: 'var(--text-dark)' }} />
                              {log.loc}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Monitor size={11} style={{ color: 'var(--text-dark)' }} />
                              {log.dev}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </GlassPanel>
          )}

        </div>

      </div>

    </div>
  );
}
