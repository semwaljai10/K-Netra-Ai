'use client';

import React, { useEffect, useState } from 'react';
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
import { MOCK_SOCIO_ECONOMIC, AI_SIMULATION_WEIGHTS } from '@/lib/data';
import { Lightbulb, ShieldAlert, Award } from 'lucide-react';

ChartJS.register(LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

export default function CorrelationCharts() {
  const { resolvedTheme } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-dark)' }}>Syncing telemetry analytics...</div>;
  }

  // 1. Scatter Chart Data (Unemployment vs Crime Rate)
  const scatterData = {
    datasets: [
      {
        label: 'Sector Crime Densities',
        data: MOCK_SOCIO_ECONOMIC.map(item => ({
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
    labels: ['Patrol Level (per unit)', 'Street Lighting (%)', 'Average Income (INR)', 'Unemployment (%)'],
    datasets: [
      {
        label: 'Crime Rate Correlation Coefficient',
        data: [
          AI_SIMULATION_WEIGHTS.patrol,
          AI_SIMULATION_WEIGHTS.lighting,
          AI_SIMULATION_WEIGHTS.income,
          AI_SIMULATION_WEIGHTS.unemployment
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.25)', // Patrol (Negative impact = green reduction)
          'rgba(59, 130, 246, 0.25)',  // Lighting (Negative impact = blue reduction)
          'rgba(59, 130, 246, 0.25)',  // Income (Negative impact = blue reduction)
          'rgba(239, 68, 68, 0.25)'    // Unemployment (Positive impact = red increase)
        ],
        borderColor: [
          'var(--color-success)',
          'var(--color-blue)',
          'var(--color-blue)',
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
        title: { display: true, text: 'Regression Coefficient Weight', color: resolvedTheme === 'light' ? '#475569' : '#94a3b8' },
        grid: { color: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.08)' },
        border: { color: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: resolvedTheme === 'light' ? '#475569' : '#64748b' }
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="socio-layout">
        <GlassPanel className="socio-card">
          <div className="panel-header-row">
            <h2>Economic Correlation Matrix</h2>
          </div>
          <div className="chart-viewport" style={{ height: '230px' }}>
            <Scatter data={scatterData} options={scatterOptions} />
          </div>
        </GlassPanel>

        <GlassPanel className="socio-card">
          <div className="panel-header-row">
            <h2>AI Variable Weights (Regression Model)</h2>
          </div>
          <div className="chart-viewport" style={{ height: '230px' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </GlassPanel>
      </div>

      {/* AI Tactical Insights Card */}
      <GlassPanel className="insights-card">
        <div className="panel-header-row" style={{ margin: 0, paddingBottom: '0.5rem' }}>
          <h2>
            <Lightbulb size={16} style={{ color: 'var(--color-yellow)' }} />
            AI Analytical Tactical Insights
          </h2>
        </div>

        <div className="insights-grid">
          <div className="insight-point">
            <ShieldAlert size={18} className="insight-icon" style={{ color: 'var(--color-red)' }} />
            <div className="insight-text">
              <h4>East Delhi Corridor Alert</h4>
              <p>
                Unemployment spikes (9.8% in East Delhi Border) match severe crime indices (58.2/100k). Model designates this sector as highly volatile. Social security measures recommended to buffer crime surges.
              </p>
            </div>
          </div>

          <div className="insight-point">
            <Award size={18} className="insight-icon" style={{ color: 'var(--color-success)' }} />
            <div className="insight-text">
              <h4>Lighting & Patrol Efficacy</h4>
              <p>
                Streetlight coverage has the highest infrastructure correlation value (-0.95 weight). Broadening streetlight installation from 48% to 90% is forecasted to reduce night larceny events by up to 34% in East Delhi.
              </p>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
