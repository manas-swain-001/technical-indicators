/**
 * TSI (True Strength Index)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * TSI = 100 × EMA(EMA(dClose, long_period), short_period) / EMA(EMA(|dClose|, long_period), short_period)
 * Where dClose = Current Close - Previous Close
 */

import { createEMAState, updateEMA, getEMAValue } from '../trend/ema.js';

export function createTSIState(longPeriod = 25, shortPeriod = 13) {
    return {
        longPeriod,
        shortPeriod,
        prevClose: null,
        // Double EMA states for raw price change (Numerator)
        emaNum1: createEMAState(longPeriod),
        emaNum2: createEMAState(shortPeriod),
        // Double EMA states for absolute price change (Denominator)
        emaDen1: createEMAState(longPeriod),
        emaDen2: createEMAState(shortPeriod),

        ready: false
    };
}

export function updateTSI(state, candle) {
    if (state.prevClose !== null) {
        const dClose = candle.close - state.prevClose;
        const absDClose = Math.abs(dClose);

        // 1. First layer of EMA (Long Period)
        updateEMA(state.emaNum1, { close: dClose });
        updateEMA(state.emaDen1, { close: absDClose });

        if (state.emaNum1.ready && state.emaDen1.ready) {
            const num1Val = getEMAValue(state.emaNum1);
            const den1Val = getEMAValue(state.emaDen1);

            // 2. Second layer of EMA (Short Period) fed with first layer outputs
            updateEMA(state.emaNum2, { close: num1Val });
            updateEMA(state.emaDen2, { close: den1Val });

            if (state.emaNum2.ready && state.emaDen2.ready) {
                state.ready = true;
            }
        }
    }

    state.prevClose = candle.close;
}

export function getTSIValues(state) {
    if (!state.ready) {
        return null;
    }

    const num = getEMAValue(state.emaNum2);
    const den = getEMAValue(state.emaDen2);

    let tsi = 0;
    if (den !== 0) {
        tsi = num / den; // Removed 100x multiplier to strictly map to TradingView/Dhan 0.0125 decimals
    }

    let direction = 0;
    if (tsi > 0) direction = 1;
    else if (tsi < 0) direction = -1;

    return {
        tsi,
        direction
    };
}