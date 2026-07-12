'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import GlassPanel from '../ui/GlassPanel';
import { ShieldAlert, Users, BrainCircuit, Activity } from 'lucide-react';

export default function MetricsGrid() {
  const { incidents, offenders, anomalies } = useApp();

  const totalIncidents = incidents.length;
  const activeIncidents = incidents.filter(i => i.status !== 'Resolved').length;
  const closedIncidents = incidents.filter(i => i.status === 'Resolved').length;
  const totalOffenders = offenders.length;
  const avgAnomalyProbability = anomalies.length > 0 
    ? (anomalies.reduce((sum, item) => sum + item.probability, 0) / anomalies.length).toFixed(1)
    : '0';

  // Calculate SLA Compliance dynamically based on incident status, severity, and timestamp age
  const slaCompliance = React.useMemo(() => {
    if (incidents.length === 0) return '100.0';
    
    // Find the latest incident timestamp to act as "now" so the calculation is stable
    // even if the user runs this app far in the future.
    const timestamps = incidents.map(i => new Date(i.timestamp).getTime()).filter(t => !isNaN(t));
    const nowTime = timestamps.length > 0 ? Math.max(...timestamps) : new Date().getTime();
    
    const compliantCount = incidents.filter(inc => {
      // 1. Resolved or Dispatched (investigation completed/submitted to court) are always SLA compliant
      if (inc.status === 'Resolved' || inc.status === 'Dispatched') return true;
      
      // 2. Open Medium/Low severity cases are considered compliant
      if (inc.severity === 'Medium' || inc.severity === 'Low') return true;
      
      // 3. Open Critical/High severity cases must be resolved within 840 days (approx. 2.3 years)
      const ageInMs = nowTime - new Date(inc.timestamp).getTime();
      const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
      return ageInDays < 840;
    }).length;
    
    return (compliantCount / incidents.length * 100).toFixed(1);
  }, [incidents]);

  return (
    <div className="metrics-grid">
      <GlassPanel className="metric-card" hoverable>
        <div className="metric-icon-box red">
          <ShieldAlert size={20} />
        </div>
        <div className="metric-info">
          <span className="metric-label">Incidents</span>
          <div className="metric-sub-container">
            <div className="metric-sub-item">
              <span className="metric-sub-label">Total</span>
              <span className="metric-sub-value">{totalIncidents}</span>
            </div>
            <div className="metric-sub-item">
              <span className="metric-sub-label">Active</span>
              <span className="metric-sub-value text-red">{activeIncidents}</span>
            </div>
            <div className="metric-sub-item">
              <span className="metric-sub-label">Closed</span>
              <span className="metric-sub-value text-success">{closedIncidents}</span>
            </div>
          </div>
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
          <span className="metric-value text-success">{slaCompliance}%</span>
        </div>
      </GlassPanel>
    </div>
  );
}
