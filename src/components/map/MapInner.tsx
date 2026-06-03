'use client';

import React, { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { MOCK_DISTRICTS, MOCK_STATES, Incident } from '@/lib/data';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Dynamic HSL color generator for states to provide harmonized, distinct district perimeters
const getStateColor = (stateId: string, theme?: 'light' | 'dark') => {
  let hash = 0;
  for (let i = 0; i < stateId.length; i++) {
    hash = stateId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  // Since the map is dark navy in both light and dark themes, we keep lightness at 65% for high visibility
  const l = '65%';
  return `hsl(${h}, 80%, ${l})`;
};

export default function MapInner() {
  const { 
    filteredIncidents, 
    setSelectedIncidentId, 
    selectedStateId,
    districtFilter, 
    setDistrictFilter,
    resolvedTheme
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const circlesGroupRef = useRef<L.LayerGroup | null>(null);

  // 1. Initialize Map (Centered on all of India by default)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [22.8, 78.5],
      zoom: 5,
      minZoom: 4,
      maxZoom: 16,
      zoomControl: false
    });

    // Add CartoDB tile layer dynamically (always dark tiles now to style as secondary navy blue theme)
    const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Zoom controls bottom-right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    mapInstanceRef.current = map;
    markersGroupRef.current = L.layerGroup().addTo(map);
    circlesGroupRef.current = L.layerGroup().addTo(map);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map tiles dynamically when theme changes
  useEffect(() => {
    if (tileLayerRef.current) {
      const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      tileLayerRef.current.setUrl(tileUrl);
    }
  }, [resolvedTheme]);

  // 2. Fly camera to active State or re-center to all-India
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedStateId === 'ALL') {
      map.flyTo([22.8, 78.5], 5, { animate: true, duration: 1.5 });
    } else {
      const stateInfo = MOCK_STATES[selectedStateId];
      if (stateInfo) {
        map.flyTo(stateInfo.center, stateInfo.zoom, { animate: true, duration: 1.5 });
      }
    }
  }, [selectedStateId]);

  // 3. Draw District Boundary Circles (filtered by selected state)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const circlesGroup = circlesGroupRef.current;
    if (!map || !circlesGroup) return;

    circlesGroup.clearLayers();

    Object.values(MOCK_DISTRICTS).forEach(dist => {
      // If a state is selected, only draw circles for that state's districts
      if (selectedStateId !== 'ALL' && dist.stateId !== selectedStateId) {
        return;
      }

      const color = getStateColor(dist.stateId, resolvedTheme);
      const isActive = districtFilter === dist.id;

      const circle = L.circle(dist.center, {
        radius: dist.radius,
        color: color,
        weight: isActive ? 3 : 1.5,
        fillColor: color,
        fillOpacity: isActive ? 0.25 : 0.08,
        dashArray: isActive ? undefined : '5, 5'
      });

      circle.bindTooltip(dist.name, {
        sticky: true,
        className: 'glass-panel',
        direction: 'top'
      });

      circle.on('click', () => {
        if (districtFilter === dist.id) {
          setDistrictFilter('ALL');
        } else {
          setDistrictFilter(dist.id);
        }
      });

      circlesGroup.addLayer(circle);
    });
  }, [districtFilter, selectedStateId, setDistrictFilter]);

  // 4. Draw Incident Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    filteredIncidents.forEach(inc => {
      const pulsingIcon = L.divIcon({
        className: `custom-pulsing-marker severity-glow-${inc.severity}`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker(inc.coords, { icon: pulsingIcon });

      const popupDiv = document.createElement('div');
      popupDiv.className = 'map-popup-card';
      popupDiv.style.width = '200px';
      popupDiv.style.color = 'var(--text-primary)';
      popupDiv.style.fontFamily = 'var(--font-family-sans)';

      popupDiv.innerHTML = `
        <div class="popup-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.25rem; margin-bottom:0.25rem;">
          <span class="popup-id" style="font-family:var(--font-family-mono); font-size:0.7rem; color:var(--color-blue); font-weight:bold;">${inc.id}</span>
          <span style="font-size:0.6rem; font-weight:bold; text-transform:uppercase; color:${inc.severity === 'Critical' ? 'var(--color-red)' : inc.severity === 'High' ? 'var(--color-yellow)' : 'var(--color-blue)'}">${inc.severity}</span>
        </div>
        <h4 class="popup-title" style="font-size:0.8rem; font-weight:bold; margin:0 0 0.25rem 0; color:#fff;">${inc.type}</h4>
        <p class="popup-desc" style="font-size:0.7rem; color:var(--text-muted); margin:0 0 0.5rem 0; line-height:1.35;">${inc.description.substring(0, 75)}...</p>
        <div style="display:flex; justify-content:flex-end;">
          <button class="btn btn-primary btn-xs investigate-btn" style="padding:0.2rem 0.5rem; font-size:0.65rem; border-radius:4px; font-weight:bold; cursor:pointer;">Investigate File</button>
        </div>
      `;

      const investigateBtn = popupDiv.querySelector('.investigate-btn');
      if (investigateBtn) {
        investigateBtn.addEventListener('click', () => {
          setSelectedIncidentId(inc.id);
          marker.closePopup();
        });
      }

      marker.bindPopup(popupDiv, {
        closeButton: false,
        className: 'glass-panel',
        minWidth: 200
      });

      markersGroup.addLayer(marker);
    });

    // Auto-re-center to active district if one is selected
    if (districtFilter !== 'ALL') {
      const activeDist = MOCK_DISTRICTS[districtFilter];
      if (activeDist) {
        map.setView(activeDist.center, 13.5, { animate: true });
      }
    }
  }, [filteredIncidents, districtFilter, setSelectedIncidentId]);

  return (
    <div 
      ref={mapContainerRef} 
      className="crime-map-canvas"
      style={{ width: '100%', height: '100%', borderRadius: '12px', border: '1px solid var(--panel-border)' }}
    />
  );
}
