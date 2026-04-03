/**
 * Ultimate Oscillator
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * True Low (TL) = Min(Low, Previous Close)
 * True High (TH) = Max(High, Previous Close)
 * Buying Pressure (BP) = Close - TL
 * True Range (TR) = TH - TL
 * 
 * BPa = Sum(BP, 7) / Sum(TR, 7)
 * BPb = Sum(BP, 14) / Sum(TR, 14)
 * BPc = Sum(BP, 28) / Sum(TR, 28)
 * 
 * Ultimate Oscillator = 100 × (4×BPa + 2×BPb + BPc) / 7
 */

export function createUltimateState(period1 = 7, period2 = 14, period3 = 28) {
    return {
        period1,
        period2,
        period3,
        longestPeriod: Math.max(period1, period2, period3),
        prevClose: null,
        bpHistory: [],
        trHistory: [],
        ready: false
    };
}

export function updateUltimate(state, candle) {
    if (state.prevClose !== null) {
        // True Low and True High
        const tl = Math.min(candle.low, state.prevClose);
        const th = Math.max(candle.high, state.prevClose);
        
        // Buying Pressure and True Range
        const bp = candle.close - tl;
        const tr = th - tl;
        
        state.bpHistory.push(bp);
        state.trHistory.push(tr);
        
        // Keep array size constrained securely to longest period
        if (state.bpHistory.length > state.longestPeriod) {
            state.bpHistory.shift();
            state.trHistory.shift();
        }
        
        if (state.bpHistory.length === state.longestPeriod) {
            state.ready = true;
        }
    }
    
    state.prevClose = candle.close;
}

export function getUltimateValues(state) {
    if (!state.ready) {
        return null;
    }
    
    const sumBP1 = state.bpHistory.slice(-state.period1).reduce((acc, val) => acc + val, 0);
    const sumTR1 = state.trHistory.slice(-state.period1).reduce((acc, val) => acc + val, 0);
    
    const sumBP2 = state.bpHistory.slice(-state.period2).reduce((acc, val) => acc + val, 0);
    const sumTR2 = state.trHistory.slice(-state.period2).reduce((acc, val) => acc + val, 0);
    
    const sumBP3 = state.bpHistory.slice(-state.period3).reduce((acc, val) => acc + val, 0);
    const sumTR3 = state.trHistory.slice(-state.period3).reduce((acc, val) => acc + val, 0);
    
    const avg1 = sumTR1 === 0 ? 0 : (sumBP1 / sumTR1);
    const avg2 = sumTR2 === 0 ? 0 : (sumBP2 / sumTR2);
    const avg3 = sumTR3 === 0 ? 0 : (sumBP3 / sumTR3);
    
    const ultimate = 100 * ((4 * avg1) + (2 * avg2) + avg3) / 7;
    
    // Evaluate matrix direction -> Bullish when oversold zone breaking out (> 30 typically, or just < 30)
    let direction = 0;
    if (ultimate <= 30) {
        direction = 1; // Bullish convergence zone (Oversold)
    } else if (ultimate >= 70) {
        direction = -1; // Bearish convergence zone (Overbought)
    }
    
    return {
        ultimate,
        direction
    };
}
