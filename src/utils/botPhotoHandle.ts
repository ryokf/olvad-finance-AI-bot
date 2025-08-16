import { parseWithGemini } from "../services/modelAiService";
import { extractTextFromImage } from "../services/ocrService";
import { saveTransactions } from "../services/transactionService";
import axios from "axios";

export const botPhotoHandle = async (ctx: any) => {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

    // Get file info and download URL from Telegram
    const file = await ctx.telegram.getFile(fileId);
    if (!file.file_path) {
        await ctx.reply('Could not process the image. Please try again.');
        return;
    }

    // Download the image using the file path
    const fileUrl = (await ctx.telegram.getFileLink(fileId)).toString();
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);

    // Send processing message
    await ctx.reply('Processing your receipt... Please wait.');

    // Extract text from image
    const extractedText = await extractTextFromImage(imageBuffer);

    console.log(`Extracted text: ${extractedText}`);

    // Process the extracted text with Gemini
    const userId = ctx.from.id;
    const parsed = await parseWithGemini(extractedText, userId);

    if (typeof parsed === 'string') {
        ctx.reply(parsed);
        return;
    }

    console.log(parsed);
    await saveTransactions(parsed);

    const parsedSentToUser = parsed
        ? `📊 Hasil Pencatatan dari Struk:
    Jenis: ${parsed.type}
    Jumlah: Rp${parsed.amount.toLocaleString('id-ID')}
    Metode: ${parsed.method}
    Kategori: ${parsed.category}
    Catatan: ${parsed.note || '-'}
    Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`
        : 'Tidak dapat memproses struk.';

    await ctx.reply(parsedSentToUser);
}