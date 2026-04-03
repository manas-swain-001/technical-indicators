import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createROCState, updateROC, getROCValues } from '../indicators/momentum/roc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    let text = 'const candles = { close: [1,2,3,4,5,6,7,8,9,10,11,12,13] };';
    try {
        text = fs.readFileSync(path.join(__dirname, '../testCandles.js'), 'utf8');
    } catch(e) {
        // fallback
    }
    
    if (text.includes('const candles =')) {
        const ObjectExtractor = new Function(text.replace('const candles =', 'return'));
        const candles = ObjectExtractor();
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating ROC(6) and ROC(12) concurrently...\n`);
        
        const state6 = createROCState(6);
        const state12 = createROCState(12);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : null,
                low: candles.low ? candles.low[i] : null,
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : null,
                timestamp: candles.timestamp ? candles.timestamp[i] : Math.floor(Date.now()/1000) - (86400 * (1000 - i))
            };
            
            updateROC(state6, candle);
            updateROC(state12, candle);
            
            const roc6 = getROCValues(state6);
            const roc12 = getROCValues(state12);
            
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            
            let tlStr = `[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)}`;
            
            if (roc6 === null) {
                // Not even ROC6 is ready
                tlStr += ` | ROC(6): Gathering... | ROC(12): Gathering...`;
            } else if (roc12 === null) {
                // ROC6 holds raw value
                const r6 = Number(roc6.roc).toFixed(4);
                tlStr += ` | ROC(6): ${r6 > 0 ? '+'+r6 : r6}% | ROC(12): Gathering...`;
            } else {
                // Both are fully ready
                const r6 = Number(roc6.roc).toFixed(4);
                const r12 = Number(roc12.roc).toFixed(4);
                
                const r6Matrix = roc6.direction === 1 ? 'BULL' : 'BEAR';
                const r12Matrix = roc12.direction === 1 ? 'BULL' : 'BEAR';

                tlStr += ` | ROC(6): ${r6 > 0 ? '+'+r6 : r6}% (${r6Matrix})`;
                tlStr += ` | ROC(12): ${r12 > 0 ? '+'+r12 : r12}% (${r12Matrix})`;
            }
            console.log(tlStr);
        }
        console.log("\nDone processing all candles for Rate of Change (ROC).");
    }
} catch(e) {
    console.error(e);
}
