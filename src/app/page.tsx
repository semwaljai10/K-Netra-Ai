'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

// Layout & UI
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import GlassPanel from '@/components/ui/GlassPanel';
import IncidentModal from '@/components/ui/IncidentModal';
import OffenderDrawer from '@/components/ui/OffenderDrawer';

// View: Dashboard
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import TrendChart from '@/components/dashboard/TrendChart';
import AnomalyFeed from '@/components/dashboard/AnomalyFeed';
import IncidentTable from '@/components/dashboard/IncidentTable';

// View: Map
import CrimeMap from '@/components/map/CrimeMap';
import MapSidebar from '@/components/map/MapSidebar';

// View: Network
import NetworkVisualizer from '@/components/network/NetworkVisualizer';
import NetworkSidebar from '@/components/network/NetworkSidebar';

// View: Offenders Dossiers
import OffenderDirectory from '@/components/offenders/OffenderDirectory';

// View: Socio Economic
import CorrelationCharts from '@/components/socio/CorrelationCharts';

// View: AI Predictor Sim
import PredictionArea from '@/components/predictor/PredictionArea';

// View: Admin Panel
import AdminPanel from '@/components/admin/AdminPanel';

// View: User Profile Panel
import UserProfile from '@/components/profile/UserProfile';

// Auth Screen
import LoginScreen from '@/components/auth/LoginScreen';
import ForcePasswordChange from '@/components/auth/ForcePasswordChange';

export default function Home() {
  const { currentView, isAuthenticated, mobileSidebarOpen, setMobileSidebarOpen, currentUser } = useApp();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (currentUser?.mustChangePassword) {
    return <ForcePasswordChange />;
  }

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <MetricsGrid />
            <div className="dashboard-grid-1">
              <GlassPanel className="dashboard-trend-panel">
                <div className="panel-header-row">
                  <h2>Spatio-Temporal Trend Spikes</h2>
                </div>
                <div className="chart-viewport">
                  <TrendChart />
                </div>
              </GlassPanel>
              <GlassPanel className="anomaly-panel">
                <AnomalyFeed />
              </GlassPanel>
            </div>
            <IncidentTable />
          </div>
        );
      case 'map':
        return (
          <div className="map-view-layout">
            <MapSidebar />
            <div className="map-container-box">
              <CrimeMap />
            </div>
          </div>
        );
      case 'network':
        return (
          <div className="network-layout">
            <NetworkSidebar />
            <div className="canvas-container">
              <NetworkVisualizer />
            </div>
          </div>
        );
      case 'offenders':
        return <OffenderDirectory />;
      case 'socio':
        return <CorrelationCharts />;
      case 'predictor':
        return <PredictionArea />;
      case 'admin':
        return <AdminPanel />;
      case 'profile':
        return <UserProfile />;
      default:
        return (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dark)' }}>
            Error: View context mismatch.
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${mobileSidebarOpen ? 'open' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      ></div>

      {/* Main Content Area */}
      <main className="main-viewport">
        {/* Command Header bar */}
        <Header />

        {/* Dynamic View Component */}
        <div style={{ flexGrow: 1 }}>
          {renderActiveView()}
        </div>
      </main>

      {/* Modals & Overlays */}
      <IncidentModal />
      <OffenderDrawer />
    </div>
  );
}
