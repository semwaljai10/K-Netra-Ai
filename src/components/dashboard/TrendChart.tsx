'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TrendChart() {
  const { incidents, resolvedTheme } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dark)' }}>Loading telemetry charts...</div>;
  }

  // Generate last 10 days labels (ending today, 2026-05-30)
  const labels: string[] = [];
  const activeCounts: number[] = [];
  const baselineCounts: number[] = [];

  const now = new Date('2026-05-30');
  for (let i = 9; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const labelStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    labels.push(labelStr);

    // Count incidents on this specific day
    const countOnDay = incidents.filter(inc => inc.timestamp.startsWith(dateStr)).length;
    activeCounts.push(countOnDay);
    
    // Create a mock baseline: steady average of 0.8 per day with slight random noise
    const baseVal = Math.max(0.5, 0.8 + Math.sin(i * 1.5) * 0.4);
    baselineCounts.push(parseFloat(baseVal.toFixed(1)));
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Active Tactical Incidents',
        data: activeCounts,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#3b82f6',
        pointHoverRadius: 6,
      },
      {
        label: 'AI Historical Baseline',
        data: baselineCounts,
        borderColor: '#a855f7',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [5, 5],
        tension: 0.3,
        fill: false,
        pointRadius: 0,
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: resolvedTheme === 'light' ? '#475569' : '#94a3b8',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: resolvedTheme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(13, 20, 35, 0.95)',
        titleColor: resolvedTheme === 'light' ? '#0f172a' : '#fff',
        bodyColor: resolvedTheme === 'light' ? '#334155' : '#cbd5e1',
        titleFont: { family: "'Inter', sans-serif", weight: 'bold' },
        bodyFont: { family: "'Inter', sans-serif" },
        borderColor: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          color: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: resolvedTheme === 'light' ? '#475569' : '#64748b',
          font: {
            family: "'Inter', sans-serif",
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.08)',
        },
        border: {
          color: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: resolvedTheme === 'light' ? '#475569' : '#64748b',
          font: {
            family: "'Inter', sans-serif",
            size: 10
          },
          stepSize: 1
        },
        suggestedMin: 0
      }
    }
  };

  return <Line data={data} options={options} />;
}
