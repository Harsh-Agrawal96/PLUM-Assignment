const Tesseract = require('tesseract.js');


async function performOCR(imageBuffer) {
    console.log("Service: Performing OCR on the image...");
    try {
        const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
        console.log("OCR Result:\n---", `\n${text}`, "\n---");
        return text;
    } catch (error) {
        console.error("Error during OCR process:", error);
        throw new Error("Failed to perform OCR on the image.");
    }
}


module.exports = { performOCR };