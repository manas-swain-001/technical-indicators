/**
 * Stochastic Oscillator
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * %K = 100 × (Close - Lowest_low) / (Highest_high - Lowest_low)
 * 
 * Where:
 *   Lowest_low = min(Low) over k_period    [typically 14]
 *   Highest_high = max(High) over k_period
 * 
 * %D = SMA(%K, d_period)    [typically 3]
 * 
 * Boundary conditions:
 *   If Highest_high = Lowest_low: %K = 50
 */

import { createSMAState, updateSMA, getSMAValue } from '../trend/sma.js';

export function createStochasticState(kPeriod = 14, dPeriod = 3) {
    return {
        kPeriod,
        dPeriod,
        highs: [],
        lows: [],
        closes: [],
        kValues: [],
        dState: createSMAState(dPeriod),
        ready: false
    };
}

export function updateStochastic(state, candle) {
    state.highs.push(candle.high);
    state.lows.push(candle.low);
    state.closes.push(candle.close);

    // Keep only required candles
    if (state.highs.length > state.kPeriod) {
        state.highs.shift();
        state.lows.shift();
        state.closes.shift();
    }

    // Calculate %K once we have enough data
    if (state.highs.length === state.kPeriod) {
        const highestHigh = Math.max(...state.highs);
        const lowestLow = Math.min(...state.lows);
        const close = state.closes[state.closes.length - 1];

        let kValue;
        if (highestHigh === lowestLow) {
            kValue = 50; // Boundary condition
        } else {
            kValue = 100 * (close - lowestLow) / (highestHigh - lowestLow);
        }

        state.kValues.push(kValue);

        // Update %D (SMA of %K)
        updateSMA(state.dState, { close: kValue });

        if (state.dState.ready) {
            state.ready = true;
        }
    }
}

export function getStochasticValues(state) {
    if (!state.ready) {
        return { k: null, d: null };
    }

    const k = state.kValues[state.kValues.length - 1];
    const d = getSMAValue(state.dState);

    return { k, d };
}

/**
 * Reference calculation for validation
 */
export function calculateStochasticReference(candles, kPeriod = 14, dPeriod = 3) {
    if (candles.length < kPeriod + dPeriod - 1) {
        return { k: null, d: null };
    }

    const kValues = [];

    for (let i = kPeriod - 1; i < candles.length; i++) {
        let highestHigh = -Infinity;
        let lowestLow = Infinity;

        for (let j = i - kPeriod + 1; j <= i; j++) {
            highestHigh = Math.max(highestHigh, candles[j].high);
            lowestLow = Math.min(lowestLow, candles[j].low);
        }

        const close = candles[i].close;
        let kValue;

        if (highestHigh === lowestLow) {
            kValue = 50;
        } else {
            kValue = 100 * (close - lowestLow) / (highestHigh - lowestLow);
        }

        kValues.push(kValue);
    }

    // Calculate %D (SMA of last dPeriod %K values)
    if (kValues.length < dPeriod) {
        return { k: null, d: null };
    }

    const k = kValues[kValues.length - 1];
    let dSum = 0;
    for (let i = kValues.length - dPeriod; i < kValues.length; i++) {
        dSum += kValues[i];
    }
    const d = dSum / dPeriod;

    return { k, d };
}
