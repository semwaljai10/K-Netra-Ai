'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Scatter, Bar } from 'react-chartjs-2';
import GlassPanel from '../ui/GlassPanel';
import { 
  Chart as ChartJS, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Tooltip, 
  Legend, 
  ChartOptions 
} from 'chart.js';
import { MOCK_SOCIO_ECONOMIC, AI_SIMULATION_WEIGHTS, MOCK_DISTRICTS } from '@/lib/data';
import { Lightbulb, ShieldAlert, Award } from 'lucide-react';

ChartJS.register(LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

interface SocioData {
  districtId: string;
  districtName: string;
  unemploymentRate: number;
  avgIncome: number;
  streetLighting: number;
  policePatrol: number;
  crimeRate: number;
}

interface InsightData {
  title1: string;
  desc1: string;
  iconType1: 'alert' | 'success';
  title2: string;
  desc2: string;
  iconType2: 'alert' | 'success';
}

function generateDistrictInsight(d: SocioData): InsightData {
  const isHighCrime = d.crimeRate >= 30;
  
  // Insight 1: General Threat / Risk Assessment
  let title1 = '';
  let desc1 = '';
  let iconType1: 'alert' | 'success' = 'alert';
  
  if (isHighCrime) {
    iconType1 = 'alert';
    title1 = `${d.districtName} Risk Corridor Alert`;
    desc1 = `Critical crime density detected at ${d.crimeRate} incidents per 100k population. Statistical models correlate this surge with elevated unemployment (${d.unemploymentRate}%) and reduced patrol frequencies. Special response units are recommended.`;
  } else {
    iconType1 = 'success';
    title1 = `${d.districtName} Optimal Sector Status`;
    desc1 = `High sector stability observed with a low crime rate of ${d.crimeRate}/100k population. Supported by strong average income (₹${d.avgIncome}k/month) and high street lighting coverage (${d.streetLighting}%).`;
  }

  // Insight 2: Infrastructure & Patrol Efficacy Recommendation
  let title2 = '';
  let desc2 = '';
  let iconType2: 'alert' | 'success' = 'success';

  if (d.streetLighting < 75) {
    iconType2 = 'success';
    title2 = `${d.districtName} Infrastructure Forecast`;
    const reduction = Math.round(20 + (75 - d.streetLighting) * 0.5);
    desc2 = `Streetlight coverage is currently under-optimized at ${d.streetLighting}%. Broadening streetlight coverage in key dark zones is forecasted to reduce physical offenses by up to ${reduction}%.`;
  } else if (d.policePatrol < 6) {
    iconType2 = 'alert';
    title2 = `${d.districtName} Patrol Efficacy Optimization`;
    const reduction = Math.round(15 + (6 - d.policePatrol) * 4);
    desc2 = `Active patrol density is low at ${d.policePatrol}/10. Increasing patrol frequencies along transit routes is predicted to reduce vehicle and property offenses by ${reduction}%.`;
  } else {
    iconType2 = 'success';
    title2 = `${d.districtName} Security Maintenance`;
    desc2 = `Socio-infrastructure factors are well-balanced (Lighting: ${d.streetLighting}%, Patrol: ${d.policePatrol}/10). Recommended to maintain current precinct resource allocations to sustain stability.`;
  }

  return { title1, desc1, iconType1, title2, desc2, iconType2 };
}

export default function CorrelationCharts() {
  const { resolvedTheme, selectedStateId, districtFilter } = useApp();
  const [mounted, setMounted] = useState(false);
  const [selectedDistrictId, setSelectedDistrictId] = useState('general');
  const [districtIndex, setDistrictIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');
  const [resetTimerTrigger, setResetTimerTrigger] = useState(0);

  const selectedDistrictData = useMemo(() => {
    if (selectedDistrictId === 'general') return null;
    return MOCK_SOCIO_ECONOMIC.find(d => d.districtId === selectedDistrictId) || null;
  }, [selectedDistrictId]);

  // Generate a sample of 8 districts with varied characteristics for the carousel
  const sampleDistricts = useMemo(() => {
    const ids = [
      'KA_bengaluru_urban',
      'KA_dakshina_kannada',
      'KA_mysuru',
      'KA_udupi',
      'KA_belagavi',
      'KA_kalaburagi',
      'KA_yadgir',
      'KA_bagalkot'
    ];
    return MOCK_SOCIO_ECONOMIC.filter(item => ids.includes(item.districtId));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setDistrictIndex((prev) => (prev + 1) % sampleDistricts.length);
        setFadeState('in');
      }, 300);
    }, 5000); // 5 seconds transition

    return () => clearInterval(interval);
  }, [resetTimerTrigger, sampleDistricts.length]);

  const currentDistrict = useMemo(() => {
    return sampleDistricts[districtIndex] || sampleDistricts[0];
  }, [districtIndex, sampleDistricts]);

  const insight = useMemo(() => {
    return generateDistrictInsight(currentDistrict);
  }, [currentDistrict]);

  // Filter socio-economic data based on selected state and district
  const filteredSocioData = useMemo(() => {
    return MOCK_SOCIO_ECONOMIC.filter(item => {
      // 1. State Filter
      if (selectedStateId && selectedStateId !== 'ALL') {
        const district = MOCK_DISTRICTS[item.districtId];
        if (!district || district.stateId !== selectedStateId) {
          return false;
        }
      }
      // 2. District Filter
      if (districtFilter && districtFilter !== 'ALL') {
        if (item.districtId !== districtFilter) {
          return false;
        }
      }
      return true;
    });
  }, [selectedStateId, districtFilter]);

  if (!mounted) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-dark)' }}>Syncing telemetry analytics...</div>;
  }

  // 1. Scatter Chart Data (Unemployment vs Crime Rate)
  const scatterData = {
    datasets: [
      {
        label: 'Sector Crime Densities',
        data: filteredSocioData.map(item => ({
          x: item.unemploymentRate,
          y: item.crimeRate,
          label: item.districtName
        })),
        backgroundColor: '#3b82f6',
        borderColor: 'rgba(59, 130, 246, 0.4)',
        borderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const scatterOptions: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: resolvedTheme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(13, 20, 35, 0.95)',
        titleColor: resolvedTheme === 'light' ? '#0f172a' : '#fff',
        bodyColor: resolvedTheme === 'light' ? '#334155' : '#cbd5e1',
        borderColor: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const dataPoint = context.raw;
            return `${dataPoint.label}: Unemployment ${dataPoint.x}%, Crime ${dataPoint.y}/100k`;
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Unemployment Rate (%)', color: resolvedTheme === 'light' ? '#475569' : '#94a3b8' },
        grid: { color: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.08)' },
        border: { color: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: resolvedTheme === 'light' ? '#475569' : '#64748b' }
      },
      y: {
        title: { display: true, text: 'Crime Rate (per 100k Pop)', color: resolvedTheme === 'light' ? '#475569' : '#94a3b8' },
        grid: { color: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.08)' },
        border: { color: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: resolvedTheme === 'light' ? '#475569' : '#64748b' }
      }
    }
  };

  // 2. Bar Chart Data (Security Impact Factors/Coefficients)
  const barData = {
    labels: ['Patrol Level (per unit)', 'Street Lighting (%)', 'Average Income (₹k/month)', 'Unemployment (%)'],
    labels_original: ['Patrol Level (per unit)', 'Street Lighting (%)', 'Average Income (₹k/month)', 'Unemployment (%)'],
    datasets: [
      {
        label: selectedDistrictId === 'general' ? 'Baseline Influence Weight' : 'District Parameter Value',
        data: selectedDistrictData 
          ? [
              selectedDistrictData.policePatrol,
              selectedDistrictData.streetLighting,
              selectedDistrictData.avgIncome,
              selectedDistrictData.unemploymentRate
            ]
          : [
              AI_SIMULATION_WEIGHTS.patrol,
              AI_SIMULATION_WEIGHTS.lighting,
              AI_SIMULATION_WEIGHTS.income,
              AI_SIMULATION_WEIGHTS.unemployment
            ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.25)', // Patrol
          'rgba(59, 130, 246, 0.25)',  // Lighting
          'rgba(245, 158, 11, 0.25)',  // Income
          'rgba(239, 68, 68, 0.25)'    // Unemployment
        ],
        borderColor: [
          'var(--color-success)',
          'var(--color-blue)',
          'var(--color-yellow)',
          'var(--color-red)'
        ],
        borderWidth: 2,
        borderRadius: 4
      }
    ]
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: resolvedTheme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(13, 20, 35, 0.95)',
        titleColor: resolvedTheme === 'light' ? '#0f172a' : '#fff',
        bodyColor: resolvedTheme === 'light' ? '#334155' : '#cbd5e1',
        borderColor: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: resolvedTheme === 'light' ? '#475569' : '#64748b' }
      },
      y: {
        title: { 
          display: true, 
          text: selectedDistrictId === 'general' ? 'Baseline Influence Weight' : 'District Parameter Value', 
          color: resolvedTheme === 'light' ? '#475569' : '#94a3b8' 
        },
        grid: { color: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.08)' },
        border: { color: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: resolvedTheme === 'light' ? '#475569' : '#64748b' },
        min: selectedDistrictId === 'general' ? -1.5 : 0,
        max: selectedDistrictId === 'general' ? 2.0 : 150
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="socio-layout">
        <GlassPanel className="socio-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="panel-header-row">
              <h2>Economic Correlation Matrix</h2>
            </div>
            <div className="chart-viewport" style={{ height: '200px' }}>
              <Scatter data={scatterData} options={scatterOptions} />
            </div>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.45', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem' }}>
            <strong style={{ color: 'var(--color-blue)', display: 'block', marginBottom: '0.2rem' }}>Correlation Matrix Analysis</strong>
            Plots district unemployment levels against crime rates per 100k population. The scatter distribution reveals how economic strain acts as a key driver of crime volume across sectors.
          </div>
        </GlassPanel>

        <GlassPanel className="socio-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2>AI Variable Weights (Neural Network Baseline)</h2>
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className="filter-select"
                style={{
                  padding: '0.2rem 1.5rem 0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderColor: 'var(--panel-border)',
                  borderRadius: '4px',
                  color: 'var(--text-muted)',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '180px'
                }}
              >
                <option value="general" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  All Districts (General Weights)
                </option>
                {MOCK_SOCIO_ECONOMIC.map((item) => (
                  <option 
                    key={item.districtId} 
                    value={item.districtId}
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    {item.districtName}
                  </option>
                ))}
              </select>
            </div>
            <div className="chart-viewport" style={{ height: '200px' }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.45', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem' }}>
            <strong style={{ color: 'var(--color-success)', display: 'block', marginBottom: '0.2rem' }}>
              {selectedDistrictId === 'general' ? 'Baseline Coefficient Explanation' : `${selectedDistrictData?.districtName} Parameters`}
            </strong>
            {selectedDistrictId === 'general' ? (
              'Quantifies the directional influence of each factor on the baseline crime rate. Positive weights (Red) increase risk, while negative weights (Green, Blue, Yellow) reduce risk. These coefficients initialize the predictive neural network.'
            ) : (
              `Socio-economic parameters for ${selectedDistrictData?.districtName}: Patrol Level is ${selectedDistrictData?.policePatrol}/10, Street Lighting coverage is ${selectedDistrictData?.streetLighting}%, Average Monthly Income is ₹${selectedDistrictData?.avgIncome}k/month, and Unemployment Rate is ${selectedDistrictData?.unemploymentRate}%.`
            )}
          </div>
        </GlassPanel>
      </div>

      {/* AI Tactical Insights Card */}
      <GlassPanel className="insights-card">
        <div className="panel-header-row" style={{ margin: 0, paddingBottom: '0.5rem' }}>
          <h2>
            <Lightbulb size={16} style={{ color: 'var(--color-yellow)' }} />
            AI Analytical Tactical Insights ({currentDistrict.districtName})
          </h2>
        </div>

        <div 
          className="insights-grid"
          style={{
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: fadeState === 'in' ? 1 : 0,
            transform: fadeState === 'in' ? 'translateY(0)' : 'translateY(8px)'
          }}
        >
          <div className="insight-point">
            {insight.iconType1 === 'alert' ? (
              <ShieldAlert size={18} className="insight-icon" style={{ color: 'var(--color-red)', flexShrink: 0 }} />
            ) : (
              <Award size={18} className="insight-icon" style={{ color: 'var(--color-success)', flexShrink: 0 }} />
            )}
            <div className="insight-text">
              <h4>{insight.title1}</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                {insight.desc1}
              </p>
            </div>
          </div>

          <div className="insight-point">
            {insight.iconType2 === 'alert' ? (
              <ShieldAlert size={18} className="insight-icon" style={{ color: 'var(--color-red)', flexShrink: 0 }} />
            ) : (
              <Award size={18} className="insight-icon" style={{ color: 'var(--color-success)', flexShrink: 0 }} />
            )}
            <div className="insight-text">
              <h4>{insight.title2}</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                {insight.desc2}
              </p>
            </div>
          </div>
        </div>

        {/* Custom Dot Indicators Navigation (Pill-shaped active, Circular inactive) */}
        <div className="insight-dots-container">
          {sampleDistricts.map((item, idx) => (
            <button
              key={item.districtId}
              className={`insight-dot ${districtIndex === idx ? 'active' : ''}`}
              onClick={() => {
                if (districtIndex === idx) return;
                setFadeState('out');
                setTimeout(() => {
                  setDistrictIndex(idx);
                  setFadeState('in');
                  setResetTimerTrigger(prev => prev + 1); // restart the auto-transition timer from 0
                }, 300);
              }}
              title={item.districtName}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
