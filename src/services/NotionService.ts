const DASHBOARD_CONTAINER_TITLE = "[AUTO] Ringkasan Keuangan";
import { notion, NOTION_FINANCE_PAGE_ID, NOTION_INCOMES_DB_ID, NOTION_EXPENSES_DB_ID } from "../config/notion";
import { supabase } from "../config/supabase";
import { upsertTransactionToNotion } from "./notionSync";
import type { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';
import { getSummary } from "./transactionService";


async function deleteAllNotionRecords(databaseId: string) {
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
        const response = await notion.databases.query({
            database_id: databaseId,
            start_cursor: startCursor,
        });

        // Delete each page in the current batch
        for (const page of response.results) {
            await notion.pages.update({
                page_id: page.id,
                archived: true, // This will delete/archive the page
            });
        }

        hasMore = response.has_more;
        startCursor = response.next_cursor as string;
    }
}

export async function syncAllTransactions() {
    // Delete all existing records from both databases
    await deleteAllNotionRecords(NOTION_INCOMES_DB_ID);
    await deleteAllNotionRecords(NOTION_EXPENSES_DB_ID);

    // Get all transactions from Supabase
    const { data, error } = await supabase
        .from('transactions')
        .select('*'); // ambil semua data

    if (error) throw error;

    // Add new records
    for (const row of data ?? []) {
        await upsertTransactionToNotion({
            id: row.id,
            ts: row.ts,
            type: row.type,
            amount: row.amount,
            method: row.method,
            note: row.note,
            items: row.items_summary,
            category: row.category,
            raw_text: row.raw_text
        });
    }

    await updateDashboard(await getSummary());
}

// Helper untuk menghapus semua child blocks dari sebuah page
async function clearPageChildren(pageId: string) {
    let cursor: string | undefined = undefined;
    do {
        const res = await notion.blocks.children.list({
            block_id: pageId,
            page_size: 100,
            start_cursor: cursor,
        });
        // Archive each child block (deletion in Notion API = archived: true)
        for (const child of res.results) {
            await notion.blocks.update({
                block_id: (child as any).id,
                archived: true,
            });
        }
        cursor = (res as any).has_more ? (res as any).next_cursor : undefined;
    } while (cursor);
}

// Cari (atau buat) container khusus untuk dashboard agar tidak menghapus konten lain di page
async function getOrCreateDashboardContainer(pageId: string): Promise<string> {
    let cursor: string | undefined = undefined;
    while (true) {
        const res = await notion.blocks.children.list({
            block_id: pageId,
            page_size: 100,
            start_cursor: cursor,
        });
        // Cari callout block dengan judul khusus
        const found = res.results.find((b: any) =>
            b.type === "callout" &&
            Array.isArray(b.callout?.rich_text) &&
            b.callout.rich_text[0]?.plain_text === DASHBOARD_CONTAINER_TITLE
        );
        if (found) {
            return (found as any).id;
        }
        if (!(res as any).has_more) break;
        cursor = (res as any).next_cursor;
    }
    // Jika belum ada, buat callout container kosong
    const created = await notion.blocks.children.append({
        block_id: pageId,
        children: [
            {
                type: "callout",
                callout: {
                    rich_text: [{ type: "text", text: { content: DASHBOARD_CONTAINER_TITLE } }],
                    icon: { type: "emoji", emoji: "🧾" },
                    color: "gray_background",
                    children: []
                }
            }
        ],
    });
    return (created as any).results[0].id;
}

export async function updateDashboard(summary: { balance: number; incomeMonth: number; expenseMonth: number; }) {

    // NOTE: Letakkan callout ini di posisi paling atas secara manual sekali saja di Notion UI.
    // Setelah itu kode hanya akan membersihkan & mengisi ulang isi di dalam callout ini.

    const now = new Date();
    const lastSyncText = `Last Sync : ${now.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}`;
    const subTitle = (s: string): BlockObjectRequest => ({
        type: "heading_2",
        heading_2: { rich_text: [{ type: "text", text: { content: s } }] }
    });
    const heading = (s: string): BlockObjectRequest => ({
        type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: s } }] }
    });
    const para = (s: string): BlockObjectRequest => ({
        type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: s } }] }
    });
    const card = (
        title: string,
        value: string,
        color: "blue_background" | "green_background" | "brown_background",
        emoji: string
    ): any => ({
        type: "callout",
        callout: {
            rich_text: [{ type: "text", text: { content: "" } }],
            icon: { type: "emoji", emoji },
            color,
            children: [subTitle(title), heading(value)],
        },
    });

    const columnList: BlockObjectRequest = {
        type: "column_list",
        column_list: {
            children: [
                {
                    type: "column",
                    column: {
                        children: [
                            card("Saldo Sekarang", `Rp ${summary.balance.toLocaleString("id-ID")}`, "blue_background", "💰"),
                        ]
                    }
                },
                {
                    type: "column",
                    column: {
                        children: [
                            card("Pemasukan Bulan Ini", `Rp ${summary.incomeMonth.toLocaleString("id-ID")}`, "green_background", "📈"),
                        ]
                    }
                },
                {
                    type: "column",
                    column: {
                        children: [
                            card("Pengeluaran Bulan Ini", `Rp ${summary.expenseMonth.toLocaleString("id-ID")}`, "brown_background", "💸"),
                        ]
                    }
                },
            ]
        }
    };

    // Hanya bersihkan isi di dalam container khusus dashboard, bukan seluruh halaman
    const containerId = await getOrCreateDashboardContainer(NOTION_FINANCE_PAGE_ID);
    await clearPageChildren(containerId);
    await notion.blocks.children.append({
        block_id: containerId,
        children: [
            para(lastSyncText),
            columnList,
        ] as any,
    });
}