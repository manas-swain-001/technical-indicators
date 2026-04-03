import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createAroonState, updateAroon, getAroonValues } from '../indicators/trend/aroon.js';

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
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating Aroon(14) step by step...\n`);
        
        const state = createAroonState(14);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : (candles.close[i] * 1.05),
                low: candles.low ? candles.low[i] : (candles.close[i] * 0.95),
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : null,
                timestamp: candles.timestamp ? candles.timestamp[i] : Math.floor(Date.now()/1000) - (86400 * (1000 - i))
            };
            
            updateAroon(state, candle);
            const currentVal = getAroonValues(state);
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            
            if (currentVal === null) {
                console.log(`[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Gathering Aroon(14) window...`);
            } else {
                const aUp = Number(currentVal.aroonUp).toFixed(4);
                const aDown = Number(currentVal.aroonDown).toFixed(4);
                const aOsc = Number(currentVal.oscillator).toFixed(4);
                const dirMap = currentVal.direction === 1 ? 'BULLISH (1) ' : (currentVal.direction === -1 ? 'BEARISH (-1)' : 'NEUTRAL (0)');

                let tlStr = `[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)}`;
                tlStr += ` | Aroon Up: ${aUp} | Aroon Down: ${aDown} | Osc: ${aOsc} | Matrix: ${dirMap}`;
                console.log(tlStr);
            }
        }
        console.log("\nDone processing all candles for Aroon.");
    }
} catch(e) {
    console.error(e);
}
