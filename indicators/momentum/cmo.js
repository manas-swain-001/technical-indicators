/**
 * CMO (Chande Momentum Oscillator)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * CMO = 100 × (SumUp - SumDown) / (SumUp + SumDown)
 */

export function createCMOState(period = 14) {
    return {
        period,
        prevClose: null,
        ups: [],
        downs: [],
        ready: false
    };
}

export function updateCMO(state, candle) {
    if (state.prevClose !== null) {
        const diff = candle.close - state.prevClose;
        state.ups.push(Math.max(diff, 0));
        state.downs.push(Math.max(-diff, 0));
        
        if (state.ups.length > state.period) {
            state.ups.shift();
            state.downs.shift();
        }
        
        if (state.ups.length === state.period) {
            state.ready = true;
        }
    }
    
    state.prevClose = candle.close;
}

export function getCMOValues(state) {
    if (!state.ready) {
        return null;
    }
    
    const sumUp = state.ups.reduce((a, b) => a + b, 0);
    const sumDown = state.downs.reduce((a, b) => a + b, 0);
    
    const total = sumUp + sumDown;
    const cmo = total === 0 ? 0 : 100 * (sumUp - sumDown) / total;
    
    let direction = 0;
    if (cmo <= -50) direction = 1; // Approaching Oversold
    else if (cmo >= 50) direction = -1; // Approaching Overbought
    
    return {
        cmo,
        direction
    };
}
