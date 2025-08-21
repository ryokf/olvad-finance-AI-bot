import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import express from 'express';
import { setupBotHandlers } from './controllers/botController';
import { initializeNotionRoutes } from './controllers/notionController';

// Load env
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) throw new Error('BOT_TOKEN is not set');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize Telegram bot
const bot = new Telegraf(BOT_TOKEN);
setupBotHandlers(bot);

// Initialize API routes
initializeNotionRoutes(app);

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Launch the bot after server is ready
    bot.launch().then(() => console.log('Bot berjalan.'));
});

// Graceful shutdown
process.once('SIGINT', () => {
    bot.stop('SIGINT');
    process.exit(0);
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    process.exit(0);
});