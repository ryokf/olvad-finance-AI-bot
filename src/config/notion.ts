import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();
export const notion = new Client({ auth: process.env.NOTION_API_KEY! });
// export const NOTION_INCOMES_DB_ID = process.env.NOTION_DATABASE_INCOMES_ID!;
export const NOTION_INCOMES_DB_ID = process.env.NOTION_DATABASE_INCOMES_ID || "";
export const NOTION_EXPENSES_DB_ID = process.env.NOTION_DATABASE_EXPENSES_ID || "";
export const NOTION_FINANCE_PAGE_ID = process.env.NOTION_FINANCE_PAGE_ID || "";