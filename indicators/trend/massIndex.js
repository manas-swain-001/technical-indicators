/**
 * Mass Index
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * HighLow = High - Low
 * EMA1 = EMA(HighLow, 9)
 * EMA2 = EMA(EMA1, 9)
 * Mass Ratio = EMA1 / EMA2
 * Mass Index = Sum(Mass Ratio, 25)
 */

import { createEMAState, updateEMA, getEMAValue } from './ema.js';

export function createMassIndexState(emaPeriod = 9, sumPeriod = 25) {
    return {
        sumPeriod,
        ema1: createEMAState(emaPeriod),
        ema2: createEMAState(emaPeriod),
        ratioHistory: [],
        ready: false
    };
}

export function updateMassIndex(state, candle) {
    const hl = candle.high - candle.low;
    
    updateEMA(state.ema1, { close: hl });
    
    if (state.ema1.ready) {
        const ema1Val = getEMAValue(state.ema1);
        updateEMA(state.ema2, { close: ema1Val });
        
        if (state.ema2.ready) {
            const ema2Val = getEMAValue(state.ema2);
            
            const ratio = ema2Val === 0 ? 0 : (ema1Val / ema2Val);
            state.ratioHistory.push(ratio);
            
            if (state.ratioHistory.length > state.sumPeriod) {
                state.ratioHistory.shift();
            }
            
            if (state.ratioHistory.length === state.sumPeriod) {
                state.ready = true;
            }
        }
    }
}

export function getMassIndexValues(state) {
    if (!state.ready) {
        return null;
    }
    
    const massIndex = state.ratioHistory.reduce((a, b) => a + b, 0);
    
    let direction = 0; // Normal
    if (massIndex >= 27) { // Standard Reversal Bulge Threshold
        direction = -1; // Indicates volatile reversal bulge
    } else if (massIndex <= 26.5) {
        // Safe threshold
        direction = 1; 
    }
    
    return {
        massIndex,
        direction
    };
}
