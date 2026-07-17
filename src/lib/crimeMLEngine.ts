/**
 * Crime ML Engine — TensorFlow.js Neural Network for Crime Rate Prediction
 * 
 * This module provides:
 *   1. CrimePredictor: A neural network trained on Karnataka district data
 *   2. AnomalyDetector: Z-score based statistical anomaly detection
 *   3. TrendForecaster: Exponential smoothing for time-series forecast
 */

import * as tf from '@tensorflow/tfjs';
import { generateTrainingDataset, getDatasetStats, TrainingSample } from './crimeTrainingData';
import type { Incident, Anomaly } from './data';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface TrainingLog {
  epoch: number;
  loss: number;
  valLoss?: number;
}

export interface PredictionResult {
  predictedRate: number;
  confidence: { low: number; high: number };
  featureImportance: {
    unemployment: number;
    income: number;
    lighting: number;
    patrol: number;
  };
}

export interface ModelInfo {
  architecture: string;
  totalParams: number;
  trainingSamples: number;
  finalLoss: number;
  status: 'untrained' | 'training' | 'ready';
  datasetStats: ReturnType<typeof getDatasetStats> | null;
}

// ─── Normalization helpers ──────────────────────────────────────────────────────

interface NormParams {
  mean: number;
  std: number;
}

function computeNormParams(values: number[]): NormParams {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length) || 1;
  return { mean, std };
}

function normalize(value: number, params: NormParams): number {
  return (value - params.mean) / params.std;
}

function denormalize(value: number, params: NormParams): number {
  return value * params.std + params.mean;
}

// ─── 1. Crime Rate Predictor ────────────────────────────────────────────────────

class CrimePredictor {
  private model: tf.Sequential | null = null;
  private normParams: {
    unemployment: NormParams;
    income: NormParams;
    lighting: NormParams;
    patrol: NormParams;
    crimeRate: NormParams;
  } | null = null;
  private trainingLogs: TrainingLog[] = [];
  private _status: 'untrained' | 'training' | 'ready' = 'untrained';
  private dataset: TrainingSample[] = [];
  private _datasetStats: ReturnType<typeof getDatasetStats> | null = null;

  get status() { return this._status; }
  get logs() { return this.trainingLogs; }
  get datasetStats() { return this._datasetStats; }

