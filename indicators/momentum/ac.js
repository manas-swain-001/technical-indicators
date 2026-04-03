/**
 * AC (Accelerator Oscillator)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * AC = AO - SMA(AO, 5)
 */

import { createAOState, updateAO, getAOValues } from './ao.js';
import { createSMAState, updateSMA, getSMAValue } from '../trend/sma.js';

export function createACState(fast = 5, slow = 34, smooth = 5) {
    return {
        aoState: createAOState(fast, slow),
        acSma: createSMAState(smooth),
        ready: false
    };
}

export function updateAC(state, candle) {
    updateAO(state.aoState, candle);
    
    if (state.aoState.ready) {
        const aoVal = getAOValues(state.aoState).ao;
        updateSMA(state.acSma, { close: aoVal });
        
        if (state.acSma.ready) {
            state.ready = true;
        }
    }
}

export function getACValues(state) {
    if (!state.ready) {
        return null;
    }
    
    const aoVal = getAOValues(state.aoState).ao;
    const acSmaVal = getSMAValue(state.acSma);
    
    const ac = aoVal - acSmaVal;
    let direction = 0;
    if (ac > 0) direction = 1; // Bulls accelerating
    else if (ac < 0) direction = -1; // Bears accelerating
    
    return {
        ac,
        direction
    };
}
