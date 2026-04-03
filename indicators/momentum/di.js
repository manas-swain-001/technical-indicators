/**
 * DI (Directional Indicator) -> +DI and -DI
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * +DI = 100 × RMA(+DM, period) / ATR(period)
 * -DI = 100 × RMA(-DM, period) / ATR(period)
 * 
 * It tracks the standalone bullish vs bearish pressure components.
 */

export function createDIState(period = 14) {
    return {
        period,
        prevHigh: null,
        prevLow: null,
        prevClose: null,
        tickCount: 0,
        sumPlusDM: 0,
        sumMinusDM: 0,
        sumTR: 0,
        smoothedPlusDM: null,
        smoothedMinusDM: null,
        smoothedTR: null,
        ready: false
    };
}

export function updateDI(state, candle) {
    let plusDM = 0;
    let minusDM = 0;
    let tr;

    if (state.prevHigh !== null) {
        // Calculate raw +DM and -DM moves
        const upMove = candle.high - state.prevHigh;
        const downMove = state.prevLow - candle.low;

        if (upMove > downMove && upMove > 0) {
            plusDM = upMove;
        }
        if (downMove > upMove && downMove > 0) {
            minusDM = downMove;
        }

        // Calculate True Range (TR)
        const hl = candle.high - candle.low;
        const hc = Math.abs(candle.high - state.prevClose);
        const lc = Math.abs(candle.low - state.prevClose);
        tr = Math.max(hl, hc, lc);
    } else {
        tr = candle.high - candle.low;
    }

    state.prevHigh = candle.high;
    state.prevLow = candle.low;
    state.prevClose = candle.close;

    if (state.smoothedTR === null) {
        state.tickCount++;
        state.sumPlusDM += plusDM;
        state.sumMinusDM += minusDM;
        state.sumTR += tr;

        // Wilder Initial Smoothing happens strictly when tickCount reaches period
        if (state.tickCount === state.period) {
            state.smoothedPlusDM = state.sumPlusDM / state.period;
            state.smoothedMinusDM = state.sumMinusDM / state.period;
            state.smoothedTR = state.sumTR / state.period;
            state.ready = true;
        }
    } else {
        // Continuous RMA (Wilder's Smoothing)
        state.smoothedPlusDM = ((state.smoothedPlusDM * (state.period - 1)) + plusDM) / state.period;
        state.smoothedMinusDM = ((state.smoothedMinusDM * (state.period - 1)) + minusDM) / state.period;
        state.smoothedTR = ((state.smoothedTR * (state.period - 1)) + tr) / state.period;
    }
}

export function getDIValues(state) {
    if (!state.ready || state.smoothedTR === 0) {
        return { plusDI: null, minusDI: null };
    }

    const plusDI = 100 * (state.smoothedPlusDM / state.smoothedTR);
    const minusDI = 100 * (state.smoothedMinusDM / state.smoothedTR);

    // Provide trend direction explicitly (1 = Bullish +DI dominates, -1 = Bearish -DI dominates)
    const direction = plusDI > minusDI ? 1 : (plusDI < minusDI ? -1 : 0);

    return {
        plusDI,
        minusDI,
        direction
    };
}
