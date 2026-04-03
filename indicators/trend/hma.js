/**
 * HMA (Hull Moving Average)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * HMA = WMA(2 * WMA(Close, n/2) - WMA(Close, n), sqrt(n))
 * 
 * It substantially reduces lag while remaining smooth by combining Weighted Moving Averages.
 */

import { createWMAState, updateWMA, getWMAValue } from './wma.js';

export function createHMAState(period = 9) {
    // Standard Hull calculations generally floor but occasionally round. Math.floor is safest for array/period indexing.
    const halfPeriod = Math.floor(period / 2);
    const sqrtPeriod = Math.floor(Math.sqrt(period));
    
    return {
        period,
        wma1: createWMAState(halfPeriod),
        wma2: createWMAState(period),
        wma3: createWMAState(sqrtPeriod),
        ready: false
    };
}

export function updateHMA(state, candle) {
    updateWMA(state.wma1, candle);
    updateWMA(state.wma2, candle);
    
    if (state.wma1.ready && state.wma2.ready) {
        const val1 = getWMAValue(state.wma1);
        const val2 = getWMAValue(state.wma2);
        
        const rawHMA = (2 * val1) - val2;
        
        // Feed the raw computation into the third smoothing WMA
        updateWMA(state.wma3, { close: rawHMA });
        
        if (state.wma3.ready) {
            state.ready = true;
        }
    }
}

export function getHMAValue(state) {
    if (!state.ready) {
        return null;
    }
    
    return getWMAValue(state.wma3);
}
