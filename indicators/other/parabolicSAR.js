/**
 * Parabolic SAR (Stop and Reverse)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * SAR is a trend-following indicator that provides entry/exit points.
 * 
 * Initialization:
 *   Determine initial trend from first few candles
 *   If uptrend: SAR_0 = recent low, EP = recent high
 *   If downtrend: SAR_0 = recent high, EP = recent low
 *   AF = af_start (typically 0.02)
 * 
 * For each candle:
 *   If uptrend:
 *     SAR_t = SAR_{t-1} + AF × (EP - SAR_{t-1})
 *     If new high: EP = new high, AF = min(AF + af_increment, max_AF)
 *     If Low_t < SAR_t: reverse to downtrend
 *   
 *   If downtrend:
 *     SAR_t = SAR_{t-1} - AF × (SAR_{t-1} - EP)
 *     If new low: EP = new low, AF = min(AF + af_increment, max_AF)
 *     If High_t > SAR_t: reverse to uptrend
 * 
 * Parameters:
 *   af_start = 0.02
 *   af_increment = 0.02
 *   max_AF = 0.2
 */

export function createPSARState(afStart = 0.02, maxAF = 0.2) {
    return {
        afStart,
        afIncrement: afStart,
        maxAF,
        sar: null,
        ep: null,  // Extreme Point
        af: afStart,
        isUptrend: null,
        candles: [],
        ready: false
    };
}

export function updatePSAR(state, candle) {
    state.candles.push({ ...candle });

    // Limit memory by keeping a sliding window of max 3 candles
    if (state.candles.length > 3) {
        state.candles.shift();
    }

    // Need at least 2 candles to initialize
    if (state.candles.length < 2) {
        return;
    }

    // Initialize on second candle
    if (state.sar === null) {
        const candle0 = state.candles[0];
        const candle1 = state.candles[1];

        // Determine initial trend
        if (candle1.close > candle0.close) {
            state.isUptrend = true;
            state.sar = candle0.low;
            state.ep = Math.max(candle0.high, candle1.high);
        } else {
            state.isUptrend = false;
            state.sar = candle0.high;
            state.ep = Math.min(candle0.low, candle1.low);
        }

        state.af = state.afStart;
        state.ready = true;
        return;
    }

    // Calculate new SAR
    let newSAR;

    if (state.isUptrend) {
        newSAR = state.sar + state.af * (state.ep - state.sar);

        // SAR must not be above prior two lows
        const prevCandle = state.candles[state.candles.length - 2];
        newSAR = Math.min(newSAR, prevCandle.low);
        if (state.candles.length > 2) {
            const prevPrevCandle = state.candles[state.candles.length - 3];
            newSAR = Math.min(newSAR, prevPrevCandle.low);
        }

        // Check for reversal
        if (candle.low < newSAR) {
            // Reverse to downtrend
            state.isUptrend = false;
            newSAR = state.ep;  // EP becomes new SAR
            state.ep = candle.low;
            state.af = state.afStart;
        } else {
            // Continue uptrend
            if (candle.high > state.ep) {
                state.ep = candle.high;
                state.af = Math.min(state.af + state.afIncrement, state.maxAF);
            }
        }
    } else {
        newSAR = state.sar - state.af * (state.sar - state.ep);

        // SAR must not be below prior two highs
        const prevCandle = state.candles[state.candles.length - 2];
        newSAR = Math.max(newSAR, prevCandle.high);
        if (state.candles.length > 2) {
            const prevPrevCandle = state.candles[state.candles.length - 3];
            newSAR = Math.max(newSAR, prevPrevCandle.high);
        }

        // Check for reversal
        if (candle.high > newSAR) {
            // Reverse to uptrend
            state.isUptrend = true;
            newSAR = state.ep;  // EP becomes new SAR
            state.ep = candle.high;
            state.af = state.afStart;
        } else {
            // Continue downtrend
            if (candle.low < state.ep) {
                state.ep = candle.low;
                state.af = Math.min(state.af + state.afIncrement, state.maxAF);
            }
        }
    }

    state.sar = newSAR;
}

export function getPSARValue(state) {
    return state.ready ? state.sar : null;
}

/**
 * Reference calculation for validation
 */
export function calculatePSARReference(candles, afStart = 0.02, maxAF = 0.2) {
    if (candles.length < 2) {
        return null;
    }

    // Initialize
    let isUptrend;
    let sar;
    let ep;
    let af = afStart;
    const afIncrement = afStart;

    if (candles[1].close > candles[0].close) {
        isUptrend = true;
        sar = candles[0].low;
        ep = Math.max(candles[0].high, candles[1].high);
    } else {
        isUptrend = false;
        sar = candles[0].high;
        ep = Math.min(candles[0].low, candles[1].low);
    }

    // Process remaining candles
    for (let i = 2; i < candles.length; i++) {
        const candle = candles[i];
        let newSAR;

        if (isUptrend) {
            newSAR = sar + af * (ep - sar);
            newSAR = Math.min(newSAR, candles[i - 1].low);
            if (i > 2) {
                newSAR = Math.min(newSAR, candles[i - 2].low);
            }

            if (candle.low < newSAR) {
                isUptrend = false;
                newSAR = ep;
                ep = candle.low;
                af = afStart;
            } else {
                if (candle.high > ep) {
                    ep = candle.high;
                    af = Math.min(af + afIncrement, maxAF);
                }
            }
        } else {
            newSAR = sar - af * (sar - ep);
            newSAR = Math.max(newSAR, candles[i - 1].high);
            if (i > 2) {
                newSAR = Math.max(newSAR, candles[i - 2].high);
            }

            if (candle.high > newSAR) {
                isUptrend = true;
                newSAR = ep;
                ep = candle.high;
                af = afStart;
            } else {
                if (candle.low < ep) {
                    ep = candle.low;
                    af = Math.min(af + afIncrement, maxAF);
                }
            }
        }

        sar = newSAR;
    }

    return sar;
}
