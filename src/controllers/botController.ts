import { saveTransactions } from "../services/transactionService";
import { parseWithGemini } from "../services/modelAiService";
import { Telegraf } from "telegraf";
import { welcomeMessage } from "../constant/welcomeMessage";

export function setupBotHandlers(bot: Telegraf) {
    bot.on('text', async (ctx) => {
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
    })

    bot.command('start', async (ctx) => {
        const welcome = welcomeMessage

        await ctx.reply(welcome);
    });

    return bot;
}