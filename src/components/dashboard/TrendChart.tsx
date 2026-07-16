'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  const [offsetDays, setOffsetDays] = useState(0);
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Find the base date as the current system date, overriding the year and month to match selected values
  const baseDate = useMemo(() => {
    const date = new Date(); // Current system date
    date.setFullYear(selectedYear);
    date.setMonth(selectedMonth);
    return date;
  }, [selectedYear, selectedMonth]);

  // Apply offsetDays shift to compute final window end date
  const now = useMemo(() => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + offsetDays);
    return date;
  }, [baseDate, offsetDays]);

  // Generate last 10 days labels ending on the dynamic 'now' date
  const labels: string[] = [];
  const activeCounts: number[] = [];
  const baselineCounts: number[] = [];

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

  // Compute label representation for the active date range
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 9);
  const dateRangeStr = `${startDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;

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
        backgroundColor: resolvedTheme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 240, 255, 0.05)',
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

  // Render loading placeholder before client mount to satisfy hydration, but placed after hooks to obey Rule of Hooks
  if (!mounted) {
    return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dark)' }}>Loading telemetry charts...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', position: 'relative' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0.5rem',
      }}>
        {/* Date Label */}
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {dateRangeStr}
        </span>

        {/* Month & Year Modifier Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(Number(e.target.value));
              setOffsetDays(0); // Reset shift when month changes
            }}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--color-blue)',
              fontWeight: 'bold',
              padding: '0.25rem 0.6rem',
              borderRadius: '6px',
              outline: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.05)',
            }}
          >
            {[
              { val: 0, label: 'Jan' },
              { val: 1, label: 'Feb' },
              { val: 2, label: 'Mar' },
              { val: 3, label: 'Apr' },
              { val: 4, label: 'May' },
              { val: 5, label: 'Jun' },
              { val: 6, label: 'Jul' },
              { val: 7, label: 'Aug' },
              { val: 8, label: 'Sep' },
              { val: 9, label: 'Oct' },
              { val: 10, label: 'Nov' },
              { val: 11, label: 'Dec' }
            ].map(m => (
              <option key={m.val} value={m.val} style={{ background: '#1e2022', color: '#fff' }}>{m.label}</option>
            ))}
          </select>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Baseline Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setOffsetDays(0); // Reset shift when year changes
            }}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--color-blue)',
              fontWeight: 'bold',
              padding: '0.25rem 0.6rem',
              borderRadius: '6px',
              outline: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.05)',
            }}
          >
            {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y} style={{ background: '#1e2022', color: '#fff' }}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Relative container for absolute overlay buttons */}
      <div style={{ flex: 1, position: 'relative', minHeight: '160px', padding: '0 30px' }}>
        {/* Left Circular Shifter Button */}
        <button
          type="button"
          onClick={() => setOffsetDays(prev => prev - 10)}
          style={{
            position: 'absolute',
            left: '-5px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: resolvedTheme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.8)',
            border: resolvedTheme === 'light' ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(59, 130, 246, 0.3)',
            color: 'var(--color-blue)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--color-blue)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'var(--color-blue)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = resolvedTheme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.8)';
            e.currentTarget.style.color = 'var(--color-blue)';
            e.currentTarget.style.borderColor = resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.12)' : 'rgba(59, 130, 246, 0.3)';
          }}
          title="Shift 10 days back"
        >
          &lt;
        </button>

        {/* Right Circular Shifter Button */}
        <button
          type="button"
          onClick={() => setOffsetDays(prev => prev + 10)}
          style={{
            position: 'absolute',
            right: '-5px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: resolvedTheme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.8)',
            border: resolvedTheme === 'light' ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(59, 130, 246, 0.3)',
            color: 'var(--color-blue)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--color-blue)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'var(--color-blue)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = resolvedTheme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.8)';
            e.currentTarget.style.color = 'var(--color-blue)';
            e.currentTarget.style.borderColor = resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.12)' : 'rgba(59, 130, 246, 0.3)';
          }}
          title="Shift 10 days forward"
        >
          &gt;
        </button>

        <Line data={data} options={options} />
      </div>
    </div>
  );
}
