interface Transaction {
  type: "income" | "expense";
  amount: number;
  currency: "IDR";
  method: string;
  category: string;
  note: string;
  timestamp: string;
}
