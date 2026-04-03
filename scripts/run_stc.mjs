import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSTCState, updateSTC, getSTCValues } from '../indicators/momentum/stc.js';

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
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating Schaff Trend Cycle (STC)...\n`);
        
        const state = createSTCState(23, 50, 10, 3);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : null,
                low: candles.low ? candles.low[i] : null,
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : null,
                timestamp: candles.timestamp ? candles.timestamp[i] : Math.floor(Date.now()/1000) - (86400 * (1000 - i))
            };
            
            updateSTC(state, candle);
            const currentVal = getSTCValues(state);
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            
            let tlStr = `[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)}`;
            
            if (currentVal === null) {
                tlStr += ` | STC: Gathering Double Stochastic Overlays...`;
            } else {
                const stcRaw = Number(currentVal.stc).toFixed(4);
                let evalZone = 'NEUTRAL (25 - 75)';
                if (currentVal.direction === 1) evalZone = 'BULLISH OVERSOLD (< 25)';
                if (currentVal.direction === -1) evalZone = 'BEARISH OVERBOUGHT (> 75)';
                
                tlStr += ` | STC(23,50,10,3): ${stcRaw} | Matrix: ${evalZone}`;
            }
            console.log(tlStr);
        }
        console.log("\nDone processing all candles for STC.");
    }
} catch(e) {
    console.error(e);
}
