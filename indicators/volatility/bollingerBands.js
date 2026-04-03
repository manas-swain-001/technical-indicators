/**
 * Bollinger Bands
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * Mid_band = SMA(Close, period)    [typically 20]
 * 
 * Standard Deviation:
 *   σ = sqrt(SUM((Close_i - Mid_band)²) / period)
 * 
 * Upper_band = Mid_band + (k × σ)    [k typically 2]
 * Lower_band = Mid_band - (k × σ)
 * 
 * Boundary conditions:
 *   If σ = 0: Upper = Lower = Mid
 */

import { createSMAState, updateSMA, getSMAValue } from '../trend/sma.js';

export function createBollingerBandsState(period = 20, stdDev = 2) {
    return {
        period,
        stdDev,
        prices: [],
        smaState: createSMAState(period),
        ready: false
    };
}

export function updateBollingerBands(state, candle) {
    state.prices.push(candle.close);
    updateSMA(state.smaState, candle);

    // Keep only required prices
    if (state.prices.length > state.period) {
        state.prices.shift();
    }

    if (state.prices.length === state.period) {
        state.ready = true;
    }
}

export function getBollingerBandsValues(state) {
    if (!state.ready) {
        return { mid: null, upper: null, lower: null };
    }

    const mid = getSMAValue(state.smaState);

    // Calculate standard deviation
    let sumSquaredDiff = 0;
    for (let i = 0; i < state.prices.length; i++) {
        const diff = state.prices[i] - mid;
        sumSquaredDiff += diff * diff;
    }

    const variance = sumSquaredDiff / state.period;
    const stdDevValue = Math.sqrt(variance);

    const upper = mid + (state.stdDev * stdDevValue);
    const lower = mid - (state.stdDev * stdDevValue);

    return { mid, upper, lower };
}

/**
 * Reference calculation for validation
 */
export function calculateBollingerBandsReference(candles, period = 20, stdDevMultiplier = 2) {
    if (candles.length < period) {
        return { mid: null, upper: null, lower: null };
    }

    // Calculate SMA
    let sum = 0;
    for (let i = candles.length - period; i < candles.length; i++) {
        sum += candles[i].close;
    }
    const mid = sum / period;

    // Calculate standard deviation
    let sumSquaredDiff = 0;
    for (let i = candles.length - period; i < candles.length; i++) {
        const diff = candles[i].close - mid;
        sumSquaredDiff += diff * diff;
    }

    const variance = sumSquaredDiff / period;
    const stdDev = Math.sqrt(variance);

    const upper = mid + (stdDevMultiplier * stdDev);
    const lower = mid - (stdDevMultiplier * stdDev);

    return { mid, upper, lower };
}
