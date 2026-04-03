/**
 * Momentum
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * MOM_t = Close_t - Close_{t-n}
 * 
 * Simple price difference over period.
 */

export function createMomentumState(period = 10) {
    return {
        period,
        prices: [],
        ready: false
    };
}

export function updateMomentum(state, candle) {
    state.prices.push(candle.close);

    if (state.prices.length > state.period + 1) {
        state.prices.shift();
    }

    if (state.prices.length === state.period + 1) {
        state.ready = true;
    }
}

export function getMomentumValue(state) {
    if (!state.ready) {
        return null;
    }

    const currentPrice = state.prices[state.prices.length - 1];
    const oldPrice = state.prices[0];

    return currentPrice - oldPrice;
}

/**
 * Reference calculation for validation
 */
export function calculateMomentumReference(candles, period = 10) {
    if (candles.length < period + 1) {
        return null;
    }

    const currentPrice = candles[candles.length - 1].close;
    const oldPrice = candles[candles.length - 1 - period].close;

    return currentPrice - oldPrice;
}
