'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import GlassPanel from '../ui/GlassPanel';
import { ShieldAlert, Users, BrainCircuit, Activity } from 'lucide-react';

export default function MetricsGrid() {
  const { incidents, offenders, anomalies } = useApp();

  const activeIncidents = incidents.filter(i => i.status !== 'Resolved').length;
  const totalOffenders = offenders.length;
  const avgAnomalyProbability = anomalies.length > 0 
    ? (anomalies.reduce((sum, item) => sum + item.probability, 0) / anomalies.length).toFixed(1)
    : '0';

  return (
    <div className="metrics-grid">
      <GlassPanel className="metric-card" hoverable>
        <div className="metric-icon-box red">
          <ShieldAlert size={20} />
        </div>
        <div className="metric-info">
          <span className="metric-label">Active Incidents</span>
          <span className="metric-value text-red">{activeIncidents}</span>
        </div>
      </GlassPanel>

      <GlassPanel className="metric-card" hoverable>
        <div className="metric-icon-box purple">
          <Users size={20} />
        </div>
        <div className="metric-info">
          <span className="metric-label">Tracked Syndicate Suspects</span>
          <span className="metric-value text-purple">{totalOffenders}</span>
        </div>
      </GlassPanel>

      <GlassPanel className="metric-card" hoverable>
        <div className="metric-icon-box blue">
          <BrainCircuit size={20} />
        </div>
        <div className="metric-info">
          <span className="metric-label">AI Risk Probability</span>
          <span className="metric-value text-blue">{avgAnomalyProbability}%</span>
        </div>
      </GlassPanel>

      <GlassPanel className="metric-card" hoverable>
        <div className="metric-icon-box success">
          <Activity size={20} />
        </div>
        <div className="metric-info">
          <span className="metric-label">SLA Compliance</span>
          <span className="metric-value text-success">92.4%</span>
        </div>
      </GlassPanel>
    </div>
  );
}
