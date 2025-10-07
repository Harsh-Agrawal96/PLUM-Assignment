const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const cors = require('cors');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;


// Enable CORS
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function performOCR(imageBuffer) {
    console.log("Step 1: Performing OCR on the image...");
    try {
        const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
        console.log("OCR Result:\n---", `\n${text}`, "\n---");
        return text;
    } catch (error) {
        console.error("Error during OCR process:", error);
        throw new Error("Failed to perform OCR on the image.");
    }
}


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


function classifyAndStructure(ocrText) {
    console.log("Step 3 & 4 (Improved): Classifying amounts and structuring final output...");

    // More detailed rules to capture different types of amounts
    const classificationRules = {
        total_bill: ['Gross Amount'],
        subtotal: ['Total net', 'Fare', 'Net Amount'],
        tax: ['Total CGST Amount', 'Total SGST/UTGST Amount', 'CGST', 'SGST', 'UTGST'],
    };

    // Find currency hints (same as before)
    const currencyMatch = ocrText.match(/\b(INR|Rs\.?|₹)\b/i);
    const currency = currencyMatch ? "INR" : "UNKNOWN";

    const amounts = [];
    const foundLines = new Set(); // To avoid processing a line more than once

    // Split the entire OCR text into individual lines
    const lines = ocrText.split('\n').filter(line => line.trim() !== '');

    // Iterate through each line of the document
    for (const line of lines) {
        if (foundLines.has(line)) continue;

        // For each line, check against our classification rules
        for (const type in classificationRules) {
            const keywords = classificationRules[type];

            for (const keyword of keywords) {
                // Use a regex to see if the keyword exists on this line
                const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
                if (keywordRegex.test(line)) {
                    
                    // If a keyword is found, find a monetary value ON THE SAME LINE
                    // This regex looks for numbers like 20.49, 819.70, or 860.68
                    const amountMatch = line.match(/(\d{1,3}(?:,?\d{3})*(?:\.\d{2}))/);

                    if (amountMatch && amountMatch[0]) {
                        const value = parseFloat(amountMatch[0].replace(/,/g, ''));
                        
                        if (!isNaN(value)) {
                            amounts.push({
                                type: type,
                                value: value,
                                source: `text: '${line.trim()}'`
                            });
                            foundLines.add(line); // Mark this line as processed
                            break; // Stop looking for other keywords on this line
                        }
                    }
                }
            }
            if (foundLines.has(line)) break; // Move to the next line
        }
    }

    // Deduplicate results - OCR can sometimes see the same text twice.
    // This creates a unique list based on the type and value.
    const uniqueAmounts = [...new Map(amounts.map(item => [item.source, item])).values()];
    
    // Sort the results for consistency, putting the total bill last
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

app.post('/api/extract', upload.single('billImage'), async (req, res) => {
    console.log("Received a new request to /api/extract");

    // Check if a file was uploaded
    if (!req.file) {
        return res.status(400).json({ status: "error", reason: "No image file provided. Please upload a file with the key 'billImage'." });
    }

    try {
        
        const ocrText = await performOCR(req.file.buffer);

        // check if OCR produced any meaningful text
        if (!ocrText || ocrText.trim().length < 5) {
            return res.status(400).json({ status: "no_amounts_found", reason: "Document too noisy or empty. OCR failed to produce text." });
        }

        // Classify, Normalize, and Structure the output
        const finalOutput = classifyAndStructure(ocrText);
        
        console.log("Successfully processed the image. Sending final JSON response.");
        return res.status(200).json(finalOutput);

    } catch (error) {
        console.error("An error occurred in the /api/extract endpoint:", error);
        return res.status(500).json({ status: "error", reason: "An internal server error occurred.", details: error.message });
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});