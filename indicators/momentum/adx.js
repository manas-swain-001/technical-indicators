/**
 * ADX (Average Directional Index)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * Encapsulates the Directional Indicator (DI) engine to smooth out true directional movement indices.
 * 
 * DX = 100 × |+DI - -DI| / (+DI + -DI)
 * ADX = RMA(DX, period)
 */

import { createDIState, updateDI, getDIValues } from './di.js';

export function createADXState(period = 14) {
    return {
        period,
        diState: createDIState(period),
        dxTickCount: 0,
        sumDX: 0,
        adx: null,
        ready: false
    };
}

export function updateADX(state, candle) {
    // 1. Advance the underlying DI tracking component
    updateDI(state.diState, candle);

    if (state.diState.ready) {
        // 2. Fetch the newly computed DI values
        const diVals = getDIValues(state.diState);
        
        let dx = 0;
        const diSum = diVals.plusDI + diVals.minusDI;
        if (diSum > 0) {
            dx = 100 * Math.abs(diVals.plusDI - diVals.minusDI) / diSum;
        }

        // 3. Calculate ADX (smoothed DX using Wilder's method)
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
    if (!state.ready) {
        return { adx: null, plusDI: null, minusDI: null };
    }

    const diVals = getDIValues(state.diState);

    return {
        adx: state.adx,
        plusDI: diVals.plusDI,
        minusDI: diVals.minusDI
    };
}

/**
 * Reference calculation for validation structurally intact
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

    let smoothedPlusDM = plusDMs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let smoothedMinusDM = minusDMs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let smoothedTR = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < plusDMs.length; i++) {
        smoothedPlusDM = ((smoothedPlusDM * (period - 1)) + plusDMs[i]) / period;
        smoothedMinusDM = ((smoothedMinusDM * (period - 1)) + minusDMs[i]) / period;
        smoothedTR = ((smoothedTR * (period - 1)) + trs[i]) / period;
    }

    const plusDI = 100 * (smoothedPlusDM / smoothedTR);
    const minusDI = 100 * (smoothedMinusDM / smoothedTR);

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

    if (dxValues.length < period) return { adx: null, plusDI, minusDI };

    let adx = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < dxValues.length; i++) {
        adx = ((adx * (period - 1)) + dxValues[i]) / period;
    }

    return { adx, plusDI, minusDI };
}
