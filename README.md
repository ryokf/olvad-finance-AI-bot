# Olvad Finance AI Bot

**Olvad Finance AI Bot** adalah bot Telegram berbasis AI yang dirancang untuk membantu pemilik warung kopi mengelola transaksi keuangan secara cepat dan terstruktur.  Bot ini menggunakan model AI generatif untuk memproses teks maupun foto struk, menyimpan data ke **Supabase**, dan menyinkronkan transaksi ke **Notion** untuk pembuatan dashboard keuangan otomatis.

Bot ditulis menggunakan TypeScript dan memanfaatkan berbagai library seperti **Telegraf** untuk interaksi Telegram, **@google/generative ai** (Gemini) untuk parsing teks dan pertanyaan analitis, **tesseract.js** untuk OCR struk, serta **@notionhq/client** untuk pembaruan dashboard keuangan di Notion.  Struktur aplikasi modular memudahkan pengembangan dan pemeliharaan.

## Fitur

* **Pencatatan transaksi teks** — Pesan teks yang dikirim ke bot akan diproses oleh model Gemini menjadi JSON sesuai skema transaksi.  Logika ini diatur pada fungsi `parseWithGemini` dan `botTextHandle`, yang menyimpan hasil parse ke basis data dan menampilkan ringkasan transaksi beserta saldo terkini kepada pengguna【237398157318541†L18-L38】.
* **Pencatatan transaksi dari foto** — Bot menerima foto struk, melakukan pra‑prosesing gambar dan Optical Character Recognition (OCR) menggunakan `sharp` dan `tesseract.js`, lalu mengirim teks hasil OCR ke model Gemini untuk diubah menjadi data transaksi.  Bot kemudian menyimpan transaksi dan mengirim ringkasan kepada pengguna【948087346764556†L22-L50】.
* **Model AI Generatif** — Bot menggunakan model Gemini (`gemini‑2.5‑flash`) melalui paket `@google/generative‑ai`.  Prompt khusus mendeskripsikan skema JSON transaksi dan kaidah bahasa serta mata uang Indonesia【444258841296287†L4-L55】.  Model juga digunakan untuk menjawab pertanyaan analitis seperti laporan pendapatan atau penjualan tertentu【687670910308269†L0-L22】.
* **Database Supabase** — Transaksi, menu, bahan, dan relasi menu–bahan disimpan di Supabase.  Service `transactionService` menyediakan fungsi untuk menyimpan transaksi, menghitung saldo/income/expense bulanan, serta mengambil data transaksi【223442797724922†L17-L82】.
* **Integrasi Notion** — Bot dapat menyinkronkan transaksi ke basis data Notion (incomes & expenses) dan memperbarui callout dashboard pada halaman keuangan.  Fungsi `updateDashboard` membuat komponen callout yang menampilkan saldo, pemasukan, dan pengeluaran bulan berjalan【773442386856570†L93-L161】.
* **Pertanyaan laporan dan menu** — Perintah `/finance` memungkinkan pengguna menanyakan laporan keuangan atau mengajukan pertanyaan spesifik terkait transaksi, sedangkan `/menu` memanfaatkan data menu dan bahan dari Supabase untuk menganalisis penjualan menu【921579727637463†L34-L57】【921579727637463†L59-L73】.  Perintah `/sync` melakukan sinkronisasi semua transaksi ke Notion【921579727637463†L76-L83】.
* **Bahasa Indonesia** — Semua prompt dan pesan bot dikonfigurasikan menggunakan bahasa Indonesia sesuai penggunaan warung kopi.

## Persyaratan

1. **Node.js ≥ 18** dan **npm** atau **yarn**.
2. Akun dan kunci API untuk:
   - **Telegram Bot** — token bot dari [BotFather].
   - **Google Generative AI (Gemini)** — API key untuk `@google/generative‑ai`【880744236196853†L0-L7】.
   - **Supabase** — URL proyek dan service role key【60216906527799†L0-L7】.
   - **Notion** — token integrasi dan ID basis data (incomes, expenses) serta ID halaman dashboard【233681204317501†L4-L12】.
   - Opsional: **Vision API** atau library OCR jika ingin mengganti `tesseract.js`.
3. Buat tabel di Supabase:
   - **transactions** — menyimpan `id`, `ts`, `type`, `amount`, `method`, `category`, `note`, `items_summary`, `raw_text`, `is_data_test` dan kolom lain sesuai kebutuhan.
   - **menus** — menyimpan `id`, `name`, `price`.
   - **ingredients** — menyimpan `id`, `name`, `price`, `qty_per_price`, `qty_per_serving`.
   - **menu_ingredients** — tabel pivot dengan `menu_id`, `ingredient_id`, dan `amount`.

## Instalasi

1. **Klon repositori**

   ```bash
   git clone https://github.com/ryokf/olvad-finance-AI-bot.git
   cd olvad-finance-AI-bot
   ```

2. **Pasang dependensi**

   ```bash
   npm install
   # atau
   yarn install
   ```

3. **Buat berkas `.env`** di akar proyek dengan variabel berikut (contoh):

   ```env
   TELEGRAM_BOT_TOKEN=123456:ABCDEF…
   GOOGLE_API_KEY=<kunci-Gemini>
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NOTION_API_KEY=secret_abc123
   NOTION_DATABASE_INCOMES_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   NOTION_DATABASE_EXPENSES_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   NOTION_FINANCE_PAGE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TIMEZONE=Asia/Jakarta
   ```

   Pastikan token dan ID sesuai dengan integrasi masing‑masing.

