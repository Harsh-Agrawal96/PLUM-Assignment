const { performOCR } = require('../services/performOcr.js');
const { classifyAndStructure } = require('../services/classifyTextStructure.js');


const billHandleController = async (req, res) => {
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
}


module.exports = { billHandleController }