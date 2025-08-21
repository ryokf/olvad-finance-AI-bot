import { Request, Response } from 'express';
import { syncAllTransactions, updateDashboard } from '../services/NotionService';
import { supabase } from '../config/supabase';

// Middleware to verify API key
// const validateApiKey = (req: Request, res: Response, next: any): void => {
//     const apiKey = req.headers['x-api-key'];
//     const validApiKey = process.env.API_KEY; // Make sure to add this to your .env file

//     if (!apiKey || apiKey !== validApiKey) {
//         res.status(401).json({ error: 'Invalid API key' });
//         return;
//     }

//     next();
// };

// Sync all transactions from Supabase to Notion
export async function syncTransactions(_req: Request, res: Response): Promise<void> {
    try {
        await syncAllTransactions();
        res.status(200).json({ message: 'Transactions synced successfully' });
        return;
    } catch (error) {
        console.error('Error syncing transactions:', error);
        res.status(500).json({ error: 'Failed to sync transactions' });
        return;
    }
}

// Get financial summary and update Notion dashboard
export async function updateFinancialDashboard(_req: Request, res: Response): Promise<void> {
    try {
        // Get current month's data
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        // Get incomes
        const { data: incomes, error: incomeError } = await supabase
            .from('transactions')
            .select('amount')
            .eq('type', 'income')
            .gte('ts', startOfMonth)
            .lte('ts', endOfMonth);

        if (incomeError) throw incomeError;

        // Get expenses
        const { data: expenses, error: expenseError } = await supabase
            .from('transactions')
            .select('amount')
            .eq('type', 'expense')
            .gte('ts', startOfMonth)
            .lte('ts', endOfMonth);

        if (expenseError) throw expenseError;

        // Calculate totals
        const incomeMonth = incomes?.reduce((sum, tx) => sum + (tx.amount || 0), 0) ?? 0;
        const expenseMonth = expenses?.reduce((sum, tx) => sum + (tx.amount || 0), 0) ?? 0;
        const balance = incomeMonth - expenseMonth;

        // Update Notion dashboard
        await updateDashboard({ balance, incomeMonth, expenseMonth });

        res.status(200).json({
            message: 'Dashboard updated successfully',
            data: { balance, incomeMonth, expenseMonth }
        });
        return;
    } catch (error) {
        console.error('Error updating dashboard:', error);
        res.status(500).json({ error: 'Failed to update dashboard' });
        return;
    }
}

// Initialize routes
export function initializeNotionRoutes(app: any) {
    app.get('/', (_req: Request, res: Response) => {
        res.send('Notion API');
    });

    // Web-friendly sync endpoint: run sync, then auto-close tab and jump back to Notion
    app.get('/api/notion/sync-web', async (req: Request, res: Response) => {
        try {
            await syncAllTransactions();
            const redirect = (req.query.redirect as string) || 'notion://';
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            // Try to close the window (works if opened via window.open); fallback to redirect
            res.send(`<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="refresh" content="0;url=${redirect}">
  <title>Sync selesai</title>
  <style>
    :root { color-scheme: light dark; }
    body{background:#ffffff;color:#111;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:0;padding:24px;line-height:1.5}
    .btn{display:inline-block;padding:10px 16px;border-radius:8px;background:#2b6cb0;color:#fff !important;text-decoration:none;font-weight:600}
    .muted{color:#6b7280;margin-top:10px}
    .wrap{max-width:560px;margin:0 auto}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>✅ Sync selesai</h1>
    <p class="muted">Jika tidak otomatis kembali, ketuk tombol di bawah untuk membuka Notion.</p>
    <p><a class="btn" href="${redirect}" target="_self" rel="noopener">Kembali ke Notion</a></p>
  </div>
  <script>
    (function(){
      // 1) Coba tutup tab jika di-open oleh window.open (beberapa webview mengizinkan)
      try { if (window.opener) window.close(); } catch(e) {}
      // 2) Coba redirect langsung
      try { location.replace('${redirect}'); } catch(e) {}
      // 3) Fallback retry
      setTimeout(function(){
        try { location.href = '${redirect}'; } catch(e) {}
      }, 400);
    })();
  </script>
</body>
</html>`);
            return;
        } catch (err) {
            console.error('Error syncing transactions (web):', err);
            res.status(500).send('Gagal melakukan sync');
            return;
        }
    });
}
