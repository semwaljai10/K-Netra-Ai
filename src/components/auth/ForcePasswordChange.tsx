'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import GlassPanel from '../ui/GlassPanel';
import { Lock, ShieldAlert, Key, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

export default function ForcePasswordChange() {
  const { changePassword, logout, currentUser } = useApp();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(otp, newPassword);
      if (res.success) {
        setSuccess(true);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred during verification. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-viewport" style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
      }}>
        <div className="cyber-grid"></div>
        <div className="glow-radial glow-radial-1"></div>
        
        <GlassPanel style={{ width: '420px', padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--color-success)' }}>
          <div style={{ margin: '0 auto', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.25)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)' }}>
            <CheckCircle2 size={32} />
          </div>
          
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'var(--font-family-title)', color: 'var(--text-primary)', margin: 0 }}>
            Passkey Configured
          </h2>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
            Holographic credential registry synchronized successfully. Loading secure tactical feed...
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2px solid rgba(255,255,255,0.05)',
              borderTopColor: 'var(--color-success)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="login-viewport" style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }}>
      <div className="cyber-grid"></div>
      <div className="glow-radial glow-radial-1"></div>
      
      <GlassPanel style={{ width: '420px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
        
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-yellow)' }}>
          <ShieldAlert size={26} />
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold', fontFamily: 'var(--font-family-title)', letterSpacing: '0.5px' }}>
            Passkey Setup Required
          </h2>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
          Welcome, <strong style={{ color: 'var(--text-primary)' }}>{currentUser?.name}</strong>. This is your first logon using a temporary OTP. You must configure a new security passkey before accessing the tactical feed.
        </p>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '6px',
            padding: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--color-red)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Temporary 6-Digit OTP</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Key size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-dark)' }} />
              <input 
                type="text" 
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP code"
                required
                maxLength={6}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  padding: '0.55rem 0.55rem 0.55rem 2.2rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: '100%',
                  fontFamily: 'var(--font-family-mono)',
                  letterSpacing: '1.5px',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-yellow)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>New Password Passkey</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-dark)' }} />
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  padding: '0.55rem 0.55rem 0.55rem 2.2rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: '100%',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-yellow)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Confirm New Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-dark)' }} />
              <input 
                type="password" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  padding: '0.55rem 0.55rem 0.55rem 2.2rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: '100%',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-yellow)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={logout}
              style={{
                flex: '1',
                padding: '0.6rem',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <LogOut size={13} />
              Logout
            </button>
            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{
                flex: '2',
                padding: '0.6rem',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                background: 'var(--color-yellow)',
                border: 'none',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 10px rgba(245, 158, 11, 0.15)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#d97706'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-yellow)'}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid rgba(0,0,0,0.1)',
                    borderTopColor: '#000',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Configuring...
                </>
              ) : (
                'Update Passkey'
              )}
            </button>
          </div>
        </form>
      </GlassPanel>
    </div>
  );
}
