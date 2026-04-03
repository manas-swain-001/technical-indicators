/**
 * Aroon Indicator
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * Aroon Up = ((period - Bars Since Highest High in period) / period) * 100
 * Aroon Down = ((period - Bars Since Lowest Low in period) / period) * 100
 * Aroon Oscillator = Aroon Up - Aroon Down
 */

export function createAroonState(period = 14) {
    return {
        period,
        highs: [],
        lows: [],
        ready: false
    };
}

export function updateAroon(state, candle) {
    state.highs.push(candle.high);
    state.lows.push(candle.low);
    
    // Aroon looks back over exactly `period` prior bars + the current bar (length = period + 1)
    if (state.highs.length > state.period + 1) {
        state.highs.shift();
        state.lows.shift();
    }
    
    if (state.highs.length === state.period + 1) {
        state.ready = true;
    }
}

export function getAroonValues(state) {
    if (!state.ready) {
        return null;
    }
    
    // Find highest high and lowest low
    let highest = -Infinity;
    let lowest = Infinity;
    let highestIdx = 0;
    let lowestIdx = 0;

    for (let i = 0; i < state.highs.length; i++) {
        // >= handles the case where there is a tie. 
        // Standard convention: use the MOST RECENT high/low (closest distance) 
        if (state.highs[i] >= highest) {
            highest = state.highs[i];
            highestIdx = i;
        }
        if (state.lows[i] <= lowest) {
            lowest = state.lows[i];
            lowestIdx = i;
        }
    }
    
    // Calculate distance (bars since extreme)
    const currentIdx = state.highs.length - 1;
    const barsSinceHigh = currentIdx - highestIdx;
    const barsSinceLow = currentIdx - lowestIdx;
    
    // Calculate Aroon math
    const aroonUp = ((state.period - barsSinceHigh) / state.period) * 100;
    const aroonDown = ((state.period - barsSinceLow) / state.period) * 100;
    
    const oscillator = aroonUp - aroonDown;
    
    // Calculate trend Matrix
    let direction = 0;
    if (oscillator > 0) {
        direction = 1; // Bullish
    } else if (oscillator < 0) {
        direction = -1; // Bearish
    }
    
    return {
        aroonUp,
        aroonDown,
        oscillator,
        direction
    };
}

/**
 * Reference calculation for validation
 */
export function calculateAroonReference(candles, period = 14) {
    if (candles.length <= period) {
        return null;
    }
    
    const currentIdx = candles.length - 1;
    
    let highest = -Infinity;
    let lowest = Infinity;
    let highestIdx = 0;
    let lowestIdx = 0;

    // Scan the window from currentIdx - period up to currentIdx inclusive 
    const startIdx = currentIdx - period;
    
    for (let i = startIdx; i <= currentIdx; i++) {
        if (candles[i].high >= highest) {
            highest = candles[i].high;
            highestIdx = i;
        }
        if (candles[i].low <= lowest) {
            lowest = candles[i].low;
            lowestIdx = i;
        }
    }
    
    const barsSinceHigh = currentIdx - highestIdx;
    const barsSinceLow = currentIdx - lowestIdx;
    
    const aroonUp = ((period - barsSinceHigh) / period) * 100;
    const aroonDown = ((period - barsSinceLow) / period) * 100;
    const oscillator = aroonUp - aroonDown;
    
    let direction = 0;
    if (oscillator > 0) direction = 1;
    else if (oscillator < 0) direction = -1;

    return { aroonUp, aroonDown, oscillator, direction };
}
