---
trigger: model_decision
description: "Kenzo Treasury financial invariants: integer Rupiah, monthly cycles, income-driven budgets, debt repayments, savings, wishlist transfers, month closing and reversals."
---

# Invarian Domain Finansial — Kenzo Treasury

Dokumen ini adalah aturan absolut untuk seluruh operasi, kalkulasi, mutasi, dan agregasi data finansial di Kenzo Treasury.

---

## 1. Satuan Mata Uang & Angka (Integer Rupiah)

- **Selalu Integer:** Seluruh nilai uang di database (`integer`) dan state aplikasi wajib berupa nominal **Rupiah utuh** tanpa pecahan sen/desimal/float.
- **Bebas Masalah Floating Point:** Dilarang menggunakan tipe float/double untuk uang. Operasi pembagian harus dibulatkan secara deterministik (`Math.floor` atau `Math.round`) dengan penanganan selisih pembulatan yang jelas.
- **Format Tampilan:** Gunakan fungsi pemformat terpusat (`id-ID`) dengan simbol `Rp` dan pemisah ribuan titik. Terapkan CSS `font-variant-numeric: tabular-nums` agar lebar karakter angka sejajar dan mudah dibaca saat ditumpuk vertikal.
- **Nilai Non-Negatif:** Nominal transaksi belanja, target anggaran, alokasi tabungan, dan cicilan harus selalu bernilai positif ($\ge 0$). Nilai negatif hanya diperbolehkan pada entri penyesuaian/reversal khusus yang terdokumentasi.

---

## 2. Siklus Bulanan & Lembar Kerja Terisolasi (`months`)

- **Identitas Siklus:** Setiap bulan kerja terikat unik pada kombinasi `(user_id, year, month_index)`. Dilarang menduplikasi siklus bulan untuk tahun dan indeks yang sama.
- **Baseline Zero-Based Budgeting:** Saat siklus bulan baru dibuat, sistem menginisialisasi pemasukan dasar (`💵 Gaji Pokok: Rp 4.000.000`) dan membaginya habis ke pos anggaran aktif sesuai template baseline.
- **3 Kelompok Pos Anggaran (`category_group`):**
  1. `pos_wajib` — Kewajiban spiritual, cicilan, dan tagihan operasional primer (Perpuluhan, Listrik, Cicilan).
  2. `kebutuhan` — Kebutuhan hidup harian fleksibel (Bensin, Jajan Popo).
  3. `uang_bebas_tabungan` — Alokasi belanja bebas dan cadangan tabungan bulanan.

---

## 3. Logika Pemasukan Multi-Sumber (Dynamic Freedom Buffer)

- **Pos Wajib & Kebutuhan Terkunci:** Pemasukan tambahan (freelance, bonus, side-project) **tidak boleh** otomatis menaikkan pos wajib atau kebutuhan harian agar disiplin finansial tetap terjaga.
- **Auto-Buffer ke Uang Bebas:** Setiap pemasukan non-gaji yang masuk di bulan berjalan otomatis memperbesar target anggaran `uang_bebas_tabungan`:
  $$\text{Target Uang Bebas} = \text{Rp 915.000 (Base)} + \sum(\text{Pemasukan Tambahan Non-Gaji})$$
- **Kalkulasi Otoritatif (Bukan Counter Statis):** Jika pemasukan diedit atau dihapus, target pos uang bebas wajib dihitung ulang secara otoritatif dari akumulasi data pemasukan aktual, bukan mengandalkan counter tambahan yang rawan selisih/desinkronisasi.

---

## 4. Pelacakan Cicilan & Finite Lifetime (`liabilities`)

