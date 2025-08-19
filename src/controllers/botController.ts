import { Telegraf } from "telegraf";
import { welcomeMessage } from "../constant/welcomeMessage";
import { botPhotoHandle } from "../utils/botPhotoHandle";
import { botTextHandle } from "../utils/botTextHandle";
import { getReportPrompt } from "../prompt/getReportPrompt";
import { model } from "../config/gemini";
import { getTransactions } from "../services/transactionService";
import { askPrompt } from "../prompt/askPrompt";
import { getMenu } from "../services/menuService";
import { getIngredients } from "../services/ingredientsService";
import { getMenuIngredients } from "../services/menuIngredientsService";
import { productPrompt } from "../prompt/productPrompt";

export function setupBotHandlers(bot: Telegraf) {
    bot.command('start', async (ctx) => {
        const welcome = welcomeMessage

        await ctx.reply(welcome);
    });

    bot.command('help', async (ctx) => {
        const helpMessage = `
            *Welcome to the Olvad Intelligence Bot!*
            Here are the commands you can use:
            /start - Start the bot
            /help - Show this help message
            /finance <question> - Ask financial questions about your business
            /menu - Ask about menu items
        `;
        await ctx.reply(helpMessage);
    });

    bot.command('finance', async (ctx) => {
        const args = ctx.message.text;
        const question: string = args.replace('/finance', '').trim();
        const menus = await getMenu();

        const transactions = await getTransactions();

        if (question === "report") {
            const prompt = await getReportPrompt(transactions);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const raw = response.text();

            await ctx.reply(raw);
            return;
        }

        const prompt = await askPrompt(transactions, menus, question);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const raw = response.text();

        await ctx.reply(raw);
    });

    bot.command('menu', async (ctx) => {
        const args = ctx.message.text;
        const question: string = args.replace('/menu', '').trim();

        const menus = await getMenu();
        const ingredients = await getIngredients();
        const menuIngredients = await getMenuIngredients();

        const prompt = await productPrompt(question, menus, ingredients, menuIngredients);
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