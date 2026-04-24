"use client";

import AppLayout from "@/components/AppLayout";
import { useStore } from "@/lib/useStore";
import { formatCurrency, RecurringBill, BillFrequency } from "@/lib/store";
import { useState } from "react";

const FREQ_LABELS: Record<BillFrequency, string> = { weekly: "Mingguan", monthly: "Bulanan", yearly: "Tahunan" };

export default function BillsPage() {
  const { store, addBill, updateBill, deleteBill, payBill } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [tab, setTab] = useState<"unpaid" | "paid">("unpaid");
  const [form, setForm] = useState({ name: "", amount: "", frequency: "monthly" as BillFrequency, dueDayOrDate: "", categoryId: "cat-5", defaultAccountId: "" });

  const filtered = store.recurringBills.filter((b) => b.status === tab);
  const totalUnpaid = store.recurringBills.filter((b) => b.status === "unpaid").reduce((s, b) => s + b.amount, 0);
  const totalPaidAmt = store.recurringBills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0);

  const openAdd = () => {
    setEditingBill(null);
    setForm({ name: "", amount: "", frequency: "monthly", dueDayOrDate: "", categoryId: "cat-5", defaultAccountId: store.accounts[0]?.id || "" });
    setShowModal(true);
  };

  const openEdit = (b: RecurringBill) => {
    setEditingBill(b);
    setForm({ name: b.name, amount: String(b.amount), frequency: b.frequency, dueDayOrDate: String(b.dueDayOrDate), categoryId: b.categoryId, defaultAccountId: b.defaultAccountId });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.amount) return;
    const data = { name: form.name, amount: Number(form.amount), frequency: form.frequency, dueDayOrDate: Number(form.dueDayOrDate) || 1, categoryId: form.categoryId, defaultAccountId: form.defaultAccountId, status: "unpaid" as const };
    if (editingBill) updateBill(editingBill.id, data);
    else addBill(data);
    setShowModal(false);
  };

  const resetAllBills = () => {
    store.recurringBills.forEach((b) => {
      if (b.status === "paid") updateBill(b.id, { status: "unpaid" });
    });
  };

  const totalMonthly = store.recurringBills.filter((b) => b.frequency === "monthly").reduce((s, b) => s + b.amount, 0);

  return (
    <AppLayout>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Tagihan Rutin</h1>
            <p className="page-subtitle">Tagihan bulanan: <strong style={{ color: "var(--accent-amber)" }}>{formatCurrency(totalMonthly)}</strong></p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={resetAllBills}>🔄 Reset Bulan Baru</button>
            <button className="btn btn-primary" onClick={openAdd}>+ Tambah Tagihan</button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Summary */}
        <div className="grid-3 mb-4">
          {[
            { label: "Belum Dibayar", value: formatCurrency(totalUnpaid), count: store.recurringBills.filter((b) => b.status === "unpaid").length, icon: "⚠️", color: "rgba(239,68,68,0.12)" },
            { label: "Sudah Dibayar", value: formatCurrency(totalPaidAmt), count: store.recurringBills.filter((b) => b.status === "paid").length, icon: "✅", color: "rgba(34,197,94,0.12)" },
            { label: "Total per Bulan", value: formatCurrency(totalMonthly), count: store.recurringBills.length, icon: "📅", color: "rgba(59,130,246,0.12)" },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: "1.1rem" }}>{s.value}</div>
              <div className="stat-change" style={{ color: "var(--text-muted)" }}>{s.count} tagihan</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${tab === "unpaid" ? "active" : ""}`} onClick={() => setTab("unpaid")}>
            Belum Dibayar ({store.recurringBills.filter((b) => b.status === "unpaid").length})
          </button>
          <button className={`tab-btn ${tab === "paid" ? "active" : ""}`} onClick={() => setTab("paid")}>
            Sudah Dibayar ({store.recurringBills.filter((b) => b.status === "paid").length})
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">{tab === "unpaid" ? "✅" : "📃"}</div>
              <div className="empty-title">{tab === "unpaid" ? "Semua tagihan sudah dibayar!" : "Belum ada tagihan yang lunas"}</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filtered.map((bill) => {
              const cat = store.categories.find((c) => c.id === bill.categoryId);
              const acc = store.accounts.find((a) => a.id === bill.defaultAccountId);
              return (
                <div key={bill.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: (cat?.color || "#64748b") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>{cat?.icon || "📃"}</div>

                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{bill.name}</span>
                      <span className="badge badge-muted">{FREQ_LABELS[bill.frequency]}</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Jatuh tgl {bill.dueDayOrDate} • {cat?.name} • via {acc?.name || "-"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: bill.status === "unpaid" ? "var(--accent-red)" : "var(--accent-green)" }}>
                      {formatCurrency(bill.amount)}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>per {bill.frequency === "monthly" ? "bulan" : bill.frequency === "weekly" ? "minggu" : "tahun"}</div>
                  </div>

                  <div className="flex gap-2" style={{ flexShrink: 0 }}>
                    {bill.status === "unpaid" ? (
                      <button className="btn btn-success btn-sm" onClick={() => { if (confirm(`Tandai "${bill.name}" sebagai sudah dibayar?\nIni akan membuat transaksi pengeluaran secara otomatis.`)) payBill(bill.id); }}>💳 Bayar</button>
                    ) : (
                      <button className="btn btn-ghost btn-sm" onClick={() => updateBill(bill.id, { status: "unpaid" })}>↩ Batal</button>
                    )}
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(bill)}>✏️</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => { if (confirm("Hapus tagihan ini?")) deleteBill(bill.id); }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editingBill ? "Edit Tagihan" : "Tambah Tagihan Rutin"}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Tagihan</label>
                <input className="form-input" placeholder="Contoh: Listrik, Internet, BPJS..." value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Nominal</label>
                  <input className="form-input" type="number" placeholder="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Frekuensi</label>
                  <select className="form-select" value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as BillFrequency }))}>
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                    <option value="yearly">Tahunan</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tanggal Jatuh Tempo (hari ke-)</label>
                  <input className="form-input" type="number" placeholder="1-31" min={1} max={31} value={form.dueDayOrDate} onChange={(e) => setForm((f) => ({ ...f, dueDayOrDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Akun Pembayaran</label>
                  <select className="form-select" value={form.defaultAccountId} onChange={(e) => setForm((f) => ({ ...f, defaultAccountId: e.target.value }))}>
                    <option value="">Pilih Akun</option>
                    {store.accounts.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-select" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                  {store.categories.filter((c) => c.type !== "income").map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editingBill ? "Simpan" : "Tambah"}</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
