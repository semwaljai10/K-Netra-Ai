'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import GlassPanel from '../ui/GlassPanel';
import { Play, RotateCcw, BrainCircuit, Activity, AlertTriangle, Info, TrendingUp, TrendingDown } from 'lucide-react';
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
import { crimePredictor, type PredictionResult, type ModelInfo, type TrainingLog } from '@/lib/crimeMLEngine';
import { MOCK_SOCIO_ECONOMIC } from '@/lib/data';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function PredictionArea() {
  const { resolvedTheme } = useApp();
  
  // District selector state
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('KA_dakshina_kannada');

  const selectedDistrict = useMemo(() => {
    return MOCK_SOCIO_ECONOMIC.find(d => d.districtId === selectedDistrictId) || MOCK_SOCIO_ECONOMIC[0];
  }, [selectedDistrictId]);

  // Slider states (Defaulting to selected district baseline values)
  const [unemployment, setUnemployment] = useState<number>(11.7);
  const [lighting, setLighting] = useState<number>(62);
  const [patrol, setPatrol] = useState<number>(4);
  const [income, setIncome] = useState<number>(73); // In k INR

  // Simulation running states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [predictedRate, setPredictedRate] = useState<number>(46.0);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [isModelTrained, setIsModelTrained] = useState<boolean>(false);
  const [showModelInfo, setShowModelInfo] = useState<boolean>(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Check if model is already trained on mount
  useEffect(() => {
    if (crimePredictor.status === 'ready') {
      setIsModelTrained(true);
      setModelInfo(crimePredictor.getModelInfo());
    }
  }, []);

  const appendLog = useCallback((text: string) => {
    setTerminalLogs(prev => [...prev, text]);
  }, []);

  // Handle run simulation triggers
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setTerminalLogs([]);

    if (!isModelTrained) {
      // ── First run: Train the model ──
      appendLog("[INITIALIZING] TensorFlow.js Neural Network Engine v2.0...");
      
      await new Promise(r => setTimeout(r, 200));
      const stats = await new Promise<ReturnType<typeof import('@/lib/crimeTrainingData').getDatasetStats> | null>((resolve) => {
        import('@/lib/crimeTrainingData').then(({ generateTrainingDataset, getDatasetStats }) => {
          const dataset = generateTrainingDataset();
          resolve(getDatasetStats(dataset));
        });
      });

      if (stats) {
        appendLog(`[DATASET] Loaded ${stats.totalSamples} training samples from ${stats.uniqueDistricts} Karnataka districts (${stats.yearsSpanned.join(', ')})`);
        appendLog(`[DATASET] Crime rate range: ${stats.crimeRateRange.min} – ${stats.crimeRateRange.max}/100k | Mean: ${stats.crimeRateMean} | Std: ${stats.crimeRateStd}`);
      }

      await new Promise(r => setTimeout(r, 300));
      appendLog("[ARCHITECTURE] Building: Input(4) → Dense(32,ReLU) → Dropout(0.15) → Dense(16,ReLU) → Dense(8,ReLU) → Dense(1)");
      appendLog("[TRAINING] Starting model training with Adam optimizer (lr=0.005)...");

      await new Promise(r => setTimeout(r, 200));

      // Train with real epoch callbacks
      let lastLoggedEpoch = 0;
      await crimePredictor.train((log: TrainingLog) => {
        // Log every 10 epochs + the last one
        if (log.epoch % 10 === 0 || log.epoch === 1 || log.epoch === 60) {
          lastLoggedEpoch = log.epoch;
          const valStr = log.valLoss !== undefined ? ` | val_loss: ${log.valLoss.toFixed(4)}` : '';
          appendLog(`[EPOCH ${String(log.epoch).padStart(2, ' ')}/60] loss: ${log.loss.toFixed(4)}${valStr}`);
        }
      });

      setIsModelTrained(true);
      const info = crimePredictor.getModelInfo();
      setModelInfo(info);
      appendLog(`[TRAINED] Model ready. ${info.totalParams} parameters | Final loss: ${info.finalLoss.toFixed(4)}`);
      appendLog(`[BASELINE] District: ${selectedDistrict.districtName} (${selectedDistrict.districtId})`);
      
      await new Promise(r => setTimeout(r, 200));
    } else {
      // ── Subsequent runs: Use cached model ──
      appendLog("[MODEL] TensorFlow.js Neural Network (cached) — ready for inference.");
      appendLog(`[BASELINE] District: ${selectedDistrict.districtName} (${selectedDistrict.districtId})`);
      appendLog(`[PARAMS] U=${unemployment}%, L=${lighting}%, P=${patrol}/10, I=₹${income}k`);
      await new Promise(r => setTimeout(r, 400));
    }

    // ── Run prediction ──
    appendLog(`[INFERENCE] Running prediction: U=${unemployment}%, L=${lighting}%, P=${patrol}/10, I=₹${income}k...`);
    await new Promise(r => setTimeout(r, 300));

    const result = crimePredictor.predict(unemployment, income, lighting, patrol);
    setPredictedRate(result.predictedRate);
    setPredictionResult(result);
    setModelInfo(crimePredictor.getModelInfo());

    appendLog(`[RESULT] Predicted Crime Rate: ${result.predictedRate}/100k (95% CI: ${result.confidence.low} – ${result.confidence.high})`);
    appendLog(`[IMPORTANCE] Unemployment: ${(result.featureImportance.unemployment * 100).toFixed(1)}% | Income: ${(result.featureImportance.income * 100).toFixed(1)}% | Lighting: ${(result.featureImportance.lighting * 100).toFixed(1)}% | Patrol: ${(result.featureImportance.patrol * 100).toFixed(1)}%`);
    appendLog(`[COMPLETED] Neural network inference complete. Confidence interval locked.`);

    setIsSimulating(false);
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    const dist = MOCK_SOCIO_ECONOMIC.find(d => d.districtId === districtId);
    if (dist) {
      setUnemployment(dist.unemploymentRate);
      setLighting(dist.streetLighting);
      setPatrol(dist.policePatrol);
      setIncome(dist.avgIncome);
      setPredictedRate(dist.crimeRate);
      setPredictionResult(null);
      setTerminalLogs([`[SELECT] Loaded baseline values for ${dist.districtName}.`]);
    }
  };

  const handleResetVariables = () => {
    if (selectedDistrict) {
      setUnemployment(selectedDistrict.unemploymentRate);
      setLighting(selectedDistrict.streetLighting);
      setPatrol(selectedDistrict.policePatrol);
      setIncome(selectedDistrict.avgIncome);
      setPredictedRate(selectedDistrict.crimeRate);
      setPredictionResult(null);
      setTerminalLogs([`[RESET] Variables returned to ${selectedDistrict.districtName} default baseline values.`]);
    }
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
    labels: [`Current Baseline Rate (${selectedDistrict.districtName})`, 'AI Neural Network Forecast'],
    datasets: [
      {
        label: 'Crime Rate per 100k Population',
        data: [selectedDistrict.crimeRate, predictedRate],
        backgroundColor: [
          'rgba(59, 130, 246, 0.25)', // Baseline (Blue)
          predictedRate > selectedDistrict.crimeRate ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)' // Simulated (Red/Green)
        ],
        borderColor: [
          'var(--color-blue)',
          predictedRate > selectedDistrict.crimeRate ? 'var(--color-red)' : 'var(--color-success)'
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

        {/* District selector dropdown */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
            Select District Baseline
          </label>
          <select
            value={selectedDistrictId}
            onChange={(e) => handleDistrictChange(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--color-blue)',
              fontWeight: 'bold',
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
              outline: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            {MOCK_SOCIO_ECONOMIC.map((dist) => (
              <option key={dist.districtId} value={dist.districtId} style={{ background: '#1e2022', color: '#fff' }}>
                {dist.districtName}
              </option>
            ))}
          </select>
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
            {isSimulating ? 'Training Neural Net...' : isModelTrained ? 'Run Inference' : 'Train & Execute Model'}
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

        {/* Model info toggle */}
        {modelInfo && (
          <button
            onClick={() => setShowModelInfo(!showModelInfo)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              marginTop: '0.75rem', padding: '0.4rem 0.6rem',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '6px', cursor: 'pointer',
              color: 'var(--color-blue)', fontSize: '0.7rem',
              fontFamily: 'var(--font-family-mono)', width: '100%',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <Info size={12} />
            {showModelInfo ? 'Hide Model Info' : 'View Model Architecture'}
          </button>
        )}

        {/* Model info panel */}
        {showModelInfo && modelInfo && (
          <div style={{
            marginTop: '0.5rem', padding: '0.6rem',
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            borderRadius: '8px', fontSize: '0.65rem',
            fontFamily: 'var(--font-family-mono)',
            lineHeight: '1.6'
          }}>
            <div style={{ color: 'var(--color-blue)', fontWeight: 600, marginBottom: '0.3rem' }}>
              TensorFlow.js Model
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              <div>Architecture: {modelInfo.architecture}</div>
              <div>Parameters: {modelInfo.totalParams.toLocaleString()}</div>
              <div>Training Samples: {modelInfo.trainingSamples.toLocaleString()}</div>
              <div>Final Loss: {modelInfo.finalLoss.toFixed(6)}</div>
              <div>Status: <span style={{ color: modelInfo.status === 'ready' ? 'var(--color-success)' : 'var(--color-yellow)' }}>
                {modelInfo.status.toUpperCase()}
              </span></div>
              {modelInfo.datasetStats && (
                <>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.3rem', paddingTop: '0.3rem' }}>
                    Districts: {modelInfo.datasetStats.uniqueDistricts}
                  </div>
                  <div>Years: {modelInfo.datasetStats.yearsSpanned.join(', ')}</div>
                </>
              )}
            </div>
          </div>
        )}
      </GlassPanel>

      {/* 2. Simulation display and terminal logs */}
      <div className="predictor-results-area">
        <div className="sim-output-grid">
          <GlassPanel className="sim-out-card">
            <span>Forecasted Crime Density</span>
            <strong style={{ color: risk.color }}>{predictedRate}</strong>
            <span className="sim-out-unit">Incidents / 100k Pop</span>
            {/* Confidence interval */}
            {predictionResult && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                marginTop: '0.25rem', fontSize: '0.65rem',
                color: 'var(--text-dark)', fontFamily: 'var(--font-family-mono)'
              }}>
                <span>95% CI:</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {predictionResult.confidence.low} – {predictionResult.confidence.high}
                </span>
              </div>
            )}
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

        {/* Feature Importance Bar (shown after prediction) */}
        {predictionResult && (
          <GlassPanel style={{ padding: '0.75rem 1rem', marginBottom: '0' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem',
              fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: 'var(--text-secondary)'
            }}>
              <TrendingUp size={12} />
              Neural Network Feature Importance
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Unemployment', value: predictionResult.featureImportance.unemployment, color: '#ef4444' },
                { label: 'Income', value: predictionResult.featureImportance.income, color: '#f59e0b' },
                { label: 'Lighting', value: predictionResult.featureImportance.lighting, color: '#3b82f6' },
                { label: 'Patrol', value: predictionResult.featureImportance.patrol, color: '#10b981' },
              ].map(feat => (
                <div key={feat.label} style={{ flex: '1 1 0', minWidth: '80px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-dark)', marginBottom: '0.2rem' }}>
                    <span>{feat.label}</span>
                    <span style={{ fontFamily: 'var(--font-family-mono)' }}>{(feat.value * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{
                    height: '4px', borderRadius: '2px',
                    background: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${feat.value * 100}%`,
                      height: '100%',
                      background: feat.color,
                      borderRadius: '2px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        )}

        {/* Dynamic Comparison Bar Chart */}
        <GlassPanel style={{ padding: '1.25rem', height: '220px' }}>
          <Bar data={comparisonData} options={comparisonOptions} />
        </GlassPanel>

        {/* Simulated Neural Terminal */}
        <div className="terminal-log-card">
          <div className="term-header">
            <span>TENSORFLOW.JS NEURAL NETWORK EXECUTION SHELL</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {isModelTrained && (
                <span style={{ 
                  fontSize: '0.55rem', padding: '0.1rem 0.35rem',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '3px', color: 'var(--color-success)',
                  marginRight: '0.3rem'
                }}>
                  ML-POWERED
                </span>
              )}
              <Activity size={10} style={{ animation: 'markerPulseRed 1s infinite' }} />
              ACTIVE
            </span>
          </div>
          <div className="term-body">
            {terminalLogs.length === 0 ? (
              <span style={{ color: 'var(--text-dark)' }}>
                {isModelTrained 
                  ? '[READY] Neural network model cached. Adjust sliders and run inference.' 
                  : '[READY] Click "Train & Execute Model" to train the neural network on 800+ crime data samples.'}
              </span>
            ) : (
              terminalLogs.map((log, index) => {
                let logColor: string | undefined;
                if (log.startsWith('[COMPLETED]') || log.startsWith('[TRAINED]')) logColor = 'var(--color-success)';
                else if (log.startsWith('[RESET]')) logColor = 'var(--color-blue)';
                else if (log.startsWith('[EPOCH')) logColor = '#f59e0b';
                else if (log.startsWith('[RESULT]')) logColor = 'var(--color-success)';
                else if (log.startsWith('[IMPORTANCE]')) logColor = '#a78bfa';
                else if (log.startsWith('[DATASET]')) logColor = '#38bdf8';
                else if (log.startsWith('[ARCHITECTURE]')) logColor = '#c084fc';
                else if (log.startsWith('[INITIALIZING]') || log.startsWith('[MODEL]')) logColor = '#64748b';

                return (
                  <div key={index} style={{ marginBottom: '0.2rem' }}>
                    <span style={{ color: logColor }}>
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
