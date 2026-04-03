import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDEMAState, updateDEMA, getDEMAValue } from '../indicators/trend/dema.js';

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
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating DEMA (9, 14, 21) step by step...\n`);
        
        const dema9 = createDEMAState(9);
        const dema14 = createDEMAState(14);
        const dema21 = createDEMAState(21);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : (candles.close[i] * 1.05),
                low: candles.low ? candles.low[i] : (candles.close[i] * 0.95),
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : null,
                timestamp: candles.timestamp ? candles.timestamp[i] : i
            };
            
            updateDEMA(dema9, candle);
            updateDEMA(dema14, candle);
            updateDEMA(dema21, candle);
            
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            
            const val9 = getDEMAValue(dema9);
            const val14 = getDEMAValue(dema14);
            const val21 = getDEMAValue(dema21);
            
            if (val21 !== null) {
                let tlStr = `[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)}`;
                tlStr += ` | DEMA_9: ${val9.toFixed(5)} | DEMA_14: ${val14.toFixed(5)} | DEMA_21: ${val21.toFixed(5)}`;
                console.log(tlStr);
            }
        }
        console.log("\nDone processing all candles for DEMA.");
    }
} catch(e) {
    console.error(e);
}
