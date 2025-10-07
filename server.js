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
    console.log("Step 3 & 4: Classifying amounts and structuring final output...");

    // Define keywords and their corresponding types
    const classificationRules = {
        total_bill: /\b(total|t0tal|net amount|grand total)\b[\s:.-]*((?:[rR][sS]\.?\s*)?[\d,lO.]+)/i,
        paid:       /\b(paid|pald|cash|received)\b[\s:.-]*((?:[rR][sS]\.?\s*)?[\d,lO.]+)/i,
        due:        /\b(due|balance|amount due)\b[\s:.-]*((?:[rR][sS]\.?\s*)?[\d,lO.]+)/i,
    };
    
    // Find currency hints
    const currencyMatch = ocrText.match(/\b(INR|Rs\.?|₹)\b/i);
    const currency = currencyMatch ? "INR" : "UNKNOWN"; // Default or derived currency

    const amounts = [];
    const foundValues = new Set();

    for (const type in classificationRules) {
        const regex = classificationRules[type];
        const match = ocrText.match(regex);
        
        if (match && match[2]) {
            const rawValue = match[2];
            const normalizedValue = normalizeAmount(rawValue);
            
            // Avoid adding duplicate values if multiple keywords match the same number
            if (normalizedValue !== null && !foundValues.has(normalizedValue)) {
                amounts.push({
                    type: type,
                    value: normalizedValue,
                    source: `text: '${match[0].trim()}'` // Provenance
                });
                foundValues.add(normalizedValue);
            }
        }
    }

    // Guardrail / Exit Condition
    if (amounts.length === 0) {
        return { status: "no_amounts_found", reason: "Could not identify any classified amounts from the document." };
    }

    return {
        currency: currency,
        amounts: amounts,
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