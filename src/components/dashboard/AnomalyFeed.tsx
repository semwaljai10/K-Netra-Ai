'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Brain, ArrowRight } from 'lucide-react';
import { MOCK_DISTRICTS } from '@/lib/data';

export default function AnomalyFeed() {
  const { anomalies, setCurrentView, setDistrictFilter } = useApp();

  const handleAnomalyClick = (districtId: string) => {
    setDistrictFilter(districtId);
    setCurrentView('map');
  };

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'var(--color-red)';
      case 'High': return 'var(--color-yellow)';
      case 'Medium': return 'var(--color-blue)';
      default: return 'var(--color-success)';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red';
      case 'High': return 'text-yellow';
      case 'Medium': return 'text-blue';
      default: return 'text-success';
    }
  };

  return (
    <div className="anomaly-panel">
      <div className="panel-header-row">
        <h2>
          <Brain size={16} className="text-primary" style={{ color: 'var(--color-blue)' }} />
          AI Anomaly Detection Warnings
        </h2>
        <span style={{ fontSize: '0.65rem', color: 'var(--color-success)', fontFamily: 'var(--font-family-mono)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span className="term-dot"></span> LIVE
        </span>
      </div>

      <div className="anomaly-list">
        {anomalies.map((alert) => {
          const district = MOCK_DISTRICTS[alert.districtId] || { name: alert.districtId };
          const borderCol = getBorderColor(alert.severity);

          return (
            <div
              key={alert.id}
              className="anomaly-card"
              style={{ borderLeftColor: borderCol }}
              onClick={() => handleAnomalyClick(alert.districtId)}
            >
              <div className="anomaly-card-top">
                <span className="anomaly-title">{alert.title}</span>
                <span 
                  className={`anomaly-probability ${getSeverityTextColor(alert.severity)}`} 
                  style={{ color: borderCol }}
                >
                  {alert.probability}% Conf
                </span>
              </div>
              <p className="anomaly-desc">{alert.description}</p>
              <div className="anomaly-meta">
                <span>Sector: {district.name.split(' (')[0]}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  Analyze Geospatial <ArrowRight size={10} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
