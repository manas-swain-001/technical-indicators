/**
 * SMA (Simple Moving Average)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * SMA_t = (Close_{t-n+1} + Close_{t-n+2} + ... + Close_t) / n
 * 
 * Simple arithmetic mean of the last n closing prices.
 */

export function createSMAState(period = 20) {
    return {
        period,
        prices: [],
        ready: false
    };
}

export function updateSMA(state, candle) {
    state.prices.push(candle.close);

    // Keep only the required number of prices
    if (state.prices.length > state.period) {
        state.prices.shift();
    }

    if (state.prices.length === state.period) {
        state.ready = true;
    }
}

export function getSMAValue(state) {
    if (!state.ready) {
        return null;
    }

    const sum = state.prices.reduce((acc, price) => acc + price, 0);
    return sum / state.period;
}

/**
 * Reference calculation for validation
 */
export function calculateSMAReference(candles, period) {
    if (candles.length < period) {
        return null;
    }

    let sum = 0;
    for (let i = candles.length - period; i < candles.length; i++) {
        sum += candles[i].close;
    }

    return sum / period;
}
