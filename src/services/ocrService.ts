import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    return await sharp(imageBuffer)
        // Convert to grayscale
        .grayscale()
        // Increase contrast
        .normalize()
        // Remove noise
        .median(1)
        // Threshold to make text more clear
        .threshold(128)
        // Ensure consistent size
        .resize(1500, null, {
            withoutEnlargement: true,
            fit: 'inside'
        })
        // Output as PNG for better quality
        .png()
        .toBuffer();
}

export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    const worker = await createWorker('eng');
    
    try {
        // Configure Tesseract for receipt processing
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:-()/@#&%+=Rp ', // Common characters in receipts
            preserve_interword_spaces: '1',
            tessedit_ocr_engine_mode: 3, // Use Legacy + LSTM mode for better accuracy
        });

        // Preprocess the image
        const preprocessedImage = await preprocessImage(imageBuffer);
        
        // Perform OCR
        const { data: { text } } = await worker.recognize(preprocessedImage);
        
        await worker.terminate();
        
        // Clean up the extracted text
        const cleanedText = text
            .replace(/[\r\n]+/g, '\n') // Replace multiple newlines with single newline
            .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
            .trim();
        
        return cleanedText;
    } catch (error) {
        console.error('Error in OCR processing:', error);
        throw new Error('Failed to extract text from image');
    }
}
