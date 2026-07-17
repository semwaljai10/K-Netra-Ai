'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import GlassPanel from '../ui/GlassPanel';
import {
  ShieldAlert,
  RefreshCw,
  Terminal,
  Globe,
  Calendar,
  Monitor,
  Cpu,
  Lock,
  User,
  PlusCircle,
  Trash2,
  ShieldCheck,
  LogOut
} from 'lucide-react';

interface AuditLog {
  user: string;
  ip: string;
  loc: string;
  time: string;
  dev: string;
}

export default function AdminPanel() {
  const { fetchAuditLogs, fetchUsers, createUser, deleteUser, currentUser, terminateSession } = useApp();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<{ normal: any[]; admin: any[] }>({ normal: [], admin: [] });
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  const handleTerminateSession = async (username: string) => {
    if (confirm(`Are you sure you want to terminate operator ${username}'s active session?`)) {
      try {
        const success = await terminateSession(username);
        if (success) {
          alert(`Session for ${username} has been terminated.`);
          loadLogs(logSearchText); // Reload logs to reflect they are no longer active
        } else {
          alert('Could not terminate session.');
        }
      } catch (err) {
        console.error(err);
        alert('Error terminating session.');
      }
    }
  };

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'normal' | 'admin'>('normal');
  const [adminLevel, setAdminLevel] = useState<number>(1);
  const [creating, setCreating] = useState(false);
  const [successUserId, setSuccessUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logSearchText, setLogSearchText] = useState('');

  const loadLogs = async (search?: string) => {
    setLoading(true);
    const data = await fetchAuditLogs(search);
    setLogs(data.filter((log: any) => log.active));
    setLoading(false);
  };

  const loadUsers = async () => {
    if (currentUser?.isAdmin) {
      setUsersLoading(true);
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setUsersLoading(false);
      }
    }
  };

  useEffect(() => {
    loadLogs(logSearchText);
    loadUsers();
  }, [currentUser]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadLogs(logSearchText);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [logSearchText]);

  // Update default role based on userType and adminLevel selections
  useEffect(() => {
    if (userType === 'normal') {
      setRole('Control Room');
    } else if (userType === 'admin') {
      if (adminLevel === 1) {
        setRole('System administrator L1');
      } else if (adminLevel === 2) {
        setRole('System administrator L2');
      }
    }
  }, [userType, adminLevel]);

  // Derive last login details dynamically from audit logs
  const operatorStatuses = useMemo(() => {
    const allUsersList = [
      ...users.admin.map(u => ({ ...u, isAdmin: true })),
      ...users.normal.map(u => ({ ...u, isAdmin: false }))
    ];

    return allUsersList.map(user => {
      // Find the most recent log for this user
      const userLogs = logs.filter(
        l => l.user.trim().toLowerCase() === user.username.trim().toLowerCase()
      );
      const lastLog = userLogs[0] || null; // index 0 is the newest (sorted descending)
      return {
        ...user,
        lastLog
      };
    });
  }, [users, logs]);

  const [successOtp, setSuccessOtp] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !phone.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    const phoneDigits = phone.trim();
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneDigits)) {
      setErrorMsg('Mobile number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9.');
      return;
    }

    setCreating(true);
    setErrorMsg(null);
    try {
      const res = await createUser(
        { name, role, phone: `+91${phoneDigits}` },
        userType,
        userType === 'admin' ? adminLevel : undefined
      );
      setSuccessUserId(res.username);
      setSuccessOtp(res.otp);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (username: string, type: 'normal' | 'admin') => {
    if (confirm(`Are you sure you want to delete operator ${username}?`)) {
      try {
        const success = await deleteUser(username, type);
        if (success) {
          loadUsers();
          loadLogs(); // Reload logs to refresh user details
        } else {
          alert('Could not delete operator.');
        }
      } catch (err) {
        console.error(err);
        alert('Error deleting operator.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* 1. Admin Telemetry Metrics */}
      <div className="metrics-grid">
        <GlassPanel className="metric-card">
          <div className="metric-icon-box red" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
            <Lock size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Access Gateways</span>
            <span className="metric-value" style={{ color: 'var(--color-red)' }}>SECURE</span>
          </div>
        </GlassPanel>

        <GlassPanel className="metric-card">
          <div className="metric-icon-box blue">
            <Terminal size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Logins Tracked</span>
            <span className="metric-value">{logs.length} / 16 max</span>
          </div>
        </GlassPanel>

        <GlassPanel className="metric-card">
          <div className="metric-icon-box success">
            <Globe size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Telemetry Status</span>
            <span className="metric-value" style={{ color: 'var(--color-success)', fontSize: '1.4rem' }}>ONLINE</span>
          </div>
        </GlassPanel>

        <GlassPanel className="metric-card">
          <div className="metric-icon-box purple">
            <Cpu size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">DB Cluster</span>
            <span className="metric-value" style={{ fontSize: '1rem', fontFamily: 'var(--font-family-mono)', color: 'var(--color-purple)' }}>supabase-db</span>
          </div>
        </GlassPanel>
      </div>

      {/* 2. Operator Last-Login Statuses */}
      {currentUser?.isAdmin && operatorStatuses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <User size={16} style={{ color: 'var(--color-blue)' }} />
            Active Operator Telemetry Statuses
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {operatorStatuses.map((op, idx) => {
              const hasLog = op.lastLog !== null && op.lastLog.active;
              const opIsAdmin = op.isAdmin;
              return (
                <GlassPanel key={idx} style={{ padding: '1rem', margin: 0, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        fontSize: '0.6rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                        background: opIsAdmin ? 'rgba(168, 85, 247, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                        border: opIsAdmin ? '1px solid rgba(168, 85, 247, 0.25)' : '1px solid rgba(59, 130, 246, 0.25)',
                        color: opIsAdmin ? 'var(--color-purple)' : 'var(--color-blue)',
                        fontWeight: 'bold'
                      }}>
                        {opIsAdmin ? `ADMIN L${op.level || 1}` : 'OPERATOR'}
                      </span>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{op.name}</strong>
                    </div>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: hasLog ? 'var(--color-success)' : 'var(--text-dark)',
                      boxShadow: hasLog ? '0 0 8px var(--color-success)' : 'none'
                    }} />
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-family-mono)' }}>
                    ID: <span style={{ color: 'var(--text-primary)' }}>{op.username}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Role: <span style={{ color: 'var(--text-primary)' }}>{op.role}</span>
                  </div>

                  <hr style={{ border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', margin: '0.4rem 0' }} />

                  {op.lastLog ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.7rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Last Access: <span style={{ color: 'var(--text-primary)' }}>{op.lastLog.time}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        IP / GPS: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-family-mono)' }}>{op.lastLog.ip}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={op.lastLog.loc}>
                        Geo Location: <span style={{ color: 'var(--text-primary)' }}>{op.lastLog.loc}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', fontStyle: 'italic' }}>
                      No active sessions logged.
                    </div>
                  )}
                </GlassPanel>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Operator Management (Level 2 Admins Only) */}
      {currentUser?.level === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

          {/* Operator Directory Table */}
          <GlassPanel className="panel-table" style={{ margin: 0, padding: '1.25rem' }}>
            <div className="panel-header-row" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2>
                <User size={16} style={{ color: 'var(--color-blue)', marginRight: '0.4rem' }} />
                Operator Directory
              </h2>
            </div>

            <div className="table-container" style={{ padding: '0.75rem 0', maxHeight: '360px', overflowY: 'auto' }}>
              {usersLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dark)' }}>
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
                  <div>Syncing directory records...</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0.5rem 0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>ID</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem 0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Name / Role</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem 0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Privileges</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem 0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Lock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Admins */}
                    {users.admin.map((user, idx) => {
                      const isSelf = user.username.toLowerCase() === currentUser.username.toLowerCase();
                      return (
                        <tr key={`adm-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '0.6rem 0.25rem', fontWeight: 'bold', fontFamily: 'var(--font-family-mono)', color: 'var(--color-purple)', fontSize: '0.8rem' }}>
                            {user.username}
                          </td>
                          <td style={{ padding: '0.6rem 0.25rem', fontSize: '0.8rem' }}>
                            <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{user.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.role}{user.phone ? ` | ${user.phone}` : ''}</div>
                          </td>
                          <td style={{ padding: '0.6rem 0.25rem' }}>
                            <span style={{
                              fontSize: '0.6rem',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                              background: 'rgba(168, 85, 247, 0.12)',
                              color: 'var(--color-purple)',
                              border: '1px solid rgba(168, 85, 247, 0.25)',
                              fontWeight: 'bold'
                            }}>
                              Admin L{user.level || 1}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem 0.25rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteUser(user.username, 'admin')}
                              disabled={isSelf}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isSelf ? 'var(--text-dark)' : 'var(--color-red)',
                                cursor: isSelf ? 'not-allowed' : 'pointer',
                                padding: '0.25rem',
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                              }}
                              title={isSelf ? "Self-deletion prohibited" : "De-authorize Operator"}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Normal Users */}
                    {users.normal.map((user, idx) => (
                      <tr key={`norm-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '0.6rem 0.25rem', fontWeight: 'bold', fontFamily: 'var(--font-family-mono)', color: 'var(--color-blue)', fontSize: '0.8rem' }}>
                          {user.username}
                        </td>
                        <td style={{ padding: '0.6rem 0.25rem', fontSize: '0.8rem' }}>
                          <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{user.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.role}{user.phone ? ` | ${user.phone}` : ''}</div>
                        </td>
                        <td style={{ padding: '0.6rem 0.25rem' }}>
                          <span style={{
                            fontSize: '0.6rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            background: 'rgba(59, 130, 246, 0.12)',
                            color: 'var(--color-blue)',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            fontWeight: 'bold'
                          }}>
                            Operator
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.25rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteUser(user.username, 'normal')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-red)',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              borderRadius: '4px',
                              transition: 'all 0.2s'
                            }}
                            title="De-authorize Operator"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </GlassPanel>

          {/* User Provisioning Form */}
          <GlassPanel style={{ margin: 0, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
              <PlusCircle size={16} style={{ color: 'var(--color-success)' }} />
              Provision New operator
            </h2>

            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '6px',
                padding: '0.6rem',
                fontSize: '0.75rem',
                color: 'var(--color-red)'
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Operator Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Officer R. Malhotra"
                  required
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '4px',
                    padding: '0.45rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Mobile Number</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRight: 'none',
                    borderRadius: '4px 0 0 4px',
                    padding: '0.45rem 0.6rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    userSelect: 'none'
                  }}>+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    required
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '0 4px 4px 0',
                      padding: '0.45rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      outline: 'none',
                      width: '100px'
                    }}
                  />
                </div>
              </div>

              {/* No password code field - automatically generated OTP */}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Privilege level</label>
                  <select
                    value={userType}
                    onChange={e => setUserType(e.target.value as 'normal' | 'admin')}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '4px',
                      padding: '0.45rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  >
                    <option value="normal" style={{ background: '#0a0a0c', color: '#fff' }}>Normal User</option>
                    <option value="admin" style={{ background: '#0a0a0c', color: '#fff' }}>Admin User</option>
                  </select>
                </div>

                {userType === 'admin' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Admin Level</label>
                    <select
                      value={adminLevel}
                      onChange={e => setAdminLevel(Number(e.target.value))}
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '4px',
                        padding: '0.45rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    >
                      <option value={1} style={{ background: '#0a0a0c', color: '#fff' }}>Level 1 (Logs Only)</option>
                      <option value={2} style={{ background: '#0a0a0c', color: '#fff' }}>Level 2 (Full Access)</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Operational Role</label>
                <input
                  type="text"
                  value={role}
                  disabled
                  required
                  style={{
                    background: 'rgba(0,0,0,0.15)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '4px',
                    padding: '0.45rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    outline: 'none',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={creating}
                style={{
                  padding: '0.55rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  marginTop: '0.5rem'
                }}
              >
                {creating ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    Generating Operator ID...
                  </>
                ) : (
                  <>
                    <PlusCircle size={12} />
                    Provision User
                  </>
                )}
              </button>
            </form>
          </GlassPanel>
        </div>
      )}

      {/* 4. Audit Log Matrix Table */}
      <GlassPanel className="panel-table" style={{ margin: 0 }}>
        <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>
            <ShieldAlert size={16} style={{ color: 'var(--color-red)' }} />
            System Logon Access & Security Telemetry
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Search Operator ID..."
              value={logSearchText}
              onChange={e => setLogSearchText(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '4px',
                padding: '0.4rem 0.6rem',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                outline: 'none',
                width: '180px'
              }}
            />
            <button
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => loadLogs(logSearchText)}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
              Sync Logs
            </button>
          </div>
        </div>

        <div className="table-container">
          {loading && logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-dark)' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
              <div>Fetching remote audit datastore records...</div>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-dark)' }}>
              No logon audit logs recorded in database.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Timestamp (IST)</th>
                  <th>Operator ID</th>
                  <th>IP Address</th>
                  <th>Geographic Location</th>
                  <th>Device Signature</th>
                  {currentUser?.level === 2 && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => {
                  const isAdmin = log.user.toUpperCase().startsWith('A');
                  const isSelf = log.user.trim().toLowerCase() === currentUser?.username.trim().toLowerCase();

                  // Find the target user object to check their admin level
                  const targetUserObj = users.admin.find(u => u.username.trim().toLowerCase() === log.user.trim().toLowerCase())
                    || users.normal.find(u => u.username.trim().toLowerCase() === log.user.trim().toLowerCase());
                  const isL2Admin = targetUserObj && targetUserObj.level === 2;

                  // L2 Admin can terminate normal users or L1 Admin sessions, but not L2 Admins or self
                  const canTerminate = currentUser?.level === 2 && !isSelf && !isL2Admin && log.active;

                  return (
                    <tr key={index}>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none', paddingTop: '1.1rem' }}>
                        <Calendar size={12} style={{ color: 'var(--text-dark)' }} />
                        {log.time}
                      </td>
                      <td style={{ fontWeight: 'bold', color: isAdmin ? 'var(--color-purple)' : 'var(--color-blue)' }}>
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          marginRight: '0.4rem',
                          background: isAdmin ? 'rgba(168, 85, 247, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                          border: isAdmin ? '1px solid rgba(168, 85, 247, 0.25)' : '1px solid rgba(59, 130, 246, 0.25)'
                        }}>
                          {isAdmin ? 'ADMIN' : 'OPERATOR'}
                        </span>
                        {log.user}
                      </td>
                      <td style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--text-primary)' }}>
                        {log.ip}
                      </td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none', paddingTop: '1.1rem' }}>
                        <Globe size={12} style={{ color: 'var(--text-dark)' }} />
                        {log.loc}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Monitor size={12} style={{ color: 'var(--text-dark)' }} />
                          {log.dev}
                        </span>
                      </td>
                      {currentUser?.level === 2 && (
                        <td style={{ textAlign: 'right' }}>
                          {canTerminate ? (
                            <button
                              onClick={() => handleTerminateSession(log.user)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: 'var(--color-red)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                transition: 'all 0.2s'
                              }}
                              title="Force Terminate Session"
                            >
                              <LogOut size={11} />
                              Terminate
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', fontStyle: 'italic' }}>
                              Protected
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </GlassPanel>

      {/* Success Dialog Modal Overlay */}
      {successUserId && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <GlassPanel style={{ width: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid #10b981', background: 'rgba(10, 10, 12, 0.95)', boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981' }}>
              <ShieldCheck size={26} />
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>Operator Account Provisioned</h2>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
              A unique Identification Signature & secure 6-digit access OTP have been allocated and dispatched to the operator's mobile:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: '0.25rem 0' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '6px',
                padding: '0.75rem 0.5rem',
                textAlign: 'center',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                color: '#60a5fa'
              }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Operator ID</div>
                {successUserId}
              </div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '6px',
                padding: '0.75rem 0.5rem',
                textAlign: 'center',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                color: '#34d399'
              }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>6-Digit OTP</div>
                {successOtp}
              </div>
            </div>

            <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '4px',
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem'
            }}>
              <div><strong>Name:</strong> <span style={{ color: 'var(--text-primary)' }}>{name}</span></div>
              <div><strong>Mobile:</strong> <span style={{ color: 'var(--text-primary)' }}>+91 {phone}</span></div>
              <div><strong>Role:</strong> <span style={{ color: 'var(--text-primary)' }}>{role}</span></div>
              <div><strong>Access:</strong> <span style={{ color: 'var(--text-primary)' }}>{userType === 'admin' ? `Admin (Level ${adminLevel})` : 'Normal Operator'}</span></div>
            </div>

            <button
              className="btn btn-primary"
              style={{
                background: '#10b981',
                border: 'none',
                color: '#fff',
                padding: '0.6rem',
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}
              onClick={() => {
                setSuccessUserId(null);
                setSuccessOtp(null);
                setName('');
                setRole('');
                setPassword('');
                setPhone('');
                setUserType('normal');
                setAdminLevel(1);
                loadUsers();
                loadLogs();
              }}
            >
              Acknowledge & Sync Directory
            </button>
          </GlassPanel>
        </div>
      )}

    </div>
  );
}
