"use client";

import AppLayout from "@/components/AppLayout";
import { useStore } from "@/lib/useStore";
import { formatCurrency, formatDate, Debt } from "@/lib/store";
import { useState } from "react";

export default function DebtsPage() {
  const { store, addDebt, updateDebt, deleteDebt, addDebtPayment } = useStore();
  const [tab, setTab] = useState<"active" | "paid">("active");
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [form, setForm] = useState({ name: "", lenderName: "", totalAmount: "", monthlyInstallment: "", amountPaid: "0", startDate: "", dueDate: "", note: "" });
  const [payForm, setPayForm] = useState({ amount: "", paymentDate: new Date().toISOString().split("T")[0], note: "" });

  const filtered = store.debts.filter((d) => d.status === tab);
  const totalActive = store.debts.filter((d) => d.status === "active").reduce((s, d) => s + (d.totalAmount - d.amountPaid), 0);
  const totalPaid = store.debts.filter((d) => d.status === "paid").length;

  const openAdd = () => {
    setEditingDebt(null);
    setForm({ name: "", lenderName: "", totalAmount: "", monthlyInstallment: "", amountPaid: "0", startDate: new Date().toISOString().split("T")[0], dueDate: "", note: "" });
    setShowDebtModal(true);
  };

  const openEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setForm({ name: debt.name, lenderName: debt.lenderName, totalAmount: String(debt.totalAmount), monthlyInstallment: String(debt.monthlyInstallment), amountPaid: String(debt.amountPaid), startDate: debt.startDate, dueDate: debt.dueDate, note: debt.note });
    setShowDebtModal(true);
  };

  const openPay = (debt: Debt) => {
    setSelectedDebt(debt);
    setPayForm({ amount: String(debt.monthlyInstallment || ""), paymentDate: new Date().toISOString().split("T")[0], note: "" });
    setShowPayModal(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.totalAmount) return;
    const data = { name: form.name, lenderName: form.lenderName, totalAmount: Number(form.totalAmount), monthlyInstallment: Number(form.monthlyInstallment) || 0, amountPaid: Number(form.amountPaid) || 0, startDate: form.startDate, dueDate: form.dueDate, note: form.note, status: (Number(form.amountPaid) >= Number(form.totalAmount) ? "paid" : "active") as "paid" | "active" };
    if (editingDebt) updateDebt(editingDebt.id, data);
    else addDebt(data);
    setShowDebtModal(false);
  };

  const handlePay = () => {
    if (!selectedDebt || !payForm.amount) return;
    addDebtPayment({ debtId: selectedDebt.id, amount: Number(payForm.amount), paymentDate: payForm.paymentDate, note: payForm.note });
    setShowPayModal(false);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const diff = new Date(dueDate).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Hutang & Cicilan</h1>
            <p className="page-subtitle">Total hutang aktif: <strong style={{ color: "var(--accent-red)" }}>{formatCurrency(totalActive)}</strong></p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Tambah Hutang</button>
        </div>
      </div>

      <div className="page-body">
        {/* Summary rows */}
        <div className="grid-3 mb-4">
          {[
            { label: "Total Hutang Aktif", value: formatCurrency(totalActive), icon: "🏦", color: "rgba(239,68,68,0.12)" },
            { label: "Hutang Lunas", value: `${totalPaid} hutang`, icon: "✅", color: "rgba(34,197,94,0.12)" },
            { label: "Total Hutang", value: `${store.debts.length} catatan`, icon: "📋", color: "rgba(59,130,246,0.12)" },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: "1.1rem" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>Aktif ({store.debts.filter((d) => d.status === "active").length})</button>
          <button className={`tab-btn ${tab === "paid" ? "active" : ""}`} onClick={() => setTab("paid")}>Lunas ({totalPaid})</button>
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <div className="empty-title">{tab === "active" ? "Tidak ada hutang aktif!" : "Belum ada hutang yang lunas"}</div>
              <div className="empty-desc">{tab === "active" && "Keuangan Anda bersih 🎉"}</div>
              {tab === "active" && <button className="btn btn-primary" onClick={openAdd}>+ Tambah Hutang</button>}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filtered.map((debt) => {
              const remaining = debt.totalAmount - debt.amountPaid;
              const pct = Math.min((debt.amountPaid / debt.totalAmount) * 100, 100);
              const daysUntilDue = getDaysUntilDue(debt.dueDate);
              const isOverdue = daysUntilDue < 0;
              const isUrgent = daysUntilDue >= 0 && daysUntilDue <= 30;

              return (
                <div key={debt.id} className="card" style={{ borderLeft: `4px solid ${debt.status === "paid" ? "var(--accent-green)" : isOverdue ? "var(--accent-red)" : isUrgent ? "var(--accent-amber)" : "var(--accent-blue)"}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{debt.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>dari {debt.lenderName}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {debt.status === "paid" ? (
                        <span className="badge badge-green">✅ Lunas</span>
                      ) : isOverdue ? (
                        <span className="badge badge-red">⚠️ Terlambat</span>
                      ) : isUrgent ? (
                        <span className="badge badge-amber">⏰ {daysUntilDue} hari lagi</span>
                      ) : (
                        <span className="badge badge-blue">{daysUntilDue} hari lagi</span>
                      )}
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(debt)}>✏️</button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => { if (confirm("Hapus hutang ini?")) deleteDebt(debt.id); }}>🗑️</button>
                    </div>
                  </div>

                  <div className="grid-4 mb-3">
                    {[
                      { label: "Total Hutang", value: formatCurrency(debt.totalAmount) },
                      { label: "Sudah Dibayar", value: formatCurrency(debt.amountPaid), color: "var(--accent-green)" },
                      { label: "Sisa Hutang", value: formatCurrency(remaining), color: "var(--accent-red)" },
                      { label: "Cicilan/Bulan", value: formatCurrency(debt.monthlyInstallment) },
                    ].map((item, i) => (
                      <div key={i} style={{ background: "var(--bg-input)", borderRadius: 10, padding: "0.625rem 0.75rem" }}>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{item.label}</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: item.color || "var(--text-primary)" }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Progress Pelunasan</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: pct === 100 ? "var(--accent-green)" : "var(--text-secondary)" }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: 8 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? "var(--accent-green)" : pct > 60 ? "var(--accent-blue)" : "var(--accent-amber)" }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between" style={{ marginTop: "0.75rem" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Mulai: {formatDate(debt.startDate)} • Jatuh Tempo: {formatDate(debt.dueDate)}
                    </div>
                    {debt.status === "active" && (
                      <button className="btn btn-success btn-sm" onClick={() => openPay(debt)}>💳 Bayar Cicilan</button>
                    )}
                  </div>

                  {debt.note && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem", fontStyle: "italic" }}>📝 {debt.note}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Debt Modal */}
      {showDebtModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDebtModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">{editingDebt ? "Edit Hutang" : "Tambah Hutang / Cicilan"}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDebtModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Nama Hutang</label>
                  <input className="form-input" placeholder="Contoh: KPR, Kredit Motor..." value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Pemberi Pinjaman</label>
                  <input className="form-input" placeholder="Bank/Orang/Institusi" value={form.lenderName} onChange={(e) => setForm((f) => ({ ...f, lenderName: e.target.value }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Total Hutang</label>
                  <input className="form-input" type="number" placeholder="0" value={form.totalAmount} onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cicilan per Bulan</label>
                  <input className="form-input" type="number" placeholder="0" value={form.monthlyInstallment} onChange={(e) => setForm((f) => ({ ...f, monthlyInstallment: e.target.value }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Sudah Dibayar</label>
                  <input className="form-input" type="number" placeholder="0" value={form.amountPaid} onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Mulai</label>
                  <input className="form-input" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Jatuh Tempo</label>
                <input className="form-input" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Catatan</label>
                <textarea className="form-textarea" placeholder="Catatan tambahan..." value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDebtModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editingDebt ? "Simpan" : "Tambah"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && selectedDebt && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPayModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Bayar Cicilan: {selectedDebt.name}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: "0.75rem", background: "var(--bg-input)", borderRadius: 10, marginBottom: "0.5rem" }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Sisa Hutang</span>
                  <span style={{ fontWeight: 700, color: "var(--accent-red)" }}>{formatCurrency(selectedDebt.totalAmount - selectedDebt.amountPaid)}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Jumlah Pembayaran</label>
                <input className="form-input" type="number" value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Bayar</label>
                <input className="form-input" type="date" value={payForm.paymentDate} onChange={(e) => setPayForm((f) => ({ ...f, paymentDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Catatan</label>
                <input className="form-input" placeholder="Opsional" value={payForm.note} onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowPayModal(false)}>Batal</button>
              <button className="btn btn-success" onClick={handlePay}>💳 Bayar Sekarang</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
