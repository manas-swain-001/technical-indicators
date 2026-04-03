/**
 * WMA (Weighted Moving Average)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * WMA_t = (Close_{t-n+1} × 1 + Close_{t-n+2} × 2 + ... + Close_t × n) / (1 + 2 + ... + n)
 * 
 * Denominator = n × (n + 1) / 2
 * 
 * More recent prices get higher weights (linear weighting).
 */

export function createWMAState(period = 9) {
    return {
        period,
        prices: [],
        denominator: (period * (period + 1)) / 2,
        ready: false
    };
}

export function updateWMA(state, candle) {
    state.prices.push(candle.close);

    // Keep only the required number of prices
    if (state.prices.length > state.period) {
        state.prices.shift();
    }

    if (state.prices.length === state.period) {
        state.ready = true;
    }
}

export function getWMAValue(state) {
    if (!state.ready) {
        return null;
    }

    let weightedSum = 0;
    for (let i = 0; i < state.period; i++) {
        const weight = i + 1; // Weight increases from 1 to period
        weightedSum += state.prices[i] * weight;
    }

    return weightedSum / state.denominator;
}

/**
 * Reference calculation for validation
 */
export function calculateWMAReference(candles, period) {
    if (candles.length < period) {
        return null;
    }

    const denominator = (period * (period + 1)) / 2;
    let weightedSum = 0;

    for (let i = 0; i < period; i++) {
        const weight = i + 1;
        const candleIndex = candles.length - period + i;
        weightedSum += candles[candleIndex].close * weight;
    }

    return weightedSum / denominator;
}
