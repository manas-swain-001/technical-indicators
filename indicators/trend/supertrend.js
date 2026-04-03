/**
 * Supertrend Indicator
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * Basic Upper Band = (High + Low) / 2 + (Multiplier × ATR)
 * Basic Lower Band = (High + Low) / 2 - (Multiplier × ATR)
 * 
 * Final Upper Band = IF(Current Basic Upper Band < Previous Final Upper Band OR Previous Close > Previous Final Upper Band) 
 *                    THEN Current Basic Upper Band ELSE Previous Final Upper Band
 * 
 * Final Lower Band = IF(Current Basic Lower Band > Previous Final Lower Band OR Previous Close < Previous Final Lower Band) 
 *                    THEN Current Basic Lower Band ELSE Previous Final Lower Band
 * 
 * Supertrend = IF(Previous Supertrend == Previous Final Upper Band AND Current Close > Final Upper Band) THEN Final Lower Band
 *              ELSE IF (Previous Supertrend == Previous Final Lower Band AND Current Close < Final Lower Band) THEN Final Upper Band
 *              ELSE (Maintains existing trend band)
 */

import { createATRState, updateATR, getATRValue } from '../volatility/atr.js';

export function createSupertrendState(period = 10, multiplier = 3.0) {
    return {
        period,
        multiplier,
        atrState: createATRState(period),
        prevClose: null,
        finalUpperBand: null,
        finalLowerBand: null,
        supertrend: null,
        direction: null, // 1 for Bullish, -1 for Bearish
        ready: false
    };
}

export function updateSupertrend(state, candle) {
    updateATR(state.atrState, candle);

    if (state.atrState.ready) {
        const atr = getATRValue(state.atrState);
        const hl2 = (candle.high + candle.low) / 2;

        const basicUpperBand = hl2 + (state.multiplier * atr);
        const basicLowerBand = hl2 - (state.multiplier * atr);

        if (state.finalUpperBand === null) {
            // First time initialization
            state.finalUpperBand = basicUpperBand;
            state.finalLowerBand = basicLowerBand;
            state.direction = candle.close > hl2 ? 1 : -1;
            state.supertrend = state.direction === 1 ? state.finalLowerBand : state.finalUpperBand;
        } else {
            // Final Upper Band logic
            if (basicUpperBand < state.finalUpperBand || state.prevClose > state.finalUpperBand) {
                state.finalUpperBand = basicUpperBand;
            }

            // Final Lower Band logic
            if (basicLowerBand > state.finalLowerBand || state.prevClose < state.finalLowerBand) {
                state.finalLowerBand = basicLowerBand;
            }

            // Core Supertrend Logic
            if (state.direction === -1) {
                // If we were Bearish, did we close above the upper band?
                if (candle.close > state.finalUpperBand) {
                    state.direction = 1; // Flip to Bullish
                    state.supertrend = state.finalLowerBand;
                } else {
                    state.supertrend = state.finalUpperBand;
                }
            } else if (state.direction === 1) {
                // If we were Bullish, did we close below the lower band?
                if (candle.close < state.finalLowerBand) {
                    state.direction = -1; // Flip to Bearish
                    state.supertrend = state.finalUpperBand;
                } else {
                    state.supertrend = state.finalLowerBand;
                }
            }
        }

        state.ready = true;
    }

    state.prevClose = candle.close;
}

export function getSupertrendValues(state) {
    if (!state.ready) {
        return null;
    }
    return {
        supertrend: state.supertrend,
        direction: state.direction
    };
}
