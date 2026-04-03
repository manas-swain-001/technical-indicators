/**
 * Williams %R
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * %R = -100 × (Highest_high - Close) / (Highest_high - Lowest_low)
 * 
 * Where:
 *   Highest_high = max(High) over period    [typically 14]
 *   Lowest_low = min(Low) over period
 * 
 * Boundary conditions:
 *   If Highest_high = Lowest_low: %R = -50
 * 
 * Range: -100 to 0 (inverted scale compared to Stochastic)
 */

export function createWilliamsRState(period = 14) {
    return {
        period,
        highs: [],
        lows: [],
        closes: [],
        ready: false
    };
}

export function updateWilliamsR(state, candle) {
    state.highs.push(candle.high);
    state.lows.push(candle.low);
    state.closes.push(candle.close);

    // Keep only required candles
    if (state.highs.length > state.period) {
        state.highs.shift();
        state.lows.shift();
        state.closes.shift();
    }

    if (state.highs.length === state.period) {
        state.ready = true;
    }
}

export function getWilliamsRValue(state) {
    if (!state.ready) {
        return null;
    }

    const highestHigh = Math.max(...state.highs);
    const lowestLow = Math.min(...state.lows);
    const close = state.closes[state.closes.length - 1];

    // Boundary condition
    if (highestHigh === lowestLow) {
        return -50;
    }

    return -100 * (highestHigh - close) / (highestHigh - lowestLow);
}

/**
 * Reference calculation for validation
 */
export function calculateWilliamsRReference(candles, period = 14) {
    if (candles.length < period) {
        return null;
    }

    let highestHigh = -Infinity;
    let lowestLow = Infinity;

    for (let i = candles.length - period; i < candles.length; i++) {
        highestHigh = Math.max(highestHigh, candles[i].high);
        lowestLow = Math.min(lowestLow, candles[i].low);
    }

    const close = candles[candles.length - 1].close;

    if (highestHigh === lowestLow) {
        return -50;
    }

    return -100 * (highestHigh - close) / (highestHigh - lowestLow);
}
