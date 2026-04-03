import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createTEMAState, updateTEMA, getTEMAValue } from '../indicators/trend/tema.js';

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
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating TEMA (9, 14) step by step...\n`);
        
        const tema9 = createTEMAState(9);
        const tema14 = createTEMAState(14);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : (candles.close[i] * 1.05),
                low: candles.low ? candles.low[i] : (candles.close[i] * 0.95),
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : null,
                timestamp: candles.timestamp ? candles.timestamp[i] : i
            };
            
            updateTEMA(tema9, candle);
            updateTEMA(tema14, candle);
            
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            
            const val9 = getTEMAValue(tema9);
            const val14 = getTEMAValue(tema14);
            
            if (val14 !== null) {
                let tlStr = `[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)}`;
                tlStr += ` | TEMA_9: ${val9.toFixed(5)} | TEMA_14: ${val14.toFixed(5)}`;
                console.log(tlStr);
            }
        }
        console.log("\nDone processing all candles for TEMA.");
    }
} catch(e) {
    console.error(e);
}
