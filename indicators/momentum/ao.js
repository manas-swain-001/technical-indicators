/**
 * AO (Awesome Oscillator)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * AO = SMA(HL2, 5) - SMA(HL2, 34)
 */

import { createSMAState, updateSMA, getSMAValue } from '../trend/sma.js';

export function createAOState(fast = 5, slow = 34) {
    return {
        smaFast: createSMAState(fast),
        smaSlow: createSMAState(slow),
        ready: false
    };
}

export function updateAO(state, candle) {
    const hl2 = (candle.high + candle.low) / 2;
    
    updateSMA(state.smaFast, { close: hl2 });
    updateSMA(state.smaSlow, { close: hl2 });
    
    if (state.smaSlow.ready) {
        state.ready = true;
    }
}

export function getAOValues(state) {
    if (!state.ready) {
        return null;
    }
    
    const ao = getSMAValue(state.smaFast) - getSMAValue(state.smaSlow);
    let direction = 0;
    if (ao > 0) direction = 1;
    else if (ao < 0) direction = -1;
    
    return {
        ao,
        direction
    };
}
