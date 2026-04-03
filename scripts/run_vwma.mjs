import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createVWMAState, updateVWMA, getVWMAValue } from '../indicators/trend/vwma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    let text = 'const candles = { close: [1, 2, 3, 4], volume: [10, 20, 30, 40] };';
    try {
        text = fs.readFileSync(path.join(__dirname, '../testCandles.js'), 'utf8');
    } catch(e) {
        // fallback
    }
    
    if (text.includes('const candles =')) {
        const ObjectExtractor = new Function(text.replace('const candles =', 'return'));
        const candles = ObjectExtractor();
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating VWMA_20 step by step...\n`);
        
        const state20 = createVWMAState(20);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : null,
                low: candles.low ? candles.low[i] : null,
                close: candles.close[i],
                // Create a mock volume if test dataset lacks true volume, 
                // just so we don't break during tests. If volume exists, it uses it natively!
                volume: candles.volume ? candles.volume[i] : (100 * (i % 5 + 1)), 
                timestamp: candles.timestamp ? candles.timestamp[i] : i
            };
            
            updateVWMA(state20, candle);
            const currentVal = getVWMAValue(state20);
            
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            let valStr = currentVal === null ? 'Gathering...' : Number(currentVal).toFixed(4);
            console.log(`[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)} | Vol: ${candle.volume} | VWMA_20: ${valStr}`);
        }
        console.log("\nDone processing all candles for VWMA.");
    }
} catch(e) {
    console.error(e);
}
