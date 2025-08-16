import { parseWithGemini } from "../services/modelAiService";
import { saveTransactions } from "../services/transactionService";

export const botTextHandle = async (ctx: any) => {
    if (!('text' in ctx.message)) {
        return;
    }

    const text = ctx.message.text
    const userId = ctx.from.id

    console.log(`recieve message ${text} from ${userId}`)

    if (!text || !userId) {
        return;
    }

    try {
        const parsed = await parseWithGemini(text, userId)

        if (typeof parsed === 'string') {
            ctx.reply(parsed);
            return;
        }

        console.log(parsed)
        await saveTransactions(parsed)

        const parsedSentToUser = parsed
            ? `📊 Hasil Pencatatan:
Jenis: ${parsed.type}
Jumlah: Rp${parsed.amount.toLocaleString('id-ID')}
Metode: ${parsed.method}
Kategori: ${parsed.category}
Catatan: ${parsed.note || '-'}
Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`
            : 'Tidak dapat memproses input.';

        await ctx.reply(parsedSentToUser);

    } catch (e) {
        console.error(e)
    }
}