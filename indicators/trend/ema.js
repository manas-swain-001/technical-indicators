/**
 * EMA (Exponential Moving Average)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * α = 2 / (n + 1)  [smoothing factor]
 * 
 * EMA_1 = Close_1  [or can use SMA of first n values]
 * EMA_t = α × Close_t + (1 - α) × EMA_{t-1}
 * 
 * Alternative recursive form:
 * EMA_t = EMA_{t-1} + α × (Close_t - EMA_{t-1})
 */

export function createEMAState(period = 9) {
    return {
        period,
        alpha: 2 / (period + 1),
        ema: null,
        ready: false
    };
}

export function updateEMA(state, candle) {
    if (state.ema === null) {
        // Initialize with first close price
        state.ema = candle.close;
        state.ready = true;
    } else {
        // Exponential smoothing
        state.ema = state.alpha * candle.close + (1 - state.alpha) * state.ema;
    }
}

export function getEMAValue(state) {
    return state.ready ? state.ema : null;
}

/**
 * Reference calculation for validation
 */
export function calculateEMAReference(candles, period = 9) {
    if (candles.length === 0) {
        return null;
    }

    const alpha = 2 / (period + 1);
    let ema = candles[0].close;

    for (let i = 1; i < candles.length; i++) {
        ema = alpha * candles[i].close + (1 - alpha) * ema;
    }

    return ema;
}
