/**
 * BoP (Balance of Power)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * BoP = (Close - Open) / (High - Low)
 */

export function createBOPState() {
    return {
        bop: null,
        ready: false
    };
}

export function updateBOP(state, candle) {
    const range = candle.high - candle.low;
    state.bop = range === 0 ? 0 : (candle.close - candle.open) / range;
    state.ready = true;
}

export function getBOPValues(state) {
    if (!state.ready) {
        return null;
    }
    
    const bop = state.bop;
    let direction = 0; // Flat close (Doji behavior)
    if (bop > 0) direction = 1;
    else if (bop < 0) direction = -1;
    
    return {
        bop,
        direction
    };
}
