/**
 * VWMA (Volume Weighted Moving Average)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * VWMA_n = Σ(Close_i × Volume_i) / Σ(Volume_i)
 * 
 * Weighs prices by their trading volume over a specified period.
 */

export function createVWMAState(period = 20) {
    return {
        period,
        buffer: [], // stores { price, volume }
        sumPriceVol: 0,
        sumVol: 0,
        ready: false
    };
}

export function updateVWMA(state, candle) {
    // Basic validation to protect against missing volume data
    const volume = candle.volume || 0;
    const price = candle.close;

    state.buffer.push({ price, volume });
    state.sumPriceVol += (price * volume);
    state.sumVol += volume;

    // Maintain strict sliding window
    if (state.buffer.length > state.period) {
        const removed = state.buffer.shift();
        state.sumPriceVol -= (removed.price * removed.volume);
        state.sumVol -= removed.volume;
    }

    if (state.buffer.length === state.period) {
        state.ready = true;
    }
}

export function getVWMAValue(state) {
    if (!state.ready || state.sumVol === 0) {
        return null;
    }

    return state.sumPriceVol / state.sumVol;
}

/**
 * Reference calculation for validation
 */
export function calculateVWMAReference(candles, period = 20) {
    if (candles.length < period) {
        return null;
    }

    let sumPriceVol = 0;
    let sumVol = 0;

    for (let i = 0; i < period; i++) {
        const candleIndex = candles.length - period + i;
        const volume = candles[candleIndex].volume || 0;
        sumPriceVol += candles[candleIndex].close * volume;
        sumVol += volume;
    }

    if (sumVol === 0) return null;
    return sumPriceVol / sumVol;
}
