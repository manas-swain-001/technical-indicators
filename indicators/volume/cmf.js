/**
 * CMF (Chaikin Money Flow)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * Step 1: Calculate Money Flow Multiplier
 *   MFM_t = ((Close - Low) - (High - Close)) / (High - Low)
 *   If High = Low: MFM_t = 0
 * 
 * Step 2: Calculate Money Flow Volume
 *   MFV_t = MFM_t × Volume_t
 * 
 * Step 3: Calculate CMF
 *   CMF = Σ(MFV, period) / Σ(Volume, period)  [typically 20]
 * 
 * Boundary conditions:
 *   If High = Low: MFM = 0
 *   If Σ(Volume) = 0: CMF = 0
 */

export function createCMFState(period = 20) {
    return {
        period,
        mfvValues: [],
        volumes: [],
        ready: false
    };
}

export function updateCMF(state, candle) {
    // Calculate Money Flow Multiplier
    let mfm;
    if (candle.high === candle.low) {
        mfm = 0;
    } else {
        mfm = ((candle.close - candle.low) - (candle.high - candle.close)) / (candle.high - candle.low);
    }

    // Calculate Money Flow Volume
    const mfv = mfm * candle.volume;

    state.mfvValues.push(mfv);
    state.volumes.push(candle.volume);

    // Keep only required values
    if (state.mfvValues.length > state.period) {
        state.mfvValues.shift();
        state.volumes.shift();
    }

    if (state.mfvValues.length === state.period) {
        state.ready = true;
    }
}

export function getCMFValue(state) {
    if (!state.ready) {
        return null;
    }

    const sumMFV = state.mfvValues.reduce((a, b) => a + b, 0);
    const sumVolume = state.volumes.reduce((a, b) => a + b, 0);

    if (sumVolume === 0) {
        return 0;
    }

    return sumMFV / sumVolume;
}

/**
 * Reference calculation for validation
 */
export function calculateCMFReference(candles, period = 20) {
    if (candles.length < period) {
        return null;
    }

    let sumMFV = 0;
    let sumVolume = 0;

    for (let i = candles.length - period; i < candles.length; i++) {
        let mfm;
        if (candles[i].high === candles[i].low) {
            mfm = 0;
        } else {
            mfm = ((candles[i].close - candles[i].low) - (candles[i].high - candles[i].close)) /
                (candles[i].high - candles[i].low);
        }

        const mfv = mfm * candles[i].volume;
        sumMFV += mfv;
        sumVolume += candles[i].volume;
    }

    if (sumVolume === 0) {
        return 0;
    }

    return sumMFV / sumVolume;
}
