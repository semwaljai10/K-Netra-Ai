'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet MapInner component with ssr: false to prevent node compilation errors
const MapInner = dynamic(
  () => import('./MapInner'),
  { 
    ssr: false,
    loading: () => (
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'rgba(13, 20, 35, 0.45)', 
          border: '1px solid var(--panel-border)',
          borderRadius: '12px',
          color: 'var(--text-muted)',
          gap: '0.75rem'
        }}
      >
        <div className="term-dot" style={{ width: '12px', height: '12px', animation: 'markerPulseRed 1.5s infinite' }}></div>
        <span>Initializing Geospatial Engine...</span>
      </div>
    )
  }
);

export default function CrimeMap() {
  return <MapInner />;
}
