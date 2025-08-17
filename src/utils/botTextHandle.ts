import { parseWithGemini } from "../services/modelAiService";
import { getBalance, saveTransactions } from "../services/transactionService";

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
        const balance = await getBalance()

        if (typeof parsed === 'string') {
            ctx.reply(parsed);
            return;
        }

        console.log(parsed)
        await saveTransactions(parsed)

        const parsedSentToUser = parsed
            ? `📊 Hasil Pencatatan:\n
Jenis: ${parsed.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
Jumlah: Rp${parsed.amount.toLocaleString('id-ID')}
Kategori: ${parsed.category || '-'}
Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n
Catatan: ${parsed.note || '-'}\n
SALDO SEKARANG = Rp${balance.toLocaleString('id-ID')}\n
Items: ${JSON.stringify(parsed.items, null, 2) || '-'}
`
            : 'Tidak dapat memproses input.';

        await ctx.reply(parsedSentToUser);

    } catch (e) {
        console.error(e)
    }
}