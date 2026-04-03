/**
 * DEMA (Double Exponential Moving Average)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * DEMA = 2 * EMA(Close, n) - EMA(EMA(Close, n), n)
 * 
 * It reduces lag compared to a traditional EMA.
 */

import { createEMAState, updateEMA, getEMAValue } from './ema.js';

export function createDEMAState(period = 9) {
    return {
        period,
        innerEMA: createEMAState(period),
        outerEMA: createEMAState(period),
        ready: false
    };
}

export function updateDEMA(state, candle) {
    updateEMA(state.innerEMA, candle);

    if (state.innerEMA.ready) {
        const ema1 = getEMAValue(state.innerEMA);
        // Feed the first EMA output securely as the "close" for the second EMA
        updateEMA(state.outerEMA, { close: ema1 });

        if (state.outerEMA.ready) {
            state.ready = true;
        }
    }
}

export function getDEMAValue(state) {
    if (!state.ready) {
        return null;
    }

    const ema1 = getEMAValue(state.innerEMA);
    const ema2 = getEMAValue(state.outerEMA);

    return (2 * ema1) - ema2;
}

/**
 * Reference calculation for validation
 */
export function calculateDEMAReference(candles, period = 9) {
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
    for (let i = 1; i < ema1Values.length; i++) {
        ema2 = alpha * ema1Values[i] + (1 - alpha) * ema2;
    }

    // 3. Final calculation
    return (2 * ema1) - ema2;
}
