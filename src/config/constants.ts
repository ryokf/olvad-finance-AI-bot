import { SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();
export const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

export const transactionSchema = {
    type: SchemaType.OBJECT,
    properties: {
        type: { type: SchemaType.STRING, enum: ['income', 'expense'] },
        amount: { type: SchemaType.NUMBER },
        currency: { type: SchemaType.STRING, default: 'IDR' },
        category: { type: SchemaType.STRING },
        method: { type: SchemaType.STRING },
        note: { type: SchemaType.STRING },
        ts: { type: SchemaType.STRING }
    },
    required: ['type', 'amount', 'ts']
};
