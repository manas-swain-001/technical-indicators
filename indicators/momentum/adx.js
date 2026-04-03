/**
 * ADX (Average Directional Index) with +DI and -DI
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * Step 1: Calculate +DM and -DM
 *   UpMove = High_t - High_{t-1}
 *   DownMove = Low_{t-1} - Low_t
 *   
 *   +DM = UpMove if (UpMove > DownMove AND UpMove > 0), else 0
 *   -DM = DownMove if (DownMove > UpMove AND DownMove > 0), else 0
 * 
 * Step 2: Calculate Smoothed +DM, -DM, and TR (Wilder's smoothing)
 *   Smoothed_+DM = Wilder_EMA(+DM, period)
 *   Smoothed_-DM = Wilder_EMA(-DM, period)
 *   Smoothed_TR = Wilder_EMA(TR, period)
 * 
 * Step 3: Calculate +DI and -DI
 *   +DI = 100 × (Smoothed_+DM / Smoothed_TR)
 *   -DI = 100 × (Smoothed_-DM / Smoothed_TR)
 * 
 * Step 4: Calculate DX
 *   DX = 100 × |+DI - -DI| / (+DI + -DI)
 *   If (+DI + -DI) = 0: DX = 0
 * 
 * Step 5: Calculate ADX
 *   ADX = Wilder_EMA(DX, period)
 */

export function createADXState(period = 14) {
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
        dxTickCount: 0,
        sumDX: 0,
        adx: null,
        ready: false
    };
}

export function updateADX(state, candle) {
    let plusDM = 0;
    let minusDM = 0;
    let tr;

    if (state.prevHigh !== null) {
        // Calculate +DM and -DM
        const upMove = candle.high - state.prevHigh;
        const downMove = state.prevLow - candle.low;

        if (upMove > downMove && upMove > 0) {
            plusDM = upMove;
        }

        if (downMove > upMove && downMove > 0) {
            minusDM = downMove;
        }

        // Calculate TR
        const hl = candle.high - candle.low;
        const hc = Math.abs(candle.high - state.prevClose);
        const lc = Math.abs(candle.low - state.prevClose);
        tr = Math.max(hl, hc, lc);
    } else {
        // First candle
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

        // Initial smoothing
        if (state.tickCount === state.period) {
            state.smoothedPlusDM = state.sumPlusDM / state.period;
            state.smoothedMinusDM = state.sumMinusDM / state.period;
            state.smoothedTR = state.sumTR / state.period;
        }
    } else {
        // Subsequent smoothing (Wilder's method)
        state.smoothedPlusDM = ((state.smoothedPlusDM * (state.period - 1)) + plusDM) / state.period;
        state.smoothedMinusDM = ((state.smoothedMinusDM * (state.period - 1)) + minusDM) / state.period;
        state.smoothedTR = ((state.smoothedTR * (state.period - 1)) + tr) / state.period;
    }

    // Calculate DI and DX once we have smoothed values
    if (state.smoothedTR !== null && state.smoothedTR > 0) {
        const plusDI = 100 * (state.smoothedPlusDM / state.smoothedTR);
        const minusDI = 100 * (state.smoothedMinusDM / state.smoothedTR);

        let dx = 0;
        const diSum = plusDI + minusDI;
        if (diSum > 0) {
            dx = 100 * Math.abs(plusDI - minusDI) / diSum;
        }

        // Calculate ADX (smoothed DX)
        if (!state.ready) {
            state.dxTickCount++;
            state.sumDX += dx;
            if (state.dxTickCount === state.period) {
                state.adx = state.sumDX / state.period;
                state.ready = true;
            }
        } else {
            state.adx = ((state.adx * (state.period - 1)) + dx) / state.period;
        }
    }
}

export function getADXValues(state) {
    if (!state.ready || state.smoothedTR === 0) {
        return { adx: null, plusDI: null, minusDI: null };
    }

    const plusDI = 100 * (state.smoothedPlusDM / state.smoothedTR);
    const minusDI = 100 * (state.smoothedMinusDM / state.smoothedTR);

    return {
        adx: state.adx,
        plusDI: plusDI,
        minusDI: minusDI
    };
}

/**
 * Reference calculation for validation
 */
export function calculateADXReference(candles, period = 14) {
    if (candles.length < period * 2) {
        return { adx: null, plusDI: null, minusDI: null };
    }

    const plusDMs = [];
    const minusDMs = [];
    const trs = [];

    for (let i = 0; i < candles.length; i++) {
        let plusDM = 0;
        let minusDM = 0;
        let tr;

        if (i > 0) {
            const upMove = candles[i].high - candles[i - 1].high;
            const downMove = candles[i - 1].low - candles[i].low;

            if (upMove > downMove && upMove > 0) {
                plusDM = upMove;
            }
            if (downMove > upMove && downMove > 0) {
                minusDM = downMove;
            }

            const hl = candles[i].high - candles[i].low;
            const hc = Math.abs(candles[i].high - candles[i - 1].close);
            const lc = Math.abs(candles[i].low - candles[i - 1].close);
            tr = Math.max(hl, hc, lc);
        } else {
            tr = candles[i].high - candles[i].low;
        }

        plusDMs.push(plusDM);
        minusDMs.push(minusDM);
        trs.push(tr);
    }

    // Smooth +DM, -DM, TR
    let smoothedPlusDM = plusDMs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let smoothedMinusDM = minusDMs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let smoothedTR = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < plusDMs.length; i++) {
        smoothedPlusDM = ((smoothedPlusDM * (period - 1)) + plusDMs[i]) / period;
        smoothedMinusDM = ((smoothedMinusDM * (period - 1)) + minusDMs[i]) / period;
        smoothedTR = ((smoothedTR * (period - 1)) + trs[i]) / period;
    }

    // Calculate DI
    const plusDI = 100 * (smoothedPlusDM / smoothedTR);
    const minusDI = 100 * (smoothedMinusDM / smoothedTR);

    // Calculate DX values
    const dxValues = [];
    let sPlusDM = plusDMs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let sMinusDM = minusDMs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let sTR = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < candles.length; i++) {
        if (i > period) {
            sPlusDM = ((sPlusDM * (period - 1)) + plusDMs[i]) / period;
            sMinusDM = ((sMinusDM * (period - 1)) + minusDMs[i]) / period;
            sTR = ((sTR * (period - 1)) + trs[i]) / period;
        }

        const pdi = 100 * (sPlusDM / sTR);
        const mdi = 100 * (sMinusDM / sTR);

        let dx = 0;
        const diSum = pdi + mdi;
        if (diSum > 0) {
            dx = 100 * Math.abs(pdi - mdi) / diSum;
        }
        dxValues.push(dx);
    }

    // Smooth DX to get ADX
    if (dxValues.length < period) {
        return { adx: null, plusDI, minusDI };
    }

    let adx = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < dxValues.length; i++) {
        adx = ((adx * (period - 1)) + dxValues[i]) / period;
    }

    return { adx, plusDI, minusDI };
}
