/**
 * RVI (Relative Vigor Index)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * Numerator (Num) = (Close_0 - Open_0) + 2*(Close_1 - Open_1) + 2*(Close_2 - Open_2) + (Close_3 - Open_3) / 6
 * Denominator (Den) = (High_0 - Low_0) + 2*(High_1 - Low_1) + 2*(High_2 - Low_2) + (High_3 - Low_3) / 6
 * 
 * RVI = SMA(Num, period) / SMA(Den, period)
 * RVI Signal = (RVI_0 + 2*RVI_1 + 2*RVI_2 + RVI_3) / 6
 */

import { createSMAState, updateSMA, getSMAValue } from '../trend/sma.js';

export function createRVIState(period = 10) {
    return {
        period,
        candles: [], // Need exactly history of 4 candles to compute symmetric weights
        smaNum: createSMAState(period),
        smaDen: createSMAState(period),
        rviValues: [], // Need exactly historical 4 RVIs to compute signal
        ready: false
    };
}

export function updateRVI(state, candle) {
    state.candles.push(candle);
    
    // Manage strict memory bounds (exactly 4 needed)
    if (state.candles.length > 4) {
        state.candles.shift();
    }
    
    // We can only compute the 4-period symmetric weight once we have 4 candles
    if (state.candles.length === 4) {
        const c3 = state.candles[0]; // Oldest
        const c2 = state.candles[1];
        const c1 = state.candles[2];
        const c0 = state.candles[3]; // Current

        const num = ((c0.close - c0.open) + 2*(c1.close - c1.open) + 2*(c2.close - c2.open) + (c3.close - c3.open)) / 6;
        const den = ((c0.high - c0.low) + 2*(c1.high - c1.low) + 2*(c2.high - c2.low) + (c3.high - c3.low)) / 6;
        
        // Pass strictly into our discrete SMA pipelines
        updateSMA(state.smaNum, { close: num });
        updateSMA(state.smaDen, { close: den });
        
        if (state.smaNum.ready && state.smaDen.ready) {
            const rawNum = getSMAValue(state.smaNum);
            const rawDen = getSMAValue(state.smaDen);
            
            const rvi = rawDen !== 0 ? (rawNum / rawDen) : 0;
            
            state.rviValues.push(rvi);
            if (state.rviValues.length > 4) {
                state.rviValues.shift();
            }
            
            // The pipeline fully matures when we have 4 RVI elements for the final signal SMA
            if (state.rviValues.length === 4) {
                state.ready = true;
            }
        }
    }
}

export function getRVIValues(state) {
    if (!state.ready) {
        return null;
    }
    
    // Map strictly
    const rvi3 = state.rviValues[0];
    const rvi2 = state.rviValues[1];
    const rvi1 = state.rviValues[2];
    const rvi0 = state.rviValues[3];
    
    const rvi = rvi0;
    const signal = (rvi0 + (2 * rvi1) + (2 * rvi2) + rvi3) / 6;
    
    // Matrix -> Bullish if RVI > Signal
    let direction = 0;
    if (rvi > signal) {
        direction = 1;
    } else if (rvi < signal) {
        direction = -1;
    }
    
    return {
        rvi,
        signal,
        direction
    };
}
