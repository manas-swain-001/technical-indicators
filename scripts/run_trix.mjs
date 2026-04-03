import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createTRIXState, updateTRIX, getTRIXValues } from '../indicators/trend/trix.js';

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
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating TRIX (15)...\n`);
        
        const state = createTRIXState(15);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : null,
                low: candles.low ? candles.low[i] : null,
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : null,
                timestamp: candles.timestamp ? candles.timestamp[i] : Math.floor(Date.now()/1000) - (86400 * (1000 - i))
            };
            
            updateTRIX(state, candle);
            const val = getTRIXValues(state);
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            
            let tlStr = `[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)}`;
            
            if (val === null) {
                tlStr += ` | TRIX: Gathering multi-EMA layers...`;
            } else {
                tlStr += ` | TRIX: ${val.trix.toFixed(6)} | Direction: ${val.direction}`;
            }
            console.log(tlStr);
        }
        console.log("\nDone processing all candles for TRIX.");
    }
} catch(e) {
    console.error(e);
}
