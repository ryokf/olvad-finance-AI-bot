import { TIMEZONE } from "../config/constants";

export const createJsonPrompt = (userText: string, now: string, menus: any[]) => {
    return `
Kamu adalah parser transaksi untuk pembukuan warung kopi di Indonesia.
TUGAS:
Ubah pesan user menjadi JSON **VALID** persis dengan skema di bawah. 
WAJIB: keluarkan HANYA JSON (tanpa teks lain), gunakan **nama field tepat** seperti di skema.

SKEMA FINAL (wajib diikuti):
{
  "type": "income" | "expense",
  "amount": number,
  "method": string,
  "note": string,
  "ts": "ISO 8601 (zona Asia/Jakarta)",
  "items": [
    {
      "name": string,
      "price": number, <- untuk pengeluaran
      "qty": number, <- untuk pemasukan
    }
  ]
}


DAFTAR MENU:
${menus.map(menu => `- ${menu.name}: ${menu.price}`).join("\n")}

Kaidah:
- Bahasa: Indonesia.
- Mata uang default: IDR (Indonesia).
- Jika nominal ditulis "50k/50rb/50.000", artikan sebagai 50000.
- Pahami padanan kata:
  income: "masuk", "penjualan", "qris masuk", "dapat uang", "investasi"
  expense: "keluar", "beli", "belanja", "bayar", "gaji", "sewa"
- jika menu disebutkan, gunakan nama menu dan harga dari daftar menu. 
- jika tidak disebutkan, isi harga dengan 0.
- method bisa berisi: "cash", "qris", "transfer" dengan "cash" sebagai default.
- Waktu:
  - Jika user menulis "kemarin", "barusan", jam tertentu, konversi ke ISO 8601 dengan zona ${TIMEZONE}.
  - Jika tidak disebut, pakai waktu saat ini: ${now} (anggap zona ${TIMEZONE}).
- category: 
  - untuk pengeluaran isi dengan kategori yang sesuai contoh : "operasional", "marketing", "RnD", "investasi"
  - untuk pemasukan isi dengan kategori yang sesuai contoh : "penjualan produk", "hasil investasi", "tambahan dana"
- note: ringkas isi transaksi yang dilakukan.
- items: isi daftar item yang dibeli dengan format JSON
- isi data item hanya jika transaksi produk, bahan, atau alat, dan sejenisnya. kosongkan item jika transaksi berupa mendapat tambahan dana, investasi, atau sejenisnya.
- is_data_test: jika disebutkan bahwa ini data test, isi dengan true

CONTOH BENAR PENGELUARAN (wajib tiru struktur & nama field):
Input: "beli gula 20k dan cup 30k kemarin 19.30"
Output:
{
  "type": "expense",
  "amount": 50000,
  "method": "cash",
  "note": "pembelian gula dan cup dengan pembayaran cash pada pukul 19:30",
  "category": "operasional",
  "ts": "2025-08-15T19:30:00+07:00",
  "is_data_test": false,
  "items": [
    {
      "name": "gula",
      "price": 20000
    },
    {
      "name": "cup",
      "price": 30000
    }
  ]
}

CONTOH BENAR PEMASUKAN (wajib tiru struktur & nama field):
Input: "ini data test 2 cappucino 3 americano"
Output:
{
  "type": "income",
  "amount": 40000,
  "method": "cash",
  "note": "penjualan 2 cappucino dan 3 americano dengan pembayaran cash",
  "category": "penjualan produk",
  "ts": "2025-08-15T19:30:00+07:00",
  "is_data_test": true,
  "items": [
    {
      "name": "cappucino",
      "qty": 2
    },
    {
      "name": "americano",
      "qty": 3
    }
  ]
}

Sekarang proses input ini persis mengikuti skema di atas, dan KELUARKAN HANYA JSON:
"${userText}"
`.trim();
};
