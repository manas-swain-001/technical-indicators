import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createUltimateState, updateUltimate, getUltimateValues } from '../indicators/momentum/ultimate.js';

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
        
        console.log(`Loaded ${candles.close ? candles.close.length : 'mock'} candles. Calculating Ultimate Oscillator (7, 14, 28)...\n`);
        
        const state = createUltimateState(7, 14, 28);
        
        for (let i = 0; i < (candles.close.length || 0); i++) {
            const candle = {
                open: candles.open ? candles.open[i] : null,
                high: candles.high ? candles.high[i] : candles.close[i]*1.05,
                low: candles.low ? candles.low[i] : candles.close[i]*0.95,
                close: candles.close[i],
                volume: candles.volume ? candles.volume[i] : null,
                timestamp: candles.timestamp ? candles.timestamp[i] : Math.floor(Date.now()/1000) - (86400 * (1000 - i))
            };
            
            updateUltimate(state, candle);
            const currentVal = getUltimateValues(state);
            const date = new Date(candle.timestamp * 1000).toLocaleString();
            
            let tlStr = `[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)}`;
            
            if (currentVal === null) {
                tlStr += ` | Ultimate Osc: Gathering Buying Pressure History (28)...`;
            } else {
                const ultRaw = Number(currentVal.ultimate).toFixed(4);
                let evalZone = 'NEUTRAL (30 - 70)';
                if (currentVal.direction === 1) evalZone = 'BULLISH OVERSOLD (<= 30)';
                if (currentVal.direction === -1) evalZone = 'BEARISH OVERBOUGHT (>= 70)';
                
                tlStr += ` | UltOsc(7,14,28): ${ultRaw > 0 ? '+'+ultRaw : ultRaw} | Matrix: ${evalZone}`;
            }
            console.log(tlStr);
        }
        console.log("\nDone processing all candles for Ultimate Oscillator.");
    }
} catch(e) {
    console.error(e);
}
