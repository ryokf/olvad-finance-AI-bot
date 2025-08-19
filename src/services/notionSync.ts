import { notion, NOTION_EXPENSES_DB_ID, NOTION_INCOMES_DB_ID } from "../config/notion";
import { Tx } from '../types/Transaction';

function txToProps(tx: Tx) {
    const props: Record<string, any> = {
        ID: { rich_text: [{ text: { content: tx.id } }] },
        'Title': { 
            title: [{
                type: 'text',
                text: { 
                    content: `${tx.category} - ${tx.amount} (${tx.method})` 
                }
            }]
        },
        Date: { date: { start: tx.ts } },
        Amount: { number: tx.amount },
        Category: { rich_text: [{ text: { content: tx.category } }] },
        'Raw Text': { rich_text: [{ text: { content: tx.raw_text } }] },
    };

    // Add optional properties only if they exist
    if (tx.method) {
        props.Method = { rich_text: [{ text: { content: tx.method } }] };
    }
    if (tx.note) {
        props.Note = { rich_text: [{ text: { content: tx.note } }] };
    }
    if (tx.items) {
        props.Items = { rich_text: [{ text: { content: tx.items } }] };
    }

    return props;
}

/** Cari page Notion berdasarkan External ID (exact match) */
async function findPageByExternalId(externalId: string, database_id: string) {
    const res = await notion.databases.query({
        database_id,
        filter: {
            property: "ID", // Assuming "ID" is the property name for external ID
            rich_text: { equals: externalId },
        },
        page_size: 1,
    });
    return res.results[0] ?? null;
}

/** Upsert transaksi ke Notion */
export async function upsertTransactionToNotion(tx: Tx) {
    const props = txToProps(tx);
    const existing = await findPageByExternalId(tx.id, tx.type === 'income' ? NOTION_INCOMES_DB_ID : NOTION_EXPENSES_DB_ID);

    console.log("Upserting transaction to Notion:", tx.id, existing ? "Updating" : "Creating");

    if (existing) {
        await notion.pages.update({
            page_id: existing.id,
            properties: props,
        });
        return { action: 'updated', pageId: existing.id };
    } else {
        const created = await notion.pages.create({
            parent: { database_id: tx.type === 'income' ? NOTION_INCOMES_DB_ID : NOTION_EXPENSES_DB_ID },
            properties: props,
        });
        return { action: 'created', pageId: created.id };
    }
}