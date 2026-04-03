/**
 * TEMA (Triple Exponential Moving Average)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * TEMA = (3 * EMA1) - (3 * EMA2) + EMA3
 * 
 * Where:
 * EMA1 = EMA(Close, period)
 * EMA2 = EMA(EMA1, period)
 * EMA3 = EMA(EMA2, period)
 * 
 * TEMA reduces lag even further compared to DEMA.
 */

import { createEMAState, updateEMA, getEMAValue } from './ema.js';

export function createTEMAState(period = 9) {
    return {
        period,
        ema1: createEMAState(period),
        ema2: createEMAState(period),
        ema3: createEMAState(period),
        ready: false
    };
}

export function updateTEMA(state, candle) {
    // 1st layer EMA
    updateEMA(state.ema1, candle);

    if (state.ema1.ready) {
        const val1 = getEMAValue(state.ema1);

        // 2nd layer EMA uses output of 1st layer
        updateEMA(state.ema2, { close: val1 });

        if (state.ema2.ready) {
            const val2 = getEMAValue(state.ema2);

            // 3rd layer EMA uses output of 2nd layer
            updateEMA(state.ema3, { close: val2 });

            if (state.ema3.ready) {
                state.ready = true;
            }
        }
    }
}

export function getTEMAValue(state) {
    if (!state.ready) {
        return null;
    }

    const val1 = getEMAValue(state.ema1);
    const val2 = getEMAValue(state.ema2);
    const val3 = getEMAValue(state.ema3);

    return (3 * val1) - (3 * val2) + val3;
}

/**
 * Reference calculation for validation
 */
export function calculateTEMAReference(candles, period = 9) {
    if (candles.length === 0) {
        return null;
    }

    const alpha = 2 / (period + 1);

    // 1. Calculate the first layer of EMA
    let ema1 = candles[0].close;
    const ema1Values = [ema1];

    for (let i = 1; i < candles.length; i++) {
        ema1 = alpha * candles[i].close + (1 - alpha) * ema1;
        ema1Values.push(ema1);
    }

    // 2. Calculate the second layer of EMA
    let ema2 = ema1Values[0];
    const ema2Values = [ema2];

    for (let i = 1; i < ema1Values.length; i++) {
        ema2 = alpha * ema1Values[i] + (1 - alpha) * ema2;
        ema2Values.push(ema2);
    }

    // 3. Calculate the third layer of EMA
    let ema3 = ema2Values[0];
    for (let i = 1; i < ema2Values.length; i++) {
        ema3 = alpha * ema2Values[i] + (1 - alpha) * ema3;
    }

    // 4. Final calculation
    return (3 * ema1) - (3 * ema2) + ema3;
}
