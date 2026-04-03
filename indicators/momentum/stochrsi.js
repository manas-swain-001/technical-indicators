/**
 * StochRSI (Stochastic RSI)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * Applies the Stochastic Oscillator formula directly to the RSI values rather than standard price data.
 * 
 * StochRSI = 100 * (RSI - Lowest_RSI) / (Highest_RSI - Lowest_RSI)
 */

import { createRSIState, updateRSI, getRSIValue } from '../trend/rsi.js';
import { createStochasticState, updateStochastic, getStochasticValues } from './stochastic.js';

export function createStochRSIState(rsiPeriod = 14, stochPeriod = 14, kSmoothing = 3, dPeriod = 3) {
    return {
        rsiState: createRSIState(rsiPeriod),
        stochState: createStochasticState(stochPeriod, kSmoothing, dPeriod),
        ready: false
    };
}

export function updateStochRSI(state, candle) {
    // 1. Evaluate standard RSI based on candle
    updateRSI(state.rsiState, candle);

    if (state.rsiState.ready) {
        const rsiVal = getRSIValue(state.rsiState);
        
        // 2. Feed the RSI point as a 1D asset price into Stochastic matrix
        const rsiCandle = {
            high: rsiVal,
            low: rsiVal,
            close: rsiVal
        };

        updateStochastic(state.stochState, rsiCandle);
        
        if (state.stochState.ready) {
            state.ready = true;
        }
    }
}

export function getStochRSIValues(state) {
    if (!state.ready) {
        return { k: null, d: null, signal: 0 };
    }
    
    return getStochasticValues(state.stochState);
}
