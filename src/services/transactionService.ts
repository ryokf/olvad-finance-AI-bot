import { supabase } from "../config/supabase";
import { upsertTransactionToNotion } from "./notionSync";
import { Tx } from "../types/Transaction";
import { updateDashboard } from "./NotionService";

interface SupabaseTransaction {
    id: string;
    ts: string;
    type: 'income' | 'expense';
    amount: number;
    method: string
    note?: string;
    items_summary?: string;
    category?: string;
    items?: { name?: string; qty?: number; price?: number }[];
}

export const saveTransactions = async (transactions: Partial<SupabaseTransaction>) => {
    // Save transactions to Supabase
    const { data: insertedTx, error } = await supabase
        .from('transactions')
        .insert(transactions)
        .select()
        .single();

    await updateDashboard(await getSummary());

    if (error) {
        console.error("Error saving transactions:", error);
        return false;
    } else {
        try {
            if (!insertedTx) {
                throw new Error("No transaction data returned from Supabase");
            }

            const detailItems: string = (insertedTx.items ?? []).map((item: { name?: string; qty?: number; price?: number }) => (
                `- ${item.name ?? ''} ${!item.qty ? '' : 'x ' + item.qty} ${!item.price ? '' : 'Rp' + item.price} \n`
            )).join("");

            console.log("Detail items:", detailItems);

            // Convert Supabase data to Notion format
            const notionTx: Tx = {
                id: insertedTx.id,
                ts: insertedTx.ts,
                amount: insertedTx.amount,
                method: insertedTx.method,
                type: insertedTx.type,
                note: insertedTx.note,
                items: detailItems,
                // Provide default category if not available
                category: insertedTx.category || 'Uncategorized',
                raw_text: insertedTx.raw_text
            };

            await upsertTransactionToNotion(notionTx);
            console.log("Transactions saved successfully:", insertedTx);
        } catch (error) {
            console.error("Error saving transactions to Notion:", error);
        }
    }

    return true;
};

export const getTransactions = async () => {
    const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, note, ts, items')
        .eq('is_data_test', false);

    if (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }

    return data;
};

export const getBalance = async () => {
    const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('is_data_test', false)

    if (error) {
        console.error("Error fetching balance:", error);
        return 0;
    }

    const balance = data.reduce((acc: number, tx: any) => {
        return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
    }, 0);

    return balance;
};

export async function getSummary() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from("transactions")
        .select("type, amount, ts")
        .eq("is_data_test", false);

    if (error) throw error;

    let balance = 0;
    let incomeMonth = 0;
    let expenseMonth = 0;

    for (const tx of data ?? []) {
        balance += tx.type === "income" ? tx.amount : -tx.amount;

        if (new Date(tx.ts) >= startOfMonth) {
            if (tx.type === "income") incomeMonth += tx.amount;
            if (tx.type === "expense") expenseMonth += tx.amount;
        }
    }

    return { balance, incomeMonth, expenseMonth };
}
