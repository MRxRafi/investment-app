
import fs from 'fs';

function extractJson(path) {
    const fileContent = JSON.parse(fs.readFileSync(path, 'utf8'));
    const resultString = fileContent.result;
    const start = resultString.indexOf('[');
    const end = resultString.lastIndexOf(']') + 1;
    return JSON.parse(resultString.substring(start, end));
}

const assetsData = extractJson('C:/Users/rafad/.gemini/antigravity/brain/f65e7913-41a0-4f23-b0a8-64d61fce6856/.system_generated/steps/19/output.txt');
const txData = extractJson('C:/Users/rafad/.gemini/antigravity/brain/f65e7913-41a0-4f23-b0a8-64d61fce6856/.system_generated/steps/20/output.txt');



// Simulation of generatePerformanceData logic (simplified for the final point)
let cashBalance = 0;
const inventory = new Map();

// Sort transactions
const sortedTx = [...txData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

sortedTx.forEach(tx => {
    const q = Math.abs(Number(tx.quantity));
    const p = Number(tx.price_per_unit);
    const f = Number(tx.fee || 0);
    const asset = assetsData.find(a => a.id === tx.asset_id);
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
        } else if (tx.type === 'Sell') {
            const sellRatio = q / inv.qty;
            inv.costBasis -= (inv.costBasis * sellRatio);
            inv.qty -= q;
            cashBalance += (q * p) - f;
        } else if (tx.type === 'Dividend') {
            cashBalance += (q * p) - f;
        }
        inventory.set(tx.asset_id, inv);
    }
});

let portfolioMarketValue = 0;
inventory.forEach((inv, assetId) => {
    const asset = assetsData.find(a => a.id === assetId);
    if (!asset || inv.qty <= 0) return;

    const isStatic = asset.category?.toLowerCase() === 'debt' || asset.category?.toLowerCase() === 'deuda';
    let price = 0;
    if (isStatic) {
        price = inv.costBasis / inv.qty;
    } else {
        price = Number(asset.current_price || 0);
    }
    portfolioMarketValue += inv.qty * price;
});

const totalValue = portfolioMarketValue + cashBalance;

console.log('Cash Balance:', cashBalance);
console.log('Portfolio Market Value:', portfolioMarketValue);
console.log('Total Value (Patrimonio Total):', totalValue);

// Also calculate fallback sum from assetStats logic
let assetStatsSum = 0;
assetsData.forEach(asset => {
    const assetTx = sortedTx.filter(t => t.asset_id === asset.id);
    let qty = 0;
    let costBasis = 0;
    assetTx.forEach(t => {
        const q = Number(t.quantity);
        const p = Number(t.price_per_unit);
        const f = Number(t.fee || 0);
        if (t.type === 'Buy' || t.type === 'Deposit') {
            qty += q;
            costBasis += (q * p) + f;
        } else if (t.type === 'Sell' || t.type === 'Withdrawal') {
            const avgCost = qty > 0 ? costBasis / qty : 0;
            const costOfSold = q * avgCost;
            qty -= q;
            costBasis -= costOfSold;
        }
    });
    const isStatic = ['capital', 'debt', 'deuda'].includes(asset.category?.toLowerCase());
    const price = isStatic ? 1.0 : Number(asset.current_price || 0);
    const val = isStatic ? costBasis : qty * price;
    assetStatsSum += val;
});

console.log('Asset Stats Sum (Fallback):', assetStatsSum);
