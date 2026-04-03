/**
 * ROC (Rate of Change)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * ROC_n = 100 × (Current_Close - Close_n_periods_ago) / Close_n_periods_ago
 * 
 * Measures percentage change in price between the current price and the price n periods ago.
 */

export function createROCState(period = 6) {
    return {
        period,
        closes: [],
        ready: false
    };
}

export function updateROC(state, candle) {
    state.closes.push(candle.close);

    // We need 'period + 1' candles to look back exactly 'period' bars
    if (state.closes.length > state.period + 1) {
        state.closes.shift();
    }

    if (state.closes.length === state.period + 1) {
        state.ready = true;
    }
}

export function getROCValues(state) {
    if (!state.ready) {
        return null;
    }

    const currentClose = state.closes[state.closes.length - 1];
    const pastClose = state.closes[0]; // The close 'period' bars ago

    // Core ROC Math
    const roc = 100 * (currentClose - pastClose) / pastClose;

    // Direction matrix
    let direction = 0;
    if (roc > 0) {
        direction = 1; // Bullish momentum (positive rate of change)
    } else if (roc < 0) {
        direction = -1; // Bearish momentum (negative rate of change)
    }

    return {
        roc,
        direction
    };
}

/**
 * Reference calculation for validation
 */
export function calculateROCReference(candles, period = 6) {
    if (candles.length <= period) {
        return null;
    }

    const currentClose = candles[candles.length - 1].close;
    const pastClose = candles[candles.length - 1 - period].close;

    const roc = 100 * (currentClose - pastClose) / pastClose;
    const direction = roc > 0 ? 1 : (roc < 0 ? -1 : 0);

    return { roc, direction };
}
