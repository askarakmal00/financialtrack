"use client";

import AppLayout from "@/components/AppLayout";
import { useStore } from "@/lib/useStore";
import { resetStore, DEFAULT_CATEGORIES, formatCurrency, getTotalBalance, getMonthlyExpense, getMonthlyIncome } from "@/lib/store";
import { useState } from "react";

export default function SettingsPage() {
  const { store, addAccount } = useStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const now = new Date();
  const totalBalance = getTotalBalance(store);
  const income = getMonthlyIncome(store, now.getMonth() + 1, now.getFullYear());
  const expense = getMonthlyExpense(store, now.getMonth() + 1, now.getFullYear());

  const handleReset = () => {
    resetStore();
    window.location.reload();
  };

  const statsData = [
    { label: "Total Akun", value: store.accounts.length },
    { label: "Total Transaksi", value: store.transactions.length },
    { label: "Hutang Aktif", value: store.debts.filter((d) => d.status === "active").length },
    { label: "Tagihan Rutin", value: store.recurringBills.length },
    { label: "Budget Aktif", value: store.budgets.filter((b) => b.month === now.getMonth() + 1 && b.year === now.getFullYear()).length },
    { label: "Target Aktif", value: store.goals.filter((g) => g.status === "active").length },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Pengaturan</h1>
        <p className="page-subtitle">Kelola data dan preferensi aplikasi</p>
      </div>

      <div className="page-body">
        <div className="grid-2" style={{ alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* App info */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem" }}>💰</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>FinTrack</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Personal Finance Tracker v1.0</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>Data tersimpan di perangkat Anda (LocalStorage)</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem" }}>
                {statsData.map((s) => (
                  <div key={s.label} style={{ textAlign: "center", padding: "0.625rem", background: "var(--bg-input)", borderRadius: 10 }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-blue)" }}>{s.value}</div>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial summary */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Ringkasan Keuangan</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {[
                  { label: "Total Saldo Semua Akun", value: formatCurrency(totalBalance), color: "var(--accent-blue)" },
                  { label: "Pemasukan Bulan Ini", value: formatCurrency(income), color: "var(--accent-green)" },
                  { label: "Pengeluaran Bulan Ini", value: formatCurrency(expense), color: "var(--accent-red)" },
                  { label: "Cashflow Bersih", value: formatCurrency(income - expense), color: income - expense >= 0 ? "var(--accent-green)" : "var(--accent-red)" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between" style={{ padding: "0.5rem 0.75rem", background: "var(--bg-input)", borderRadius: 8 }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{item.label}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Kategori Default</span>
                <span className="badge badge-blue">{DEFAULT_CATEGORIES.length} kategori</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {store.categories.map((cat) => (
                  <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.625rem", background: cat.color + "18", border: `1px solid ${cat.color}33`, borderRadius: 20 }}>
                    <span style={{ fontSize: "0.75rem" }}>{cat.icon}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: cat.color }}>{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Data management */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Manajemen Data</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ padding: "1rem", background: "var(--bg-input)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>💾 Penyimpanan Lokal</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    Semua data tersimpan di browser Anda menggunakan LocalStorage. Data tidak dikirim ke server manapun.
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="badge badge-green">🔒 Privat</div>
                    <div className="badge badge-blue">📱 Offline</div>
                  </div>
                </div>

                <div style={{ padding: "1rem", background: "var(--bg-input)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>📤 Export Data (Coming Soon)</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    Ekspor data ke format CSV / Excel untuk backup atau analisis lebih lanjut.
                  </div>
                  <button className="btn btn-ghost btn-sm" disabled style={{ opacity: 0.5 }}>Export ke CSV</button>
                </div>

                <div style={{ padding: "1rem", background: "rgba(239,68,68,0.06)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--accent-red)", marginBottom: "0.25rem" }}>⚠️ Reset Data</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    Menghapus semua data dan mengembalikan ke data demo awal. Tindakan ini tidak dapat dibatalkan.
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => setShowResetConfirm(true)}>🗑️ Reset ke Data Awal</button>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Tentang Aplikasi</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  ["Versi", "1.0.0"],
                  ["Tech Stack", "Next.js 16 + Recharts"],
                  ["Data Storage", "LocalStorage (Browser)"],
                  ["Tema", "Dark Mode"],
                  ["Bahasa", "Bahasa Indonesia"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between" style={{ padding: "0.4rem 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{k}</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="card" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))", border: "1px solid rgba(59,130,246,0.2)" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>💡 Tips Menggunakan FinTrack</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  "Catat setiap transaksi sesegera mungkin",
                  "Set budget di awal bulan setiap bulannya",
                  "Periksa laporan bulanan untuk evaluasi",
                  "Bayar tagihan tepat waktu untuk menghindari denda",
                  "Tetapkan target keuangan untuk motivasi menabung",
                ].map((tip, i) => (
                  <div key={i} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", gap: "0.5rem" }}>
                    <span style={{ color: "var(--accent-blue)", flexShrink: 0 }}>•</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset confirm modal */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowResetConfirm(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">⚠️ Konfirmasi Reset</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowResetConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🗑️</div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>Reset Semua Data?</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Semua transaksi, akun, hutang, tagihan, budget, dan target akan dihapus dan diganti dengan data demo awal. Tindakan ini <strong style={{ color: "var(--accent-red)" }}>tidak dapat dibatalkan</strong>.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowResetConfirm(false)}>Batal</button>
              <button className="btn btn-danger" onClick={handleReset}>🗑️ Ya, Reset Sekarang</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
