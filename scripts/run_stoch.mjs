import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createStochasticState, updateStochastic, getStochasticValues } from '../indicators/momentum/stochastic.js';
import { createStochRSIState, updateStochRSI, getStochRSIValues } from '../indicators/momentum/stochrsi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    let text = 'const candles = { close: [1,2,3,4,5], high: [2,3,4,5,6], low: [0,1,2,3,4] };';
    try {
        text = fs.readFileSync(path.join(__dirname, '../testCandles.js'), 'utf8');
    } catch(e) {
        // fallback
    }
    
    if (text.includes('const candles =')) {
        const ObjectExtractor = new Function(text.replace('const candles =', 'return'));
        const candles = ObjectExtractor();
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles ========================`);
        console.log(`Calculating Slow Stoch(14, 3, 3), Fast Stoch(5, 1, 3), StochRSI(14, 14, 3, 3)...\n`);
        
        const stateSlow = createStochasticState(14, 3, 3);
        const stateFast = createStochasticState(5, 1, 3);
        const stateStochRSI = createStochRSIState(14, 14, 3, 3);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : (candles.close[i] * 1.05),
                low: candles.low ? candles.low[i] : (candles.close[i] * 0.95),
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : null,
                timestamp: candles.timestamp ? candles.timestamp[i] : Math.floor(Date.now()/1000) - (86400 * (1000 - i))
            };
            
            updateStochastic(stateSlow, candle);
            updateStochastic(stateFast, candle);
            updateStochRSI(stateStochRSI, candle);
            
            const vSlow = getStochasticValues(stateSlow);
            const vFast = getStochasticValues(stateFast);
            const vStochRSI = getStochRSIValues(stateStochRSI);
            
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            
            // Wait for largest window to be ready
            if (vStochRSI.k === null) {
                console.log(`[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Gathering overlapping Stoch Data...`);
            } else {
                let tlStr = `[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)}`;
                tlStr += `\n    -> Slow(14,3,3) | %K: ${Number(vSlow.k).toFixed(4)} | %D: ${Number(vSlow.d).toFixed(4)} | Sig: ${vSlow.signal}`;
                tlStr += `\n    -> Fast(5,1,3)  | %K: ${Number(vFast.k).toFixed(4)} | %D: ${Number(vFast.d).toFixed(4)} | Sig: ${vFast.signal}`;
                tlStr += `\n    -> StochRSI(14) | %K: ${Number(vStochRSI.k).toFixed(4)} | %D: ${Number(vStochRSI.d).toFixed(4)} | Sig: ${vStochRSI.signal}\n`;
                console.log(tlStr);
            }
        }
        console.log("Done processing all candles for Stochastics.");
    }
} catch(e) {
    console.error(e);
}
