const { normalizeAmount } = require('../utils/normalize.js');


function classifyAndStructure(ocrText) {
    console.log("Step 3 & 4 : Classifying amounts and structuring final output...");

    const classificationRules = {
        total_bill: ['Gross Amount'],
        subtotal: ['Total net', 'Fare', 'Net Amount'],
        tax: ['Total CGST Amount', 'Total SGST/UTGST Amount', 'CGST', 'SGST', 'UTGST'],
    };

    const currencyMatch = ocrText.match(/\b(INR|Rs\.?|₹)\b/i);
    const currency = currencyMatch ? "INR" : "UNKNOWN";

    const amounts = [];
    const foundLines = new Set();

    const lines = ocrText.split('\n').filter(line => line.trim() !== '');

    for (const line of lines) {
        if (foundLines.has(line)) continue;

        for (const type in classificationRules) {
            const keywords = classificationRules[type];
            for (const keyword of keywords) {
                const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
                if (keywordRegex.test(line)) {
                    
                    // A more forgiving regex to find numbers, including those with OCR errors.
                    const amountMatch = line.match(/([\d,lOS.]+\d)\b/i);

                    if (amountMatch && amountMatch[0]) {
                        // Use the normalization function to clean the raw OCR text.
                        const value = normalizeAmount(amountMatch[0]);
                        
                        if (value !== null) { // Check if normalization was successful
                            amounts.push({
                                type: type,
                                value: value,
                                source: `text: '${line.trim()}'`
                            });
                            foundLines.add(line);
                            break; 
                        }
                    }
                }
            }
            if (foundLines.has(line)) break;
        }
    }

    // Corrected deduplication: Uses the unique source text as the key to
    // prevent discarding different items that have the same value.
    const uniqueAmounts = [...new Map(amounts.map(item => [item.source, item])).values()];
    
    uniqueAmounts.sort((a, b) => {
        if (a.type === 'total_bill') return 1;
        if (b.type === 'total_bill') return -1;
        return 0;
    });

    if (uniqueAmounts.length === 0) {
        return { status: "no_amounts_found", reason: "Could not identify any classified amounts from the document." };
    }

    return {
        currency: currency,
        amounts: uniqueAmounts,
        status: "ok"
    };
}


module.exports = { classifyAndStructure };