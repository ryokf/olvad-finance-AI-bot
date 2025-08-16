import { supabase } from "../config/supabase";

export const saveTransactions = async (transactions: any) => {
    // Simulate saving transactions to a database
    const { error } = await supabase
        .from('transactions')
        .insert(transactions);

    if (error) {
        console.error("Error saving transactions:", error);
        return false;
    }else{
        console.log("Transactions saved successfully");
    }

    return true;
};