4. **Bangun dan jalankan**

   Untuk mode pengembangan dengan hot‑reload:

   ```bash
   npm run dev
   ```

   Proyek ini dikompilasi menggunakan TypeScript.  Untuk membangun versi produksi dan menjalankannya:

   ```bash
   npm run build
   npm start
   ```

   Skrip ini didefinisikan di `package.json`【379068413337833†L6-L14】.

## Penggunaan Bot

Jalankan bot menggunakan salah satu perintah di atas, kemudian buka Telegram dan cari bot Anda.  Perintah yang tersedia antara lain:

| Perintah | Deskripsi |
|---------|-----------|
| **/start** | Menampilkan pesan sambutan yang menjelaskan cara mencatat pemasukan dan pengeluaran【268663699506360†L1-L17】. |
| **/help** | Menampilkan daftar perintah yang dapat digunakan (start, help, finance, menu)【921579727637463†L21-L31】. |
| **/finance\u00a0<pertanyaan>** | Menganalisis data transaksi dan menu.  Jika argumen adalah `report`, bot membuat ringkasan keuangan harian; jika berupa pertanyaan lain, bot menggunakan AI untuk menjawab berdasarkan data transaksi【921579727637463†L34-L56】. |
| **/menu\u00a0<pertanyaan>** | Menjawab pertanyaan terkait menu, bahan dan rasio bahan; cocok untuk menghitung penggunaan bahan berdasarkan penjualan menu【921579727637463†L59-L73】. |
| **/sync** | Menyinkronkan seluruh transaksi yang tersimpan di Supabase ke basis data Notion【921579727637463†L76-L83】. |
| **Kirim pesan teks** | Tanpa perintah, bot akan mencoba menafsirkan pesan sebagai pencatatan transaksi.  Bot memproses teks melalui Gemini, menyimpan hasilnya ke Supabase, menampilkan ringkasan ke pengguna dan saldo terkini【237398157318541†L18-L38】. |
| **Kirim foto struk** | Bot akan melakukan OCR terhadap gambar struk, memproses teks dengan AI, dan menyimpan transaksinya【948087346764556†L22-L50】. |

## Alur Kerja Internal

1. **Inisialisasi Bot** — `src/index.ts` memuat variabel lingkungan, membuat instance Telegraf, lalu memanggil `setupBotHandlers` sebelum meluncurkan bot【976474921638603†L4-L14】.
2. **Penanganan perintah** — `setupBotHandlers` mendefinisikan handler untuk `/start`, `/help`, `/finance`, `/menu`, `/sync`, serta handler default untuk foto dan teks【921579727637463†L14-L99】.
3. **Parsing transaksi** — `createJsonPrompt` membangun prompt mendetail yang menentukan skema JSON transaksi dan kaidah bahasa【444258841296287†L4-L55】.  Fungsi `parseWithGemini` mengirim prompt dan teks ke model Gemini, kemudian melakukan `safeParseJson` untuk mengambil JSON dari respon model【493185133837513†L11-L29】.  Data transaksi yang valid disimpan melalui `saveTransactions`, yang juga meng update dashboard dan sinkronisasi ke Notion【223442797724922†L17-L60】.
4. **OCR untuk struk** — `extractTextFromImage` memproses gambar menggunakan `sharp` untuk peningkatan kontras dan `tesseract.js` untuk membaca teks【757023999551561†L24-L54】.  Hasil teks dikirim ke fungsi parsing seperti alur teks.
5. **Penyimpanan & Dashboard** — `transactionService` memanfaatkan Supabase untuk menyimpan dan mengambil transaksi serta menghitung saldo/balance【223442797724922†L70-L99】.  `NotionService` menyinkronkan data ke basis data Notion dan memperbarui callout dashboard yang menampilkan saldo, pemasukan, dan pengeluaran【773442386856570†L93-L161】.

## Struktur Proyek

Struktur direktori utama:

```
.
├── src
│   ├── config/          # Konfigurasi untuk API (Gemini, Supabase, Notion, timezone)
│   ├── constant/        # Konstanta seperti pesan sambutan
│   ├── controllers/     # Handler utama untuk bot Telegram
│   ├── prompt/          # Template prompt untuk AI (createJsonPrompt, getReportPrompt, dll.)
│   ├── services/        # Logika bisnis seperti transaksi, menu, OCR, integrasi Notion
│   ├── types/           # Definisi tipe TypeScript
│   ├── utils/           # Fungsi pendukung (handling foto dan teks, parse JSON)
│   └── index.ts         # Titik awal aplikasi
├── package.json         # Definisi skrip dan dependensi【379068413337833†L6-L45】
├── tsconfig.json        # Konfigurasi TypeScript
└── …
```

## Tips Penggunaan dan Pemeliharaan

* Pastikan waktu server sesuai dengan zona **Asia/Jakarta**; variabel `TIMEZONE` menentukan interpretasi tanggal pada prompt【444258841296287†L42-L45】.
* Untuk mencegah duplikasi di Notion, layanan `notionSync` melakukan *upsert* berdasarkan `id` eksternal transaksi【473144036749011†L50-L72】.
* Gunakan `/finance report` setiap hari untuk mendapatkan ringkasan pendapatan, pengeluaran, jumlah item terjual, produk terlaris, dan saldo【145295911587751†L17-L24】.
* Jika terjadi error saat OCR atau parsing, bot akan mengirim pesan kesalahan; Anda dapat mengirim ulang struk atau memperbaiki format teks.

## Lisensi

Proyek ini menggunakan lisensi [ISC](https://opensource.org/licenses/ISC) sebagaimana tercantum di `package.json`.  Silakan gunakan, modifikasi dan distribusikan proyek ini sesuai ketentuan lisensi.
