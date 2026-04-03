/**
 * KST (Know Sure Thing)
 * 
 * MATHEMATICAL DEFINITION:
 * ========================
 * KST = (RC1 × 1) + (RC2 × 2) + (RC3 × 3) + (RC4 × 4)
 * Where RCx = SMA(ROC_Length_x, SMA_Length_x)
 * 
 * Default parameters (standard):
 * ROC lengths = 10, 15, 20, 30
 * SMA lengths = 10, 10, 10, 15
 * Signal Line = SMA(KST, 9)
 */

import { createROCState, updateROC, getROCValues } from './roc.js';
import { createSMAState, updateSMA, getSMAValue } from '../trend/sma.js';

export function createKSTState(rocLengths = [10, 15, 20, 30], smaLengths = [10, 10, 10, 15], signalLength = 9) {
    return {
        // Enforce exactly 4 layers of ROC processing
        roc1: createROCState(rocLengths[0]),
        roc2: createROCState(rocLengths[1]),
        roc3: createROCState(rocLengths[2]),
        roc4: createROCState(rocLengths[3]),
        
        // Enforce 4 layers of smoothing constraints corresponding to above ROCs
        sma1: createSMAState(smaLengths[0]),
        sma2: createSMAState(smaLengths[1]),
        sma3: createSMAState(smaLengths[2]),
        sma4: createSMAState(smaLengths[3]),
        
        // Final signal processing queue
        signalSma: createSMAState(signalLength),
        latestKst: null,
        ready: false
    };
}

export function updateKST(state, candle) {
    // Pipeline layer 1: Rate of Change Calculation bounds checking
    updateROC(state.roc1, candle);
    if (state.roc1.ready) updateSMA(state.sma1, { close: getROCValues(state.roc1).roc });

    updateROC(state.roc2, candle);
    if (state.roc2.ready) updateSMA(state.sma2, { close: getROCValues(state.roc2).roc });

    updateROC(state.roc3, candle);
    if (state.roc3.ready) updateSMA(state.sma3, { close: getROCValues(state.roc3).roc });

    updateROC(state.roc4, candle);
    if (state.roc4.ready) updateSMA(state.sma4, { close: getROCValues(state.roc4).roc });
    
    // Pipeline layer 2: Weighting matrix execution
    if (state.sma1.ready && state.sma2.ready && state.sma3.ready && state.sma4.ready) {
        const rc1 = getSMAValue(state.sma1);
        const rc2 = getSMAValue(state.sma2);
        const rc3 = getSMAValue(state.sma3);
        const rc4 = getSMAValue(state.sma4);
        
        // The definitive Martin Pring KST formula mapping
        state.latestKst = (rc1 * 1) + (rc2 * 2) + (rc3 * 3) + (rc4 * 4);
        
        // Finally feed raw KST directly into signal tracker
        updateSMA(state.signalSma, { close: state.latestKst });
        
        if (state.signalSma.ready) {
            state.ready = true;
        }
    }
}

export function getKSTValues(state) {
    if (!state.ready) {
        return null;
    }
    
    const kst = state.latestKst;
    const signal = getSMAValue(state.signalSma);
    
    // Crossover Logic Evaluation (1 for Bullish KST>Signal, -1 for Bearish KST<Signal)
    let direction = 0;
    if (kst > signal) {
        direction = 1;
    } else if (kst < signal) {
        direction = -1;
    }
    
    return {
        kst,
        signal,
        direction
    };
}
