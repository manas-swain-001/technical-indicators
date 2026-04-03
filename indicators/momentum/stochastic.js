/**
 * Stochastic Oscillator (Fast & Slow)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * %K (Fast) = 100 × (Close - Lowest_low) / (Highest_high - Lowest_low)
 * %K (Slow) = SMA(%K (Fast), kSmoothing)
 * %D = SMA(%K (Slow), dPeriod)
 * 
 * Boundary conditions:
 *   If Highest_high = Lowest_low: %K = 50
 */

import { createSMAState, updateSMA, getSMAValue } from '../trend/sma.js';

export function createStochasticState(kPeriod = 14, kSmoothing = 3, dPeriod = 3) {
    return {
        kPeriod,
        kSmoothing,
        dPeriod,
        highs: [],
        lows: [],
        closes: [],
        rawKValues: [],
        smoothKState: createSMAState(kSmoothing),
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

    // Calculate Raw %K once we have enough window data
    if (state.highs.length === state.kPeriod) {
        const highestHigh = Math.max(...state.highs);
        const lowestLow = Math.min(...state.lows);
        const close = state.closes[state.closes.length - 1];

        let rawK;
        if (highestHigh === lowestLow) {
            rawK = 50; // Boundary condition
        } else {
            rawK = 100 * (close - lowestLow) / (highestHigh - lowestLow);
        }

        // Keep raw array from leaking memory limit
        state.rawKValues.push(rawK);
        if (state.rawKValues.length > Math.max(state.kSmoothing, state.dPeriod) * 2) {
            state.rawKValues.shift();
        }

        // Update %K Smoothing (Slow Stoch applies SMA over Raw %K)
        updateSMA(state.smoothKState, { close: rawK });

        if (state.smoothKState.ready) {
            // Apply smoothing for standard %K
            const finalK = getSMAValue(state.smoothKState);

            // Update %D (SMA of final %K)
            updateSMA(state.dState, { close: finalK });

            if (state.dState.ready) {
                state.ready = true;
            }
        }
    }
}

export function getStochasticValues(state) {
    if (!state.ready) {
        return { k: null, d: null, signal: 0 };
    }

    const k = getSMAValue(state.smoothKState);
    const d = getSMAValue(state.dState);

    // Matrix Evaluation: Bullish if %K > %D, Neutral 0 if inside nominal bounds, Overbought/Oversold extreme evaluation
    let signal = 0;
    if (k > d) signal = 1;      // Bullish Cross
    else if (k < d) signal = -1;// Bearish Cross

    return { k, d, signal };
}