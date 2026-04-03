/**
 * MACD (Moving Average Convergence Divergence)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * EMA_fast = EMA(Close, fast_period)    [typically 12]
 * EMA_slow = EMA(Close, slow_period)    [typically 26]
 * 
 * MACD_line = EMA_fast - EMA_slow
 * Signal_line = EMA(MACD_line, signal_period)    [typically 9]
 * Histogram = MACD_line - Signal_line
 * 
 * Outputs three values: MACD line, Signal line, Histogram
 */

import { createEMAState, updateEMA, getEMAValue, calculateEMAReference } from './ema.js';

export function createMACDState(fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    return {
        fastPeriod,
        slowPeriod,
        signalPeriod,
        fastEMA: createEMAState(fastPeriod),
        slowEMA: createEMAState(slowPeriod),
        signalEMA: createEMAState(signalPeriod),
        ready: false
    };
}

export function updateMACD(state, candle) {
    // Update fast and slow EMAs
    updateEMA(state.fastEMA, candle);
    updateEMA(state.slowEMA, candle);

    // Once both EMAs are ready, calculate MACD line and update signal EMA
    if (state.fastEMA.ready && state.slowEMA.ready) {
        const macdLine = getEMAValue(state.fastEMA) - getEMAValue(state.slowEMA);

        // Create a pseudo-candle for signal EMA (using MACD line as close)
        updateEMA(state.signalEMA, { close: macdLine });

        if (state.signalEMA.ready) {
            state.ready = true;
        }
    }
}

export function getMACDValues(state) {
    if (!state.ready) {
        return { macd: null, signal: null, histogram: null };
    }

    const macdLine = getEMAValue(state.fastEMA) - getEMAValue(state.slowEMA);
    const signalLine = getEMAValue(state.signalEMA);
    const histogram = macdLine - signalLine;

    return {
        macd: macdLine,
        signal: signalLine,
        histogram: histogram
    };
}

/**
 * Reference calculation for validation
 */
export function calculateMACDReference(candles, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (candles.length === 0) {
        return { macd: null, signal: null, histogram: null };
    }

    const fastEMA = calculateEMAReference(candles, fastPeriod);
    const slowEMA = calculateEMAReference(candles, slowPeriod);

    if (fastEMA === null || slowEMA === null) {
        return { macd: null, signal: null, histogram: null };
    }

    // Calculate MACD line for all candles
    const macdValues = [];
    const alphaFast = 2 / (fastPeriod + 1);
    const alphaSlow = 2 / (slowPeriod + 1);

    let emaFast = candles[0].close;
    let emaSlow = candles[0].close;

    for (let i = 0; i < candles.length; i++) {
        if (i > 0) {
            emaFast = alphaFast * candles[i].close + (1 - alphaFast) * emaFast;
            emaSlow = alphaSlow * candles[i].close + (1 - alphaSlow) * emaSlow;
        }
        macdValues.push(emaFast - emaSlow);
    }

    // Calculate signal line (EMA of MACD line)
    const alphaSignal = 2 / (signalPeriod + 1);
    let signalEMA = macdValues[0];

    for (let i = 1; i < macdValues.length; i++) {
        signalEMA = alphaSignal * macdValues[i] + (1 - alphaSignal) * signalEMA;
    }

    const macdLine = macdValues[macdValues.length - 1];
    const histogram = macdLine - signalEMA;

    return {
        macd: macdLine,
        signal: signalEMA,
        histogram: histogram
    };
}
