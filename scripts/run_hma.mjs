import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHMAState, updateHMA, getHMAValue } from '../indicators/trend/hma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    let text = 'const candles = { close: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] };';
    try {
        text = fs.readFileSync(path.join(__dirname, '../testCandles.js'), 'utf8');
    } catch(e) {
        // fallback
    }
    
    if (text.includes('const candles =')) {
        const ObjectExtractor = new Function(text.replace('const candles =', 'return'));
        const candles = ObjectExtractor();
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating HMA (9 and 20) step by step...\n`);
        
        const state9 = createHMAState(9);
        const state20 = createHMAState(20);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : null,
                low: candles.low ? candles.low[i] : null,
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : null,
                timestamp: candles.timestamp ? candles.timestamp[i] : i
            };
            
            updateHMA(state9, candle);
            updateHMA(state20, candle);
            
            const currentVal9 = getHMAValue(state9);
            const currentVal20 = getHMAValue(state20);
            
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            let valStr9 = currentVal9 === null ? 'Gathering...' : Number(currentVal9).toFixed(4);
            let valStr20 = currentVal20 === null ? 'Gathering...' : Number(currentVal20).toFixed(4);
            console.log(`[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)} | HMA_9: ${valStr9} | HMA_20: ${valStr20}`);
        }
        console.log("\nDone processing all candles for HMA.");
    }
} catch(e) {
    console.error(e);
}
