/**
 * Psychological Line (Psy Line)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * PsyLine = 100 × (Up Days in Period) / Period
 */

export function createPsyLineState(period = 12) {
    return {
        period,
        prevClose: null,
        binaryCloses: [], // Stores 1 for up, 0 for down
        ready: false
    };
}

export function updatePsyLine(state, candle) {
    if (state.prevClose !== null) {
        const upDay = candle.close > state.prevClose ? 1 : 0;
        state.binaryCloses.push(upDay);
        
        if (state.binaryCloses.length > state.period) {
            state.binaryCloses.shift();
        }
        
        if (state.binaryCloses.length === state.period) {
            state.ready = true;
        }
    }
    
    state.prevClose = candle.close;
}

export function getPsyLineValues(state) {
    if (!state.ready) {
        return null;
    }
    
    const upDays = state.binaryCloses.reduce((a, b) => a + b, 0);
    const psy = (upDays / state.period) * 100;
    
    let direction = 0;
    if (psy > 50) direction = 1; // Bullish majority
    else if (psy < 50) direction = -1; // Bearish majority
    
    return {
        psy,
        direction
    };
}
