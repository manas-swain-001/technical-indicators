/**
 * CCI (Commodity Channel Index)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * TP_t = (High_t + Low_t + Close_t) / 3     [Typical Price]
 * 
 * SMA_TP = SMA(TP, period)    [typically 20]
 * 
 * MD = SMA(|TP - SMA_TP|, period)    [Mean Deviation]
 * 
 * CCI = (TP - SMA_TP) / (0.015 × MD)
 * 
 * Boundary conditions:
 *   If MD = 0: CCI = 0
 * 
 * Note: 0.015 is Lambert's constant to ensure ~70-80% of values fall between ±100
 */

export function createCCIState(period = 20) {
    return {
        period,
        typicalPrices: [],
        ready: false
    };
}

export function updateCCI(state, candle) {
    const tp = (candle.high + candle.low + candle.close) / 3;
    state.typicalPrices.push(tp);

    // Keep only required values
    if (state.typicalPrices.length > state.period) {
        state.typicalPrices.shift();
    }

    if (state.typicalPrices.length === state.period) {
        state.ready = true;
    }
}

export function getCCIValue(state) {
    if (!state.ready) {
        return null;
    }

    // Calculate SMA of typical prices
    const sum = state.typicalPrices.reduce((a, b) => a + b, 0);
    const smaTP = sum / state.period;

    // Calculate mean deviation
    let mdSum = 0;
    for (let i = 0; i < state.typicalPrices.length; i++) {
        mdSum += Math.abs(state.typicalPrices[i] - smaTP);
    }
    const md = mdSum / state.period;

    // Handle boundary condition
    if (md === 0) {
        return 0;
    }

    const currentTP = state.typicalPrices[state.typicalPrices.length - 1];
    const cci = (currentTP - smaTP) / (0.015 * md);

    return cci;
}

/**
 * Reference calculation for validation
 */
export function calculateCCIReference(candles, period = 20) {
    if (candles.length < period) {
        return null;
    }

    // Calculate typical prices
    const typicalPrices = [];
    for (let i = candles.length - period; i < candles.length; i++) {
        const tp = (candles[i].high + candles[i].low + candles[i].close) / 3;
        typicalPrices.push(tp);
    }

    // Calculate SMA of typical prices
    const sum = typicalPrices.reduce((a, b) => a + b, 0);
    const smaTP = sum / period;

    // Calculate mean deviation
    let mdSum = 0;
    for (let i = 0; i < typicalPrices.length; i++) {
        mdSum += Math.abs(typicalPrices[i] - smaTP);
    }
    const md = mdSum / period;

    if (md === 0) {
        return 0;
    }

    const currentTP = typicalPrices[typicalPrices.length - 1];
    const cci = (currentTP - smaTP) / (0.015 * md);

    return cci;
}
