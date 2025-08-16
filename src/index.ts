import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import { setupBotHandlers } from './controllers/botController';


// Load env
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) throw new Error('BOT_TOKEN is not set');

const bot = new Telegraf(BOT_TOKEN);

// Wire handlers and launch
setupBotHandlers(bot);
bot.launch().then(() => console.log('Bot berjalan.'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));