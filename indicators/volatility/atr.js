/**
 * ATR (Average True Range) - Wilder's Method
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * TR_t = max(
 *   High_t - Low_t,
 *   |High_t - Close_{t-1}|,
 *   |Low_t - Close_{t-1}|
 * )
 * 
 * Initial ATR (first 14 periods):
 *   ATR_14 = SUM(TR[1..14]) / 14
 * 
 * Subsequent periods (Wilder's smoothing, α = 1/14):
 *   ATR_t = ((ATR_{t-1} × 13) + TR_t) / 14
 * 
 * Alternative form:
 *   ATR_t = ATR_{t-1} - (ATR_{t-1} / 14) + (TR_t / 14)
 */

export function createATRState(period = 14) {
    return {
        period,
        tickCount: 0,
        sumTR: 0,
        prevClose: null,
        atr: null,
        ready: false
    };
}

export function updateATR(state, candle) {
    let tr;

    if (state.prevClose === null) {
        // First candle: TR is simply high - low
        tr = candle.high - candle.low;
    } else {
        // True Range calculation
        const hl = candle.high - candle.low;
        const hc = Math.abs(candle.high - state.prevClose);
        const lc = Math.abs(candle.low - state.prevClose);

        tr = Math.max(hl, hc, lc);
    }

    state.prevClose = candle.close;

    if (!state.ready) {
        state.tickCount++;
        state.sumTR += tr;

        // Initial period: calculate SMA of TR
        if (state.tickCount === state.period) {
            state.atr = state.sumTR / state.period;
            state.ready = true;
        }
    } else {
        // Subsequent periods: Wilder's smoothing
        state.atr = ((state.atr * (state.period - 1)) + tr) / state.period;
    }
}

export function getATRValue(state) {
    return state.ready ? state.atr : null;
}

/**
 * Reference calculation for validation
 */
export function calculateATRReference(candles, period = 14) {
    if (candles.length < period) {
        return null;
    }

    const trValues = [];

    for (let i = 0; i < candles.length; i++) {
        let tr;

        if (i === 0) {
            tr = candles[i].high - candles[i].low;
        } else {
            const hl = candles[i].high - candles[i].low;
            const hc = Math.abs(candles[i].high - candles[i - 1].close);
            const lc = Math.abs(candles[i].low - candles[i - 1].close);
            tr = Math.max(hl, hc, lc);
        }

        trValues.push(tr);
    }

    // Initial average
    let atr = 0;
    for (let i = 0; i < period; i++) {
        atr += trValues[i];
    }
    atr /= period;

    // Wilder's smoothing for remaining periods
    for (let i = period; i < trValues.length; i++) {
        atr = ((atr * (period - 1)) + trValues[i]) / period;
    }

    return atr;
}
