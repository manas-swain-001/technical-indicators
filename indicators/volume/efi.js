/**
 * EFI (Elder's Force Index)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * Force = (Close - Previous Close) × Volume
 * EFI = EMA(Force, 13)
 */

import { createEMAState, updateEMA, getEMAValue } from '../trend/ema.js';

export function createEFIState(period = 13) {
    return {
        prevClose: null,
        forceEma: createEMAState(period),
        ready: false
    };
}

export function updateEFI(state, candle) {
    if (state.prevClose !== null) {
        const dClose = candle.close - state.prevClose;
        const volume = candle.volume !== null && candle.volume !== undefined ? candle.volume : 1; 
        
        const force = dClose * volume;
        updateEMA(state.forceEma, { close: force });
        
        if (state.forceEma.ready) {
            state.ready = true;
        }
    }
    
    state.prevClose = candle.close;
}

export function getEFIValues(state) {
    if (!state.ready) {
        return null;
    }
    
    const efi = getEMAValue(state.forceEma);
    let direction = 0;
    
    if (efi > 0) direction = 1; // Bullish force
    else if (efi < 0) direction = -1; // Bearish force
    
    return {
        efi,
        direction
    };
}
