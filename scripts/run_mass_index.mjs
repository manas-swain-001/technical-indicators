import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createMassIndexState, updateMassIndex, getMassIndexValues } from '../indicators/trend/massIndex.js';

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
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating Mass Index (9, 25)...\n`);
        
        const state = createMassIndexState(9, 25);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : candles.close[i]*1.05,
                low: candles.low ? candles.low[i] : candles.close[i]*0.95,
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : null,
                timestamp: candles.timestamp ? candles.timestamp[i] : Math.floor(Date.now()/1000) - (86400 * (1000 - i))
            };
            
            updateMassIndex(state, candle);
            const val = getMassIndexValues(state);
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            
            let tlStr = `[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)}`;
            
            if (val === null) {
                tlStr += ` | Mass Index: Gathering EMA bounds...`;
            } else {
                tlStr += ` | Mass Index: ${val.massIndex.toFixed(4)} | Direction: ${val.direction}`;
            }
            console.log(tlStr);
        }
        console.log("\nDone processing all candles for Mass Index.");
    }
} catch(e) {
    console.error(e);
}
