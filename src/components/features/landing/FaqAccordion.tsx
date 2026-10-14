import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export function FaqAccordion() {
  const faqs = [
    {
      id: "item-1",
      question: "Apakah aplikasi ini bisa dipasang langsung di layar utama HP?",
      answer:
        "Bisa. Buka situs ini melalui Safari di iPhone lalu pilih 'Add to Home Screen', atau melalui Chrome di Android lalu pilih 'Install App'. Ikon aplikasi akan langsung terpasang di layar utama ponsel dan dapat dibuka layaknya aplikasi biasa tanpa perlu mengunduh dari toko aplikasi.",
    },
    {
      id: "item-2",
      question: "Apakah catatan keuangan saya aman dari orang lain?",
      answer:
        "Sangat aman. Setiap akun memiliki ruang penyimpanan pribadi yang terisolasi. Data Anda dilindungi dengan enkripsi modern sehingga tidak ada orang lain yang dapat melihat, membaca, atau mengakses catatan pengeluaran Anda.",
    },
    {
      id: "item-3",
      question: "Bagaimana jika saya mendapat uang bonus atau honor sampingan?",
      answer:
        "Pemasukan utama dipakai untuk memenuhi kebutuhan pokok. Saat Anda mencatat pemasukan sampingan dari honor tambahan atau bonus, sistem langsung mengarahkan dana tersebut untuk menambah jatah belanja santai dan tabungan tanpa mengubah pos kebutuhan wajib.",
    },
    {
      id: "item-4",
      question: "Bagaimana sistem membantu saya melunasi cicilan tepat waktu?",
      answer:
        "Kenzo Treasury memperlakukan setiap cicilan sebagai kewajiban yang memiliki tanggal lunas pasti. Sistem menghitung mundur sisa bulan pembayaran secara otomatis. Begitu lunas, pos cicilan tersebut tidak akan muncul lagi di bulan berikutnya dan uangnya dialihkan untuk tabungan Anda.",
    },
    {
      id: "item-5",
      question: "Bagaimana jika saya keliru mengetik nominal saat di kasir?",
      answer:
        "Setiap kali Anda menekan tombol simpan, tombol 'Batal' akan muncul di layar selama 5 detik. Jika ada kesalahan nominal atau salah pilih pos belanja, cukup tekan tombol tersebut dan saldo Anda langsung kembali seperti semula.",
    },
    {
      id: "item-6",
      question: "Apakah saya bisa mengunduh riwayat keuangan saya ke Excel?",
      answer:
        "Bisa kapan saja. Anda memegang kendali penuh atas data Anda. Cukup buka menu pengaturan dan tekan tombol ekspor untuk mengunduh seluruh transaksi, anggaran, dan tabungan ke dalam format Excel atau CSV.",
    },
  ];

  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="text-xs uppercase tracking-widest font-semibold">
            Tanya Jawab
          </Badge>
          <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Semua hal yang perlu Anda ketahui mengenai kepraktisan pencatatan, keamanan data, dan cara kerja Kenzo Treasury.
          </p>
        </div>

        {/* Accordion Component */}
        <div className="mt-12">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="rounded-xl border bg-card px-4 sm:px-6 py-1 shadow-xs not-last:border-b-0"
              >
                <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline py-4 border-none outline-none focus-visible:ring-0">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-4 pt-1">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
