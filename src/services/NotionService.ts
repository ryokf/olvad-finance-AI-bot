const DASHBOARD_CONTAINER_TITLE = "[AUTO] Ringkasan Keuangan";
import { notion, NOTION_FINANCE_PAGE_ID } from "../config/notion";
import { supabase } from "../config/supabase";
import { upsertTransactionToNotion } from "./notionSync";
import type { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';


export async function syncAllTransactions() {
    const { data, error } = await supabase
        .from('transactions')
        .select('*'); // ambil semua data

    if (error) throw error;

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
        // Cari toggle block dengan judul khusus
        const found = res.results.find((b: any) =>
            b.type === "toggle" &&
            Array.isArray(b.toggle?.rich_text) &&
            b.toggle.rich_text[0]?.plain_text === DASHBOARD_CONTAINER_TITLE
        );
        if (found) {
            return (found as any).id;
        }
        if (!(res as any).has_more) break;
        cursor = (res as any).next_cursor;
    }
    // Jika belum ada, buat toggle container kosong
    const created = await notion.blocks.children.append({
        block_id: pageId,
        children: [
            {
                type: "toggle",
                toggle: {
                    rich_text: [{ type: "text", text: { content: DASHBOARD_CONTAINER_TITLE } }],
                    children: []
                }
            }
        ],
    });
    return (created as any).results[0].id;
}

export async function updateDashboard(summary: { balance: number; incomeMonth: number; expenseMonth: number; }) {

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