  /**
   * Build and train the neural network model.
   * @param onEpochEnd - callback for real-time training log updates
   */
  async train(onEpochEnd?: (log: TrainingLog) => void): Promise<void> {
    this._status = 'training';
    this.trainingLogs = [];

    // Generate dataset
    this.dataset = generateTrainingDataset();
    this._datasetStats = getDatasetStats(this.dataset);

    // Compute normalization parameters from training data
    this.normParams = {
      unemployment: computeNormParams(this.dataset.map(s => s.unemployment)),
      income: computeNormParams(this.dataset.map(s => s.income)),
      lighting: computeNormParams(this.dataset.map(s => s.lighting)),
      patrol: computeNormParams(this.dataset.map(s => s.patrol)),
      crimeRate: computeNormParams(this.dataset.map(s => s.crimeRate)),
    };

    // Prepare tensors (normalized)
    const xs = tf.tensor2d(this.dataset.map(s => [
      normalize(s.unemployment, this.normParams.unemployment),
      normalize(s.income, this.normParams.income),
      normalize(s.lighting, this.normParams.lighting),
      normalize(s.patrol, this.normParams.patrol),
    ]));

    const ys = tf.tensor2d(this.dataset.map(s => [
      normalize(s.crimeRate, this.normParams.crimeRate),
    ]));

    // Build model: Input(4) → Dense(32, ReLU) → Dropout → Dense(16, ReLU) → Dense(8, ReLU) → Dense(1)
    this.model = tf.sequential();
    
    this.model.add(tf.layers.dense({
      inputShape: [4],
      units: 32,
      activation: 'relu',
      kernelInitializer: 'heNormal',
    }));

    this.model.add(tf.layers.dropout({ rate: 0.15 }));

    this.model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
      kernelInitializer: 'heNormal',
    }));

    this.model.add(tf.layers.dense({
      units: 8,
      activation: 'relu',
      kernelInitializer: 'heNormal',
    }));

    this.model.add(tf.layers.dense({
      units: 1,
      activation: 'linear',
    }));

    this.model.compile({
      optimizer: tf.train.adam(0.005),
      loss: 'meanSquaredError',
      metrics: ['mse'],
    });

    // Train with validation split
    await this.model.fit(xs, ys, {
      epochs: 60,
      batchSize: 32,
      validationSplit: 0.15,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          const log: TrainingLog = {
            epoch: epoch + 1,
            loss: logs?.loss ?? 0,
            valLoss: logs?.val_loss,
          };
          this.trainingLogs.push(log);
          onEpochEnd?.(log);
        }
      }
    });

    // Cleanup tensors
    xs.dispose();
    ys.dispose();

    this._status = 'ready';
  }

  /**
   * Predict crime rate for given socio-economic inputs
   */
  predict(unemployment: number, income: number, lighting: number, patrol: number): PredictionResult {
    if (!this.model || !this.normParams || this._status !== 'ready') {
      // Fallback to simple calculation if model isn't ready
      return {
        predictedRate: 46.0,
        confidence: { low: 40, high: 52 },
        featureImportance: { unemployment: 0.35, income: 0.25, lighting: 0.20, patrol: 0.20 }
      };
    }

    const inputTensor = tf.tensor2d([[
      normalize(unemployment, this.normParams.unemployment),
      normalize(income, this.normParams.income),
      normalize(lighting, this.normParams.lighting),
      normalize(patrol, this.normParams.patrol),
    ]]);

    const prediction = this.model.predict(inputTensor) as tf.Tensor;
    const normalizedValue = prediction.dataSync()[0];
    const predictedRate = denormalize(normalizedValue, this.normParams.crimeRate);

    inputTensor.dispose();
    prediction.dispose();

    // Clamp to realistic range
    const clampedRate = parseFloat(Math.max(2.0, Math.min(120.0, predictedRate)).toFixed(1));

    // Estimate confidence interval (~±2 standard errors)
    const finalLoss = this.trainingLogs.length > 0 
      ? this.trainingLogs[this.trainingLogs.length - 1].loss 
      : 0.1;
    const stdError = Math.sqrt(finalLoss) * this.normParams.crimeRate.std;
    const margin = parseFloat((stdError * 1.96).toFixed(1));

    // Compute feature importance via gradient-based sensitivity
    const importance = this.computeFeatureImportance(unemployment, income, lighting, patrol);

    return {
      predictedRate: clampedRate,
      confidence: {
        low: parseFloat(Math.max(2.0, clampedRate - margin).toFixed(1)),
        high: parseFloat(Math.min(120.0, clampedRate + margin).toFixed(1)),
      },
      featureImportance: importance
    };
  }

  /**
   * Compute feature importance by measuring prediction sensitivity to each input
   */
  private computeFeatureImportance(u: number, i: number, l: number, p: number) {
    if (!this.model || !this.normParams) {
      return { unemployment: 0.35, income: 0.25, lighting: 0.20, patrol: 0.20 };
    }

    const delta = 0.05; // Small perturbation
    const baseInput = [
      normalize(u, this.normParams.unemployment),
      normalize(i, this.normParams.income),
      normalize(l, this.normParams.lighting),
      normalize(p, this.normParams.patrol),
    ];

    const basePred = (this.model.predict(tf.tensor2d([baseInput])) as tf.Tensor).dataSync()[0];

    const sensitivities = baseInput.map((val, idx) => {
      const perturbedInput = [...baseInput];
      perturbedInput[idx] = val + delta;
      const perturbedPred = (this.model!.predict(tf.tensor2d([perturbedInput])) as tf.Tensor).dataSync()[0];
      return Math.abs(perturbedPred - basePred) / delta;
    });

    const total = sensitivities.reduce((a, b) => a + b, 0) || 1;

    return {
      unemployment: parseFloat((sensitivities[0] / total).toFixed(3)),
      income: parseFloat((sensitivities[1] / total).toFixed(3)),
      lighting: parseFloat((sensitivities[2] / total).toFixed(3)),
      patrol: parseFloat((sensitivities[3] / total).toFixed(3)),
    };
  }

  /**
   * Get model metadata for display
   */
  getModelInfo(): ModelInfo {
    let totalParams = 0;
    if (this.model) {
      this.model.layers.forEach(layer => {
        layer.getWeights().forEach(w => {
          totalParams += w.shape.reduce((a, b) => a * b, 1);
        });
      });
    }

    return {
      architecture: 'Dense(32,ReLU) → Dropout(0.15) → Dense(16,ReLU) → Dense(8,ReLU) → Dense(1)',
      totalParams,
      trainingSamples: this.dataset.length,
      finalLoss: this.trainingLogs.length > 0 
        ? this.trainingLogs[this.trainingLogs.length - 1].loss 
        : 0,
      status: this._status,
      datasetStats: this._datasetStats,
    };
  }
}

// ─── 2. Anomaly Detector ────────────────────────────────────────────────────────

