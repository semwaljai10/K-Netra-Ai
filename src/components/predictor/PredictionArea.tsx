'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import GlassPanel from '../ui/GlassPanel';
import { Play, RotateCcw, BrainCircuit, Terminal, Activity, AlertTriangle } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function PredictionArea() {
  const { resolvedTheme } = useApp();
  // Slider states (Defaulting to Dakshina Kannada baseline values)
  const [unemployment, setUnemployment] = useState<number>(11.7);
  const [lighting, setLighting] = useState<number>(62);
  const [patrol, setPatrol] = useState<number>(4);
  const [income, setIncome] = useState<number>(73); // In k INR

  // Simulation running states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [predictedRate, setPredictedRate] = useState<number>(46.0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Handle run simulation triggers
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTerminalLogs([]);

    const logSequence = [
      { text: "[INITIALIZING] Accessing socio-economic weight vectors...", delay: 100 },
      { text: "[TELEMETRY] Sector Dakshina Kannada (KA_dakshina_kannada) selected as baseline.", delay: 350 },
      { text: "[REGRESSION] Coefficients: Unemployment=+2.1 | Lighting=-0.4 | Patrol=-3.2 | Income=-0.15", delay: 700 },
      { text: `[COMPILING] Modeling variables: U=${unemployment}%, L=${lighting}%, P=${patrol}/10, I=₹${income}k...`, delay: 1050 },
      { text: "[PROCESSING] Running multivariate regression matrix computation...", delay: 1400 }
    ];

    logSequence.forEach((log) => {
      setTimeout(() => {
        setTerminalLogs(prev => [...prev, log.text]);
      }, log.delay);
    });

    // Final calculation log
    setTimeout(() => {
      // Regression Formula centered on Dakshina Kannada baseline
      // Base crime rate = 46.0
      const baseUnemployment = 11.7;
      const baseLighting = 62;
      const basePatrol = 4;
      const baseIncome = 73;

      const deltaU = (unemployment - baseUnemployment) * 2.1;
      const deltaL = (lighting - baseLighting) * -0.4;
      const deltaP = (patrol - basePatrol) * -3.2;
      const deltaI = (income - baseIncome) * -0.15;

      const rawCalculated = 46.0 + deltaU + deltaL + deltaP + deltaI;
      const finalVal = parseFloat(Math.max(5.0, rawCalculated).toFixed(1));
      
      setPredictedRate(finalVal);

      const statusMsg = `[COMPLETED] Neural model compiled. Estimated Crime Rate: ${finalVal}/100k. Stability index locked.`;
      setTerminalLogs(prev => [...prev, statusMsg]);
      setIsSimulating(false);
    }, 1800);
  };

  const handleResetVariables = () => {
    setUnemployment(11.7);
    setLighting(62);
    setPatrol(4);
    setIncome(73);
    setPredictedRate(46.0);
    setTerminalLogs(["[RESET] Variables returned to Dakshina Kannada default baseline values."]);
  };

  // Determine threat level badge and color
  const getRiskDetails = (rate: number) => {
    if (rate >= 50) return { grade: 'CRITICAL THREAT', color: 'var(--color-red)' };
    if (rate >= 35) return { grade: 'HIGH RISK', color: 'var(--color-yellow)' };
    if (rate >= 20) return { grade: 'MODERATE', color: 'var(--color-blue)' };
    return { grade: 'OPTIMAL STABILITY', color: 'var(--color-success)' };
  };

  const risk = getRiskDetails(predictedRate);

  // Chart configuration for comparison
  const comparisonData = {
    labels: ['Current Baseline Rate (Dakshina Kannada)', 'AI Simulated Forecast'],
    datasets: [
      {
        label: 'Crime Rate per 100k Population',
        data: [46.0, predictedRate],
        backgroundColor: [
          'rgba(59, 130, 246, 0.25)', // Baseline (Blue)
          predictedRate > 46.0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)' // Simulated (Red/Green)
        ],
        borderColor: [
          'var(--color-blue)',
          predictedRate > 46.0 ? 'var(--color-red)' : 'var(--color-success)'
        ],
        borderWidth: 2,
        borderRadius: 6
      }
    ]
  };

  const comparisonOptions: ChartOptions<'bar'> = {
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
        ticks: { color: resolvedTheme === 'light' ? '#475569' : '#94a3b8', font: { family: 'var(--font-family-sans)', weight: 'bold' } }
      },
      y: {
        title: { display: true, text: 'Incidents / 100k Pop', color: resolvedTheme === 'light' ? '#475569' : '#94a3b8' },
        grid: { color: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.08)' },
        border: { color: resolvedTheme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#64748b' },
        suggestedMin: 0
      }
    }
  };

  return (
    <div className="predictor-layout">
      {/* 1. Variable controls sidebar panel */}
      <GlassPanel className="predictor-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
          <BrainCircuit size={18} style={{ color: 'var(--color-blue)' }} />
          <h2 style={{ margin: 0, fontSize: '1rem', fontFamily: 'var(--font-family-title)' }}>Socio-Economic Weights</h2>
        </div>

        {/* Sliders */}
        <div className="predictor-control-group">
          <div className="predictor-label-row">
            <span className="predictor-label">Unemployment Rate</span>
            <span className="predictor-val">{unemployment.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="0.1"
            className="predictor-slider"
            value={unemployment}
            onChange={(e) => setUnemployment(parseFloat(e.target.value))}
          />
        </div>

        <div className="predictor-control-group">
          <div className="predictor-label-row">
            <span className="predictor-label">Street Lighting Coverage</span>
            <span className="predictor-val">{lighting}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            className="predictor-slider"
            value={lighting}
            onChange={(e) => setLighting(parseInt(e.target.value))}
          />
        </div>

        <div className="predictor-control-group">
          <div className="predictor-label-row">
            <span className="predictor-label">Police Patrol Frequency</span>
            <span className="predictor-val">{patrol}/10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            className="predictor-slider"
            value={patrol}
            onChange={(e) => setPatrol(parseInt(e.target.value))}
          />
        </div>

        <div className="predictor-control-group">
          <div className="predictor-label-row">
            <span className="predictor-label">Average Monthly Income</span>
            <span className="predictor-val">₹{income}k</span>
          </div>
          <input
            type="range"
            min="10"
            max="150"
            step="1"
            className="predictor-slider"
            value={income}
            onChange={(e) => setIncome(parseInt(e.target.value))}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.65rem' }}
            disabled={isSimulating}
            onClick={handleRunSimulation}
          >
            <Play size={14} />
            {isSimulating ? 'Processing Matrix...' : 'Execute Simulator'}
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '0.65rem' }}
            onClick={handleResetVariables}
          >
            <RotateCcw size={14} />
            Reset to Baseline
          </button>
        </div>
      </GlassPanel>

      {/* 2. Simulation display and terminal logs */}
      <div className="predictor-results-area">
        <div className="sim-output-grid">
          <GlassPanel className="sim-out-card">
            <span>Forecasted Crime Density</span>
            <strong style={{ color: risk.color }}>{predictedRate}</strong>
            <span className="sim-out-unit">Incidents / 100k Pop</span>
          </GlassPanel>

          <GlassPanel className="sim-out-card">
            <span>Aggregated Risk Grade</span>
            <strong style={{ color: risk.color, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={18} />
              {risk.grade}
            </strong>
            <span className="sim-out-desc">Socio-Economic Weighted Index</span>
          </GlassPanel>
        </div>

        {/* Dynamic Comparison Bar Chart */}
        <GlassPanel style={{ padding: '1.25rem', height: '220px' }}>
          <Bar data={comparisonData} options={comparisonOptions} />
        </GlassPanel>

        {/* Simulated Neural Terminal */}
        <div className="terminal-log-card">
          <div className="term-header">
            <span>NEURAL NET FORECAST MODEL EXECUTION SHELL</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Activity size={10} style={{ animation: 'markerPulseRed 1s infinite' }} />
              ACTIVE
            </span>
          </div>
          <div className="term-body">
            {terminalLogs.length === 0 ? (
              <span style={{ color: 'var(--text-dark)' }}>[READY] Sliders configured. Execute model trigger above.</span>
            ) : (
              terminalLogs.map((log, index) => {
                let colorClass = '';
                if (log.startsWith('[COMPLETED]')) colorClass = 'text-success';
                else if (log.startsWith('[RESET]')) colorClass = 'text-blue';
                else if (log.startsWith('[INITIALIZING]')) colorClass = 'text-dark';

                return (
                  <div key={index} style={{ marginBottom: '0.2rem' }}>
                    <span 
                      style={{ 
                        color: log.startsWith('[COMPLETED]') ? 'var(--color-success)' : 
                               log.startsWith('[RESET]') ? 'var(--color-blue)' : 
                               log.startsWith('[INITIALIZING]') ? '#64748b' : undefined 
                      }}
                    >
                      {log}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
