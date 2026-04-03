import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createKSTState, updateKST, getKSTValues } from '../indicators/momentum/kst.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    let text = 'const candles = { close: Array.from({length: 50}, (_, i) => i + 1) };';
    try {
        text = fs.readFileSync(path.join(__dirname, '../testCandles.js'), 'utf8');
    } catch(e) {
        // fallback
    }
    
    if (text.includes('const candles =')) {
        const ObjectExtractor = new Function(text.replace('const candles =', 'return'));
        const candles = ObjectExtractor();
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating Know Sure Thing (KST)...\n`);
        
        const state = createKSTState([10, 15, 20, 30], [10, 10, 10, 15], 9);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : null,
                low: candles.low ? candles.low[i] : null,
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : null,
                timestamp: candles.timestamp ? candles.timestamp[i] : Math.floor(Date.now()/1000) - (86400 * (1000 - i))
            };
            
            updateKST(state, candle);
            const currentVal = getKSTValues(state);
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            
            let tlStr = `[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)}`;
            
            if (currentVal === null) {
                tlStr += ` | KST: Gathering multi-layered smoothing history...`;
            } else {
                const kstVal = Number(currentVal.kst).toFixed(4);
                const sigVal = Number(currentVal.signal).toFixed(4);
                const kstMatrix = currentVal.direction === 1 ? 'BULL' : 'BEAR';
                
                tlStr += ` | KST: ${kstVal > 0 ? '+'+kstVal : kstVal}`;
                tlStr += ` | Signal: ${sigVal > 0 ? '+'+sigVal : sigVal}`;
                tlStr += ` | Matrix: KST ${currentVal.direction === 1 ? '>' : '<'} Signal -> ${kstMatrix}ISH`;
            }
            console.log(tlStr);
        }
        console.log("\nDone processing all candles for KST.");
    }
} catch(e) {
    console.error(e);
}