- **Relasi Pos ke Utang:** Pos anggaran cicilan terhubung ke data `liabilities` via `liability_id`.
- **Akumulasi Pembayaran Atomik:** Setiap transaksi pembayaran pada pos cicilan otomatis menambah `paid_amount` pada tabel `liabilities`.
- **Status Lunas (`is_settled`):** Ketika $\text{paid\_amount} \ge \text{total\_amount}$, cicilan ditandai lunas (`is_settled = true`).
- **Otomasi Pembuatan Bulan Baru & Relokasi Kas Dinamis:**
  - Pos cicilan yang sudah berstatus lunas (`is_settled = true`) **tidak dimunculkan kembali** di bulan-bulan berikutnya.
  - Kuota anggaran dari cicilan yang lunas otomatis dialihkan untuk memperbesar kapasitas baseline `uang_bebas_tabungan` (kapasitas finansial bertambah seiring berkurangnya utang).
  - **Invarian Dinamis dari Database:** Nominal yang dialihkan **wajib dijumlahkan dari nilai `liabilities.monthlyPayment` aktual di database**, bukan di-hardcode angka (seperti 735.000 atau 500.000) dan bukan dengan mencocokkan string nama/keyword.
- **Rekonsiliasi Edit/Hapus/Undo:** Jika transaksi pembayaran cicilan diubah atau dihapus (undo), `paid_amount` wajib direkonsiliasi secara atomik dalam transaksi database yang sama.

---

## 5. Brankas Tabungan, Dana Darurat & Wishlist Sinking Fund

- **Entitas Tunggal Tabungan (`savings_account`):** Menyimpan `balance` (tabungan bebas), `emergency_fund_target` (target dana darurat, default Rp 18.000.000 / 6x pengeluaran), dan `emergency_fund_balance`.
- **Transfer Antar-Kantong (Bukan Menciptakan Uang):** Pengalokasian dana ke wishlist (`wishlists`) adalah pemindahan dana dari `savings_account.balance` ke `saved_amount` barang impian via `wishlist_allocations`. Uang tidak boleh bertambah atau berkurang di luar pencatatan.
- **Anti-Defisit (`insufficient funds`):** Alokasi ke wishlist atau penarikan tabungan wajib memvalidasi ketersediaan saldo. Saldo tabungan bebas tidak boleh menjadi negatif.
- **Reversal & Unallocate:** Penarikan kembali dana dari wishlist ke tabungan bebas mencatat alokasi negatif atau reversal resmi, mengembalikan saldo ke `savings_account.balance`.

---

## 6. Tutup Buku Bulanan (End-of-Month Sweep & Reversals)

- **Penyapuan Sisa Anggaran (Month Sweep):** Saat bulan ditutup (`is_closed = true`), sisa kuota anggaran yang tidak terpakai dari pos belanja/uang bebas disapu bersih (*sweep*) dan ditransfer menjadi penambah `savings_account.balance`.
- **Idempotensi Eksekusi (Exactly-Once):** Operasi sweep harus bersifat idempoten; penutupan bulan tidak boleh menyapu sisa anggaran dua kali jika dipicu ulang.
- **Reopen & Reversal:** Jika bulan dibuka kembali untuk koreksi transaksi, proses reversal wajib memperhitungkan saldo yang sudah disapu agar tidak terjadi penghitungan ganda (*double-counting*).

---

## 7. Integritas Teknis & Single Source of Truth

- **Satu Rumus, Satu Berkas:** Seluruh rumus finansial (sisa budget, persentase lunas, safety months dana darurat, dynamic buffer) wajib terpusat di `src/lib/financial-calculations.ts`. Dilarang menduplikasi rumus di komponen antarmuka.
- **Fail-Closed Financial State:** Jika query database, Server Action, atau koneksi jaringan gagal, sistem dilarang mengarang angka asumsi. Tampilkan skeleton loading atau banner error eksplisit.
- **Transaksi DB Atomik:** Setiap operasi yang memengaruhi lebih dari satu tabel (misal: transaksi cicilan $\rightarrow$ `transactions` + `liabilities`, alokasi wishlist $\rightarrow$ `savings_account` + `wishlist_allocations`) wajib dibungkus dalam transaksi database atomik (`db.transaction`).