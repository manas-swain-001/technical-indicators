import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { createCMOState, updateCMO, getCMOValues } from '../indicators/momentum/cmo.js';
import { createAOState, updateAO, getAOValues } from '../indicators/momentum/ao.js';
import { createACState, updateAC, getACValues } from '../indicators/momentum/ac.js';
import { createBOPState, updateBOP, getBOPValues } from '../indicators/momentum/bop.js';
import { createMassIndexState, updateMassIndex, getMassIndexValues } from '../indicators/trend/massIndex.js';
import { createEFIState, updateEFI, getEFIValues } from '../indicators/volume/efi.js';
import { createTRIXState, updateTRIX, getTRIXValues } from '../indicators/trend/trix.js';
import { createPsyLineState, updatePsyLine, getPsyLineValues } from '../indicators/momentum/psyline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    let text = 'const candles = { close: [1,2,3,4,5,6,7,8,9,10] };';
    try {
        text = fs.readFileSync(path.join(__dirname, '../testCandles.js'), 'utf8');
    } catch(e) {
        // fallback
    }
    
    if (text.includes('const candles =')) {
        const ObjectExtractor = new Function(text.replace('const candles =', 'return'));
        const candles = ObjectExtractor();
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Executing Concurrent Batch 8-Indicator Calculation Matrix...\n`);
        
        const stateCMO = createCMOState(14);
        const stateAO = createAOState(5, 34);
        const stateAC = createACState(5, 34, 5);
        const stateBOP = createBOPState();
        const stateMass = createMassIndexState(9, 25);
        const stateEFI = createEFIState(13);
        const stateTRIX = createTRIXState(15);
        const statePsy = createPsyLineState(12);
        
        // Let's just track the final 2 candles fully computed to simulate live flow tick-by-tick
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : candles.close[i] * 0.99,
                high: candles.high ? candles.high[i] : candles.close[i] * 1.05,
                low: candles.low ? candles.low[i] : candles.close[i] * 0.95,
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : 10000 + i, // Default mock volume
                timestamp: candles.timestamp ? candles.timestamp[i] : i
            };
            
            updateCMO(stateCMO, candle);
            updateAO(stateAO, candle);
            updateAC(stateAC, candle);
            updateBOP(stateBOP, candle);
            updateMassIndex(stateMass, candle);
            updateEFI(stateEFI, candle);
            updateTRIX(stateTRIX, candle);
            updatePsyLine(statePsy, candle);
            
            // Log only last 2 overlapping vectors to prevent terminal spam
            if (i >= candles.close.length - 2) {
                const date = new Date(candle.timestamp * 1000).toLocaleString();
                console.log(`\n============== [Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | CLOSE: ${candle.close.toFixed(2)} ==============`);
                
                const cmo = getCMOValues(stateCMO);
                if (cmo) console.log(`[CMO 14]       Val: ${cmo.cmo.toFixed(4)} | Direction Matrix: ${cmo.direction}`);
                
                const ao = getAOValues(stateAO);
                if (ao) console.log(`[AO 5, 34]     Val: ${ao.ao.toFixed(4)} | Direction Matrix: ${ao.direction}`);
                
                const ac = getACValues(stateAC);
                if (ac) console.log(`[AC 5, 34, 5]  Val: ${ac.ac.toFixed(4)} | Direction Matrix: ${ac.direction}`);
                
                const bop = getBOPValues(stateBOP);
                if (bop) console.log(`[BOP]          Val: ${bop.bop.toFixed(4)} | Direction Matrix: ${bop.direction}`);
                
                const mass = getMassIndexValues(stateMass);
                if (mass) console.log(`[MassIdx 9,25] Val: ${mass.massIndex.toFixed(4)} | Threshold Matrix: ${mass.direction === -1 ? 'REVERSAL BULGE' : 'NORMAL'}`);
                
                const efi = getEFIValues(stateEFI);
                if (efi) console.log(`[EFI 13]       Val: ${efi.efi.toFixed(4)} | Direction Matrix: ${efi.direction}`);
                
                const trix = getTRIXValues(stateTRIX);
                if (trix) console.log(`[TRIX 15]      Val: ${trix.trix.toFixed(6)} | Direction Matrix: ${trix.direction}`);
                
                const psy = getPsyLineValues(statePsy);
                if (psy) console.log(`[Psy Line 12]  Val: ${psy.psy.toFixed(2)}% | Direction Matrix: ${psy.direction}`);
            }
        }
        console.log("\nDone concurrently processing all 8 indicators.");
    }
} catch(e) {
    console.error(e);
}
