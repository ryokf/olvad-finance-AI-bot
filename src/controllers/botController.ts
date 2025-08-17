import { Telegraf } from "telegraf";
import { welcomeMessage } from "../constant/welcomeMessage";
import { botPhotoHandle } from "../utils/botPhotoHandle";
import { botTextHandle } from "../utils/botTextHandle";
import { getReportPrompt } from "../constant/getReportPrompt";
import { model } from "../config/gemini";
import { getTransactions } from "../services/transactionService";
import { askPrompt } from "../constant/askPrompt";
import { getMenu } from "../services/menuService";

export function setupBotHandlers(bot: Telegraf) {
    bot.command('start', async (ctx) => {
        const welcome = welcomeMessage

        await ctx.reply(welcome);
    });

    bot.command('help', async (ctx) => {
        const helpMessage = `
            *Welcome to the Finance Bot!*
            Here are the commands you can use:
            /start - Start the bot
            /help - Show this help message
        `;
        await ctx.reply(helpMessage);
    });

    bot.command('report', async (ctx) => {
        const transactions = await getTransactions();

        const prompt = await getReportPrompt(transactions);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const raw = response.text();

        await ctx.reply(raw);
    });

    bot.command('ask', async (ctx) => {
        const args = ctx.message.text;
        const question: string = args.replace('/ask', '').trim();
        const menus = await getMenu();

        const transactions = await getTransactions();

        const prompt = await askPrompt(transactions,menus, question);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const raw = response.text();

        await ctx.reply(raw);
    });

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


    return bot;
}