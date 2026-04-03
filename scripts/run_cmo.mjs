import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCMOState, updateCMO, getCMOValues } from '../indicators/momentum/cmo.js';

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
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating CMO(14)...\n`);
        
        const state = createCMOState(14);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : null,
                low: candles.low ? candles.low[i] : null,
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : null,
                timestamp: candles.timestamp ? candles.timestamp[i] : Math.floor(Date.now()/1000) - (86400 * (1000 - i))
            };
            
            updateCMO(state, candle);
            const val = getCMOValues(state);
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            
            let tlStr = `[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)}`;
            
            if (val === null) {
                tlStr += ` | CMO: Gathering bounds...`;
            } else {
                tlStr += ` | CMO: ${val.cmo.toFixed(4)} | Direction: ${val.direction}`;
            }
            console.log(tlStr);
        }
        console.log("\nDone processing all candles for CMO.");
    }
} catch(e) {
    console.error(e);
}