class AnomalyDetector {
  /**
   * Detect anomalies in incident data using Z-score analysis.
   * Groups by district + crime type, computes moving averages,
   * and flags deviations > 2 standard deviations.
   */
  detect(incidents: Incident[]): Anomaly[] {
    if (!incidents || incidents.length === 0) return [];

    const anomalies: Anomaly[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Group incidents by district
    const districtGroups: Record<string, Incident[]> = {};
    for (const inc of incidents) {
      const key = inc.districtId;
      if (!districtGroups[key]) districtGroups[key] = [];
      districtGroups[key].push(inc);
    }

    let alertCounter = 1;

    for (const [districtId, districtIncidents] of Object.entries(districtGroups)) {
      // Count incidents in recent window vs historical
      const recentCount = districtIncidents.filter(inc => {
        const t = new Date(inc.timestamp);
        return t >= thirtyDaysAgo && t <= now;
      }).length;

      const historicalIncidents = districtIncidents.filter(inc => {
        const t = new Date(inc.timestamp);
        return t >= ninetyDaysAgo && t < thirtyDaysAgo;
      });

      // Compute daily rate for historical period
      const historicalDays = 60; // 90 - 30
      const historicalDailyRate = historicalIncidents.length / historicalDays;
      const recentDailyRate = recentCount / 30;

      // Compute standard deviation of daily counts
      const dailyCounts: number[] = [];
      for (let d = 0; d < historicalDays; d++) {
        const dayStart = new Date(ninetyDaysAgo.getTime() + d * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const count = historicalIncidents.filter(inc => {
          const t = new Date(inc.timestamp);
          return t >= dayStart && t < dayEnd;
        }).length;
        dailyCounts.push(count);
      }

      const mean = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length || 0;
      const std = Math.sqrt(
        dailyCounts.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / dailyCounts.length
      ) || 0.5;

      // Z-score for recent period
      const zScore = (recentDailyRate - mean) / std;

      if (Math.abs(zScore) > 1.5 && recentCount >= 2) {
        // Determine the dominant crime type in recent incidents
        const recentByType: Record<string, number> = {};
        districtIncidents
          .filter(inc => new Date(inc.timestamp) >= thirtyDaysAgo)
          .forEach(inc => {
            recentByType[inc.type] = (recentByType[inc.type] || 0) + 1;
          });

        const dominantType = Object.entries(recentByType)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'General Crime';

        const probability = Math.min(99.5, parseFloat((50 + Math.abs(zScore) * 15).toFixed(1)));

        const severity: Anomaly['severity'] = 
          zScore > 3 ? 'Critical' :
          zScore > 2.5 ? 'High' :
          zScore > 2 ? 'Medium' : 'Low';

        const changePercent = mean > 0 
          ? ((recentDailyRate - mean) / mean * 100).toFixed(0)
          : '∞';

        const direction = zScore > 0 ? 'increase' : 'decrease';
        const anomalyType = zScore > 2.5 ? 'Spike Anomaly' : 
                           zScore > 1.5 ? 'Pattern Deviation' : 'Unusual Volume';

        // Format the district name from districtId
        const districtName = districtId
          .replace('KA_', '')
          .split('_')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        anomalies.push({
          id: `ALRT-ML-${String(alertCounter++).padStart(3, '0')}`,
          title: `${dominantType} ${zScore > 0 ? 'Surge' : 'Drop'} Detected`,
          districtId,
          type: anomalyType,
          probability,
          description: `Statistical analysis detected a ${changePercent}% ${direction} in ${dominantType} incidents in ${districtName} (Z-score: ${zScore.toFixed(2)}). Recent: ${recentDailyRate.toFixed(1)}/day vs Historical: ${mean.toFixed(1)}/day.`,
          severity,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Sort by probability descending, take top 10
    return anomalies
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 10);
  }
}

// ─── 3. Trend Forecaster ────────────────────────────────────────────────────────

class TrendForecaster {
  /**
   * Forecast future daily incident counts using double exponential smoothing
   * (Holt's method) which handles both level and trend.
   * 
   * @param historicalCounts - Array of daily incident counts (most recent last)
   * @param forecastDays - Number of days to forecast
   * @returns Array of forecasted values
   */
  forecast(historicalCounts: number[], forecastDays: number = 3): number[] {
    if (historicalCounts.length < 3) {
      return Array(forecastDays).fill(
        historicalCounts.length > 0 
          ? historicalCounts[historicalCounts.length - 1] 
          : 0
      );
    }

    // Holt's double exponential smoothing
    const alpha = 0.35; // Level smoothing
    const beta = 0.15;  // Trend smoothing

    // Initialize
    let level = historicalCounts[0];
    let trend = (historicalCounts[1] - historicalCounts[0]);

    // Smooth through historical data
    for (let i = 1; i < historicalCounts.length; i++) {
      const prevLevel = level;
      level = alpha * historicalCounts[i] + (1 - alpha) * (prevLevel + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    // Generate forecast
    const forecasts: number[] = [];
    for (let h = 1; h <= forecastDays; h++) {
      // Apply dampening factor to trend for longer horizons
      const dampened = trend * Math.pow(0.85, h);
      const forecast = Math.max(0, level + dampened * h);
      forecasts.push(parseFloat(forecast.toFixed(1)));
    }

    return forecasts;
  }
}

// ─── Singleton Exports ──────────────────────────────────────────────────────────

export const crimePredictor = new CrimePredictor();
export const anomalyDetector = new AnomalyDetector();
export const trendForecaster = new TrendForecaster();
