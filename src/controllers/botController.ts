import { Telegraf } from "telegraf";
import { welcomeMessage } from "../constant/welcomeMessage";
import { botPhotoHandle } from "../utils/botPhotoHandle";
import { botTextHandle } from "../utils/botTextHandle";

export function setupBotHandlers(bot: Telegraf) {
    bot.on('photo', async (ctx) => {
        try {
            botPhotoHandle(ctx);
        } catch (error) {
            console.error('Error processing image:', error);
            await ctx.reply('Sorry, there was an error processing your receipt. Please try again.');
        }
    });

    bot.on('text', async (ctx) => {
        botTextHandle(ctx);
    })

    bot.command('start', async (ctx) => {
        const welcome = welcomeMessage

        await ctx.reply(welcome);
    });

    return bot;
}