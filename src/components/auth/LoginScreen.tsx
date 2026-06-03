'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { ShieldAlert, Lock, User, Terminal, ArrowRight } from 'lucide-react';

export default function LoginScreen() {
  const { login, sessionTerminationReason, setSessionTerminationReason } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState('SECURE GATEWAY READY: ENTER SIGNATURE');
  
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus username on load
  useEffect(() => {
    if (usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  }, []);

  // Display alert pop-up when a new login termination is detected
  useEffect(() => {
    if (sessionTerminationReason === 'new-login') {
      alert('SECURITY ALERT: A new login has been detected from another device/browser. You have been logged out of this device.');
    }
  }, [sessionTerminationReason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Operator ID and Passcode signature required.');
      setTelemetry('SIGNATURE FAILED: NULL VALUES');
      return;
    }

    setLoading(true);
    setError(null);
    setTelemetry('CRYPTOGRAPH DATA SUBMISSION...');

    // Progress updates to look authentic
    const progressSteps = [
      'CRYPTOGRAPH DATA SUBMISSION...',
      'EVALUATING SHA-512 MATRIX...',
      'AUTHORIZING OPERATOR CREDENTIALS...'
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < progressSteps.length - 1) {
        step++;
        setTelemetry(progressSteps[step]);
      }
    }, 450);

    try {
      const success = await login(username.trim(), password);
      clearInterval(interval);
      
      if (!success) {
        setError('Access Denied: Invalid Security Signature');
        setTelemetry('SECURITY ALERT: BAD CORRELATION DATA');
        setLoading(false);
      } else {
        setTelemetry('DECRYPT COMPLETE: ACCESS GRANTED');
      }
    } catch (err) {
      clearInterval(interval);
      setError('Telemetry Failure: Gateway unreachable.');
      setTelemetry('NETWORK LINK TIMEOUT');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Visual cyber backgrounds */}
      <div className="login-grid-bg" />
      <div className="login-glow-orb" style={{ top: '20%', left: '20%' }} />
      <div className="login-glow-orb" style={{ bottom: '20%', right: '20%' }} />

      <div className="login-card">
        {/* Floating cyber header */}
        <div className="login-header">
          <div className="login-logo">
            <Terminal size={24} />
          </div>
          <h1>AETHER COMMAND</h1>
          <p>{telemetry}</p>
        </div>

        {/* Tactical Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label className="login-input-label">Operator User ID</label>
            <div className="login-input-wrap">
              <input
                ref={usernameInputRef}
                type="text"
                className="login-input"
                placeholder="Enter operator credential ID"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(null);
                  if (sessionTerminationReason) setSessionTerminationReason(null);
                }}
                disabled={loading}
                autoComplete="username"
              />
              <User className="login-input-icon" size={16} />
            </div>
          </div>

          <div className="login-input-group">
            <label className="login-input-label">Command Passcode</label>
            <div className="login-input-wrap">
              <input
                type="password"
                className="login-input"
                placeholder="••••••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                  if (sessionTerminationReason) setSessionTerminationReason(null);
                }}
                disabled={loading}
                autoComplete="current-password"
              />
              <Lock className="login-input-icon" size={16} />
            </div>
          </div>

          {/* Form error warning panel */}
          {error && (
            <div className="login-error-msg">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Session terminated security alert */}
          {sessionTerminationReason === 'new-login' && !error && (
            <div className="login-error-msg" style={{ borderColor: 'var(--color-red)', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-red)' }}>
              <ShieldAlert size={16} />
              <span style={{ fontWeight: 'bold' }}>SECURITY ALERT: New login detected. Session terminated.</span>
            </div>
          )}

          {/* Glowing Action Button */}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <div className="login-loader">
                <div className="login-spinner" />
                <span>Decrypting...</span>
              </div>
            ) : (
              <>
                <span>Access Intel Center</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
