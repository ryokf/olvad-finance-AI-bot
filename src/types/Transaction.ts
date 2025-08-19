export interface Transaction {
    type: "income" | "expense";
    amount: number;
    currency: "IDR";
    method: string;
    category: string;
    note?: string;
    timestamp: string;
}

export type Tx = {
    id: string;
    ts: string;
    category?: string;  // Made optional
    amount: number;
    method?: string;
    type: "income" | "expense";
    note?: string;
    items?: string;
    raw_text?: string;
};
