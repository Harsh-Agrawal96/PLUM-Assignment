function normalizeAmount(rawAmountStr) {
    if (!rawAmountStr) return null;
    
    const cleanedStr = rawAmountStr
        .replace(/l/g, '1')
        .replace(/O/g, '0')
        .replace(/S/g, '5')
        .replace(/,/g, '')   // Remove commas
        .replace(/\s/g, ''); // Remove spaces
        
    const number = parseFloat(cleanedStr);
    return isNaN(number) ? null : number;
}


module.exports = { normalizeAmount };