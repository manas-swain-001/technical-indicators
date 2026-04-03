import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRVIState, updateRVI, getRVIValues } from '../indicators/momentum/rvi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    let text = 'const candles = { open: [1,2,3,4,5], close: [2,3,4,5,6], high: [2,3,4,5,6], low: [0,1,2,3,4] };';
    try {
        text = fs.readFileSync(path.join(__dirname, '../testCandles.js'), 'utf8');
    } catch(e) {
        // fallback
    }
    
    if (text.includes('const candles =')) {
        const ObjectExtractor = new Function(text.replace('const candles =', 'return'));
        const candles = ObjectExtractor();
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating Relative Vigor Index (RVI)... \n`);
        
        const state = createRVIState(10);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open && candles.open[i] !== undefined ? candles.open[i] : candles.close[i] * 0.98,
                high: candles.high && candles.high[i] !== undefined ? candles.high[i] : candles.close[i] * 1.05,
                low: candles.low && candles.low[i] !== undefined ? candles.low[i] : candles.close[i] * 0.95,
                close: candles.close[i],
                volume: candles.volume && candles.volume[i] !== undefined ? candles.volume[i] : null,
                timestamp: candles.timestamp && candles.timestamp[i] !== undefined ? candles.timestamp[i] : Math.floor(Date.now()/1000) - (86400 * (1000 - i))
            };
            
            updateRVI(state, candle);
            const currentVal = getRVIValues(state);
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            
            let tlStr = `[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)}`;
            
            if (currentVal === null) {
                tlStr += ` | RVI: Gathering 4-Candle Symmetric Weight matrices...`;
            } else {
                const rviRaw = Number(currentVal.rvi).toFixed(4);
                const sigRaw = Number(currentVal.signal).toFixed(4);
                const rviMatrix = currentVal.direction === 1 ? 'BULLISH' : 'BEARISH';
                
                tlStr += ` | RVI(10): ${rviRaw > 0 ? '+'+rviRaw : rviRaw}`;
                tlStr += ` | Signal: ${sigRaw > 0 ? '+'+sigRaw : sigRaw}`;
                tlStr += ` | Matrix: RVI ${currentVal.direction === 1 ? '>' : '<'} Signal -> ${rviMatrix}`;
            }
            console.log(tlStr);
        }
        console.log("\nDone processing all candles for RVI.");
    }
} catch(e) {
    console.error(e);
}
