/**
 * STC (Schaff Trend Cycle)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * MACD = EMA(Close, fast_length) - EMA(Close, slow_length)
 * 
 * %K1 = 100 × (MACD - Lowest(MACD, cycle)) / (Highest(MACD, cycle) - Lowest(MACD, cycle))
 * %D1 = EMA(%K1, smooth) (Often just smoothed continuously using traditional factor)
 * 
 * %K2 = 100 × (%D1 - Lowest(%D1, cycle)) / (Highest(%D1, cycle) - Lowest(%D1, cycle))
 * STC = EMA(%K2, smooth)
 * 
 * Boundary conditions: If Highest = Lowest, output stays identical to previous state.
 */

import { createEMAState, updateEMA, getEMAValue } from '../trend/ema.js';

export function createSTCState(fast = 23, slow = 50, cycle = 10, smooth = 3) {
    return {
        fast,
        slow,
        cycle,
        smooth,
        fastEMA: createEMAState(fast),
        slowEMA: createEMAState(slow),
        macdHistory: [],
        d1History: [],
        smoothedD1: null,
        stc: null,
        ready: false
    };
}

export function updateSTC(state, candle) {
    // 1. Core MACD processing
    updateEMA(state.fastEMA, candle);
    updateEMA(state.slowEMA, candle);
    
    if (state.fastEMA.ready && state.slowEMA.ready) {
        const macd = getEMAValue(state.fastEMA) - getEMAValue(state.slowEMA);
        
        state.macdHistory.push(macd);
        if (state.macdHistory.length > state.cycle) {
            state.macdHistory.shift();
        }
        
        // 2. First Stochastic Layer over MACD
        if (state.macdHistory.length === state.cycle) {
            const highestMacd = Math.max(...state.macdHistory);
            const lowestMacd = Math.min(...state.macdHistory);
            
            let k1 = 0;
            if (highestMacd !== lowestMacd) {
                k1 = 100 * (macd - lowestMacd) / (highestMacd - lowestMacd);
            } else if (state.smoothedD1 !== null) {
                k1 = state.smoothedD1; // Extrapolate bounds safely
            }
            
            // EMA smooth %K1 to get %D1
            const smoothFactor = 2 / (state.smooth + 1);
            if (state.smoothedD1 === null) {
                state.smoothedD1 = k1;
            } else {
                state.smoothedD1 = smoothFactor * k1 + (1 - smoothFactor) * state.smoothedD1;
            }
            
            state.d1History.push(state.smoothedD1);
            if (state.d1History.length > state.cycle) {
                state.d1History.shift();
            }
            
            // 3. Second Stochastic Layer over %D1 (Creates the actual Schaff Cycle)
            if (state.d1History.length === state.cycle) {
                const highestD1 = Math.max(...state.d1History);
                const lowestD1 = Math.min(...state.d1History);
                
                let k2 = 0;
                if (highestD1 !== lowestD1) {
                    k2 = 100 * (state.smoothedD1 - lowestD1) / (highestD1 - lowestD1);
                } else if (state.stc !== null) {
                    k2 = state.stc;
                }
                
                // EMA smooth %K2 to get final STC
                if (state.stc === null) {
                    state.stc = k2;
                } else {
                    state.stc = smoothFactor * k2 + (1 - smoothFactor) * state.stc;
                }
                
                state.ready = true;
            }
        }
    }
}

export function getSTCValues(state) {
    if (!state.ready) {
        return null;
    }
    
    const stc = state.stc;
    
    // Matrix Evaluation
    // Overbought > 75, Oversold < 25 (Standard STC trigger zones)
    let direction = 0;
    if (stc <= 25) {
        direction = 1; // Bullish convergence zone
    } else if (stc >= 75) {
        direction = -1; // Bearish convergence zone
    }
    
    return {
        stc,
        direction
    };
}
