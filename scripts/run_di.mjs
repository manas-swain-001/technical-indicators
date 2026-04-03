import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDIState, updateDI, getDIValues } from '../indicators/momentum/di.js';

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
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating Directional Indicator (+DI, -DI) step by step...\n`);
        
        const state = createDIState(14);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : (candles.close[i] * 1.05),
                low: candles.low ? candles.low[i] : (candles.close[i] * 0.95),
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : null,
                timestamp: candles.timestamp ? candles.timestamp[i] : i
            };
            
            updateDI(state, candle);
            const currentVal = getDIValues(state);
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            
            if (currentVal.plusDI === null) {
                console.log(`[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Gathering DI(14) data...`);
            } else {
                const plusDIRaw = Number(currentVal.plusDI).toFixed(4);
                const minusDIRaw = Number(currentVal.minusDI).toFixed(4);
                const dirMap = currentVal.direction === 1 ? 'BULLISH (1) ' : (currentVal.direction === -1 ? 'BEARISH (-1)' : 'NEUTRAL (0)');

                let tlStr = `[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)}`;
                tlStr += ` | +DI: ${plusDIRaw} | -DI: ${minusDIRaw} | Matrix: ${dirMap}`;
                console.log(tlStr);
            }
        }
        console.log("\nDone processing all candles for DI.");
    }
} catch(e) {
    console.error(e);
}
