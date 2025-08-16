import { saveTransactions } from "../services/transactionService";
import { parseWithGemini } from "../services/modelAiService";
import { Telegraf } from "telegraf";
import { welcomeMessage } from "../constant/welcomeText";

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
            await ctx.reply(parsed ? JSON.stringify(parsed, null, 2) : 'Tidak dapat memproses input.');
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