/**
 * TRIX
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * EMA1 = EMA(Close, period)
 * EMA2 = EMA(EMA1, period)
 * EMA3 = EMA(EMA2, period)
 * 
 * TRIX = 100 × (EMA3 - Previous EMA3) / Previous EMA3  -> (ROC of EMA3)
 */

import { createEMAState, updateEMA, getEMAValue } from './ema.js';

export function createTRIXState(period = 15) {
    return {
        ema1: createEMAState(period),
        ema2: createEMAState(period),
        ema3: createEMAState(period),
        prevEma3: null,
        trix: null,
        ready: false
    };
}

export function updateTRIX(state, candle) {
    updateEMA(state.ema1, candle);

    if (state.ema1.ready) {
        const v1 = getEMAValue(state.ema1);
        updateEMA(state.ema2, { close: v1 });

        if (state.ema2.ready) {
            const v2 = getEMAValue(state.ema2);
            updateEMA(state.ema3, { close: v2 });

            if (state.ema3.ready) {
                const v3 = getEMAValue(state.ema3);

                // Need at least 1 previous EMA3 value to evaluate Rate of Change
                if (state.prevEma3 !== null) {
                    state.trix = 10000 * (v3 - state.prevEma3) / state.prevEma3; // TradingView mathematically scales this by 10,000
                    state.ready = true;
                }

                state.prevEma3 = v3;
            }
        }
    }
}

export function getTRIXValues(state) {
    if (!state.ready) {
        return null;
    }

    let direction = 0;
    if (state.trix > 0) direction = 1; // Bullish momentum tracking
    else if (state.trix < 0) direction = -1; // Bearish momentum tracking

    return {
        trix: state.trix,
        direction
    };
}