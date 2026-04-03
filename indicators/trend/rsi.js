/**
 * RSI (Relative Strength Index) - Wilder's Method
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * Gain_t = max(Close_t - Close_{t-1}, 0)
 * Loss_t = max(Close_{t-1} - Close_t, 0)
 * 
 * Initial (first 14 periods):
 *   AvgGain_14 = SUM(Gains[1..14]) / 14
 *   AvgLoss_14 = SUM(Losses[1..14]) / 14
 * 
 * Subsequent periods (Wilder's smoothing, α = 1/14):
 *   AvgGain_t = ((AvgGain_{t-1} × 13) + Gain_t) / 14
 *   AvgLoss_t = ((AvgLoss_{t-1} × 13) + Loss_t) / 14
 * 
 * RS = AvgGain / AvgLoss
 * RSI = 100 - (100 / (1 + RS))
 * 
 * Boundary conditions:
 *   If AvgLoss = 0: RSI = 100
 *   If AvgGain = 0: RSI = 0
 */

export function createRSIState(period = 14) {
    return {
        period,
        prevClose: null,
        tickCount: 0,
        sumGain: 0,
        sumLoss: 0,
        avgGain: null,
        avgLoss: null,
        ready: false
    };
}

export function updateRSI(state, candle) {
    if (state.prevClose === null) {
        state.prevClose = candle.close;
        return;
    }

    const change = candle.close - state.prevClose;
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    state.prevClose = candle.close;

    if (!state.ready) {
        state.tickCount++;
        state.sumGain += gain;
        state.sumLoss += loss;

        // Initial period: calculate initial SMA of gains and losses
        if (state.tickCount === state.period) {
            state.avgGain = state.sumGain / state.period;
            state.avgLoss = state.sumLoss / state.period;
            state.ready = true;
        }
    } else {
        // Subsequent periods: Wilder's smoothing
        state.avgGain = ((state.avgGain * (state.period - 1)) + gain) / state.period;
        state.avgLoss = ((state.avgLoss * (state.period - 1)) + loss) / state.period;
    }
}

export function getRSIValue(state) {
    if (!state.ready) {
        return null;
    }

    // Handle division by zero
    if (state.avgLoss === 0) {
        return 100;
    }

    if (state.avgGain === 0) {
        return 0;
    }

    const rs = state.avgGain / state.avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
}

/**
 * Reference calculation for validation
 */
export function calculateRSIReference(candles, period = 14) {
    if (candles.length < period + 1) {
        return null;
    }

    // Calculate all gains and losses
    const gains = [];
    const losses = [];

    for (let i = 1; i < candles.length; i++) {
        const change = candles[i].close - candles[i - 1].close;
        gains.push(Math.max(change, 0));
        losses.push(Math.max(-change, 0));
    }

    // Initial average
    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 0; i < period; i++) {
        avgGain += gains[i];
        avgLoss += losses[i];
    }

    avgGain /= period;
    avgLoss /= period;

    // Wilder's smoothing for remaining periods
    for (let i = period; i < gains.length; i++) {
        avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
        avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    }

    // Calculate final RSI
    if (avgLoss === 0) {
        return 100;
    }

    if (avgGain === 0) {
        return 0;
    }

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}
