
import fs from 'fs';

function extractJson(path) {
    const fileContent = JSON.parse(fs.readFileSync(path, 'utf8'));
    const resultString = fileContent.result;
    const start = resultString.indexOf('[');
    const end = resultString.lastIndexOf(']') + 1;
    return JSON.parse(resultString.substring(start, end));
}

const assets = extractJson('C:/Users/rafad/.gemini/antigravity/brain/f65e7913-41a0-4f23-b0a8-64d61fce6856/.system_generated/steps/19/output.txt');
const transactions = extractJson('C:/Users/rafad/.gemini/antigravity/brain/f65e7913-41a0-4f23-b0a8-64d61fce6856/.system_generated/steps/20/output.txt');

// Simulation of generatePerformanceData logic
let cashBalance = 0;
const inventory = new Map();
const lastKnownPrices = new Map();

// Assume a benchmark day for today to process all transactions
const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

sortedTx.forEach(tx => {
    const q = Math.abs(Number(tx.quantity));
    const p = Number(tx.price_per_unit);
    const f = Number(tx.fee || 0);
    const asset = assets.find(a => a.id === tx.asset_id);
    if (!asset) return;

    const isCapital = asset.category?.toLowerCase() === 'capital';

    if (isCapital) {
        if (tx.type === 'Buy' || tx.type === 'Deposit') {
            cashBalance += (q * p);
        } else if (tx.type === 'Withdrawal' || tx.type === 'Sell') {
            cashBalance -= (q * p);
        }
    } else {
        const inv = inventory.get(tx.asset_id) || { qty: 0, costBasis: 0 };
        if (tx.type === 'Buy') {
            inv.qty += q;
            inv.costBasis += (q * p);
            cashBalance -= (q * p) + f;
            lastKnownPrices.set(asset.ticker, p);
        } else if (tx.type === 'Sell') {
            const sellRatio = q / inv.qty;
            inv.costBasis -= (inv.costBasis * sellRatio);
            inv.qty -= q;
            cashBalance += (q * p) - f;
            lastKnownPrices.set(asset.ticker, p);
        } else if (tx.type === 'Dividend') {
            cashBalance += (q * p) - f;
        }
        inventory.set(tx.asset_id, inv);
    }
});

console.log('--- Current Positions ---');
let totalMarketValue = 0;
inventory.forEach((inv, assetId) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset || inv.qty <= 0.000001) return;

    const isStatic = asset.category?.toLowerCase() === 'debt' || asset.category?.toLowerCase() === 'deuda';
    // Use price from DB if not 0, otherwise last transaction price
    const price = isStatic ? (inv.costBasis / inv.qty) : (Number(asset.current_price) || lastKnownPrices.get(asset.ticker) || 0);
    const value = inv.qty * price;
    totalMarketValue += value;
    console.log(`${asset.name} (${asset.ticker}): Qty=${inv.qty.toFixed(4)}, Price=${price.toFixed(4)}, Value=${value.toFixed(2)}€`);
});

console.log('\n--- Summary ---');
console.log('Total Market Value:', totalMarketValue.toFixed(2), '€');
console.log('Cash Balance:', cashBalance.toFixed(2), '€');
console.log('Patrimonio Total (Sum):', (totalMarketValue + cashBalance).toFixed(2), '€');

const totalDeposits = sortedTx.filter(tx => {
    const asset = assets.find(a => a.id === tx.asset_id);
    return asset && asset.category?.toLowerCase() === 'capital';
}).reduce((acc, tx) => acc + (Math.abs(Number(tx.quantity)) * Number(tx.price_per_unit)), 0);

console.log('Total Deposits:', totalDeposits.toFixed(2), '€');
console.log('Implicit Profit:', (totalMarketValue + cashBalance - totalDeposits).toFixed(2), '€');
