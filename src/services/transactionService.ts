import { supabase } from "../config/supabase";

export const saveTransactions = async (transactions: any) => {
    // Simulate saving transactions to a database
    const { error } = await supabase
        .from('transactions')
        .insert(transactions);

    if (error) {
        console.error("Error saving transactions:", error);
        return false;
    } else {
        console.log("Transactions saved successfully");
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
