import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createMomentumState, updateMomentum, getMomentumValue } from '../indicators/momentum/momentum.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the candles file safely independent of CWD
const text = fs.readFileSync(path.join(__dirname, '../testCandles.js'), 'utf8');
const ObjectExtractor = new Function(text.replace('const candles =', 'return'));
const candles = ObjectExtractor();

console.log(`Loaded ${candles.close.length} candles. Calculating MOMENTUM step by step...\n`);

// Initialize state with default parameters
const state = createMomentumState();

for (let i = 0; i < candles.close.length; i++) {
    const candle = {
        open: candles.open[i],
        high: candles.high[i],
        low: candles.low[i],
        close: candles.close[i],
        volume: candles.volume[i],
        timestamp: candles.timestamp[i]
    };
    
    // Update the state
    updateMomentum(state, candle);
    
    // Get current value
    const currentVal = getMomentumValue(state);
    
    const date = new Date(candle.timestamp * 1000).toLocaleString();
    
    // Format output
    let valStr;
    if (currentVal === null) {
        valStr = 'Gathering enough data...';
    } else if (typeof currentVal === 'object') {
        const parts = [];
        // Check if object is largely nulls
        let allNull = true;
        for (const v of Object.values(currentVal)) {
            if (v !== null) allNull = false;
        }
        if (allNull) {
            valStr = 'Gathering enough data...';
        } else {
            for (const [k, v] of Object.entries(currentVal)) {
                parts.push(`${k}: ${v !== null ? Number(v).toFixed(2) : 'null'}`);
            }
            valStr = parts.join(' | ');
        }
    } else {
        valStr = Number(currentVal).toFixed(2);
    }
    
    console.log(`[Candle ${String(i + 1).padStart(3, '0')}] | Date: ${date} | Close: ${candle.close.toFixed(2)} | MOMENTUM: ${valStr}`);
}

console.log("\nDone processing all candles for MOMENTUM.");
