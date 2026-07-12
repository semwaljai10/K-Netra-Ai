'use client';

import React, { useEffect, useState } from 'react';
import { useApp, ActiveView } from '@/context/AppContext';
import {
  LayoutDashboard,
  MapPin,
  Share2,
  Users,
  TrendingUp,
  BrainCircuit,
  Terminal,
  UserCheck,
  LogOut,
  Sun,
  Moon,
  Monitor,
  FilePlus
} from 'lucide-react';

interface NavLink {
  view: ActiveView;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export default function Sidebar() {
  const { currentView, setCurrentView, logout, theme, setTheme, mobileSidebarOpen, setMobileSidebarOpen, currentUser } = useApp();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      setTimeStr(`${dateStr} | ${timeStr}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks: NavLink[] = [
    { view: 'dashboard', label: 'Dashboard Command', icon: LayoutDashboard },
    { view: 'map', label: 'Geospatial Hotspots', icon: MapPin },
    { view: 'network', label: 'Syndicate Links', icon: Share2 },
    { view: 'offenders', label: 'Criminal Dossiers', icon: Users },
    { view: 'socio', label: 'Socio-Economic Correlation', icon: TrendingUp },
    { view: 'predictor', label: 'AI Predictor Model', icon: BrainCircuit },
    { view: 'report', label: 'Report Incident', icon: FilePlus }
  ];

  if (currentUser?.isAdmin) {
    navLinks.push({ view: 'admin' as any, label: 'Admin Security Logs', icon: Terminal });
  }

  return (
    <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-box">
          <div className="logo-icon">
            <Terminal size={18} />
          </div>
          <span className="logo-text">K-NETRA AI</span>
        </div>
        <div className="sidebar-subtext" style={{ fontSize: '0.65rem', color: 'var(--text-dark)', marginTop: '0.25rem', letterSpacing: '0.5px' }}>
          KSP TACTICAL UNIT
        </div>
      </div>

      <nav className="sidebar-nav">
        {navLinks.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            className={`nav-item ${currentView === view ? 'active' : ''}`}
            onClick={() => {
              setCurrentView(view);
              setMobileSidebarOpen(false);
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="operator-profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.5rem' }}>
          <button
            onClick={() => {
              setCurrentView('profile');
              setMobileSidebarOpen(false);
            }}
            className={`operator-profile-btn ${currentView === 'profile' ? 'active' : ''}`}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
              width: 'calc(100% - 28px)'
            }}
          >
            <div className="operator-avatar" style={{
              background: currentView === 'profile' ? 'var(--color-blue)' : 'var(--color-blue-glow)',
              color: currentView === 'profile' ? 'white' : 'var(--color-blue)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}>
              <UserCheck size={16} />
            </div>
            <div className="operator-info" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="operator-name" style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: currentView === 'profile' ? 'var(--color-blue)' : 'var(--text-primary)',
                transition: 'all 0.2s'
              }}>{currentUser?.name || 'Officer A. Sharma'}</span>
              <span className="operator-role" style={{
                fontSize: '0.65rem',
                color: 'var(--text-dark)'
              }}>{currentUser?.role || 'Control Room'}</span>
            </div>
          </button>
          <button
            onClick={logout}
            className="btn-logout"
            title="Lock Command Station"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dark)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-red)';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-dark)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
        <div className="theme-toggle-row">
          {(['system', 'light', 'dark'] as const).map((mode) => {
            const isActive = theme === mode;
            let Icon = Monitor;
            let label = 'System';
            if (mode === 'light') {
              Icon = Sun;
              label = 'Light';
            } else if (mode === 'dark') {
              Icon = Moon;
              label = 'Dark';
            }

            return (
              <button
                key={mode}
                className={`theme-toggle-btn ${isActive ? 'active' : ''}`}
                onClick={() => setTheme(mode)}
                title={`${label} Mode`}
              >
                <Icon size={12} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <div className="live-clock" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          {timeStr || 'Syncing clock...'}
        </div>
      </div>
    </aside>
  );
}
