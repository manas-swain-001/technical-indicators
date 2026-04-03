import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSupertrendState, updateSupertrend, getSupertrendValues } from '../indicators/trend/supertrend.js';

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
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating Supertrend(14, 3) step by step...\n`);
        
        const state = createSupertrendState(14, 3.0);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : (candles.close[i] * 1.05),
                low: candles.low ? candles.low[i] : (candles.close[i] * 0.95),
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : null,
                timestamp: candles.timestamp ? candles.timestamp[i] : i
            };
            
            updateSupertrend(state, candle);
            const currentVal = getSupertrendValues(state);
            
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            
            if (currentVal === null) {
                console.log(`[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Gathering ATR(14) data...`);
            } else {
                const stRaw = Number(currentVal.supertrend).toFixed(4);
                const stDir = currentVal.direction === 1 ? 'BULLISH (1) ' : 'BEARISH (-1)';
                const crossInfo = (currentVal.direction === 1 && candle.close > currentVal.supertrend) 
                                  ? ' (Price > ST) ' 
                                  : ' (Price < ST) ';

                let tlStr = `[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)}`;
                tlStr += ` | Supertrend: ${stRaw} | Direction: ${stDir}${crossInfo}`;
                console.log(tlStr);
            }
        }
        console.log("\nDone processing all candles for Supertrend.");
    }
} catch(e) {
    console.error(e);
}
