"use client";

import AppLayout from "@/components/AppLayout";
import { useStore } from "@/lib/useStore";
import { getAccountBalance, formatCurrency, Account, AccountType } from "@/lib/store";
import CurrencyInput from "@/components/CurrencyInput";
import { useState } from "react";

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: "cash", label: "Uang Tunai", icon: "👛" },
  { value: "bank", label: "Rekening Bank", icon: "🏦" },
  { value: "ewallet", label: "E-Wallet", icon: "📱" },
  { value: "savings", label: "Tabungan", icon: "💎" },
  { value: "emergency", label: "Dana Darurat", icon: "🛡️" },
  { value: "custom", label: "Custom", icon: "📁" },
];

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];

export default function AccountsPage() {
  const { store, addAccount, updateAccount, deleteAccount } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [form, setForm] = useState({ name: "", type: "cash" as AccountType, initialBalance: "", icon: "💳", color: "#3b82f6" });

  const totalBalance = store.accounts.reduce((s, a) => s + getAccountBalance(a.id, store), 0);

  const openAdd = () => {
    setEditingAcc(null);
    setForm({ name: "", type: "cash", initialBalance: "", icon: "💳", color: "#3b82f6" });
    setShowModal(true);
  };

  const openEdit = (acc: Account) => {
    setEditingAcc(acc);
    setForm({ name: acc.name, type: acc.type, initialBalance: String(acc.initialBalance), icon: acc.icon || "💳", color: acc.color || "#3b82f6" });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!form.name) return;
    const data = { name: form.name, type: form.type, initialBalance: Number(form.initialBalance) || 0, icon: form.icon, color: form.color };
    if (editingAcc) updateAccount(editingAcc.id, data);
    else addAccount(data);
    setShowModal(false);
  };

  const ICONS = ["💳", "👛", "🏦", "📱", "💎", "🛡️", "💰", "🏪", "💼", "🚀"];

  return (
    <AppLayout>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Akun & Dompet</h1>
            <p className="page-subtitle">Total saldo: <strong style={{ color: "var(--accent-green)" }}>{formatCurrency(totalBalance)}</strong></p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Tambah Akun</button>
        </div>
      </div>

      <div className="page-body">
        {/* Summary cards */}
        <div className="grid-4 mb-4">
          {ACCOUNT_TYPES.slice(0, 4).map((at) => {
            const accs = store.accounts.filter((a) => a.type === at.value);
            const total = accs.reduce((s, a) => s + getAccountBalance(a.id, store), 0);
            return (
              <div key={at.value} className="stat-card">
                <div className="stat-icon" style={{ background: "rgba(59,130,246,0.12)" }}>{at.icon}</div>
                <div className="stat-label">{at.label}</div>
                <div className="stat-value" style={{ fontSize: "1.1rem" }}>{formatCurrency(total)}</div>
                <div className="stat-change" style={{ color: "var(--text-muted)" }}>{accs.length} akun</div>
              </div>
            );
          })}
        </div>

        {/* Account cards grid */}
        <div className="grid-3">
          {store.accounts.map((acc) => {
            const balance = getAccountBalance(acc.id, store);
            const typeInfo = ACCOUNT_TYPES.find((t) => t.value === acc.type);
            // Transactions for this account
            const txs = store.transactions.filter((t) => t.accountId === acc.id || t.destinationAccountId === acc.id);
            const income = txs.filter((t) => t.type === "income" && t.accountId === acc.id).reduce((s, t) => s + t.amount, 0);
            const expense = txs.filter((t) => t.type === "expense" && t.accountId === acc.id).reduce((s, t) => s + t.amount, 0);

            return (
              <div key={acc.id} className="card" style={{ position: "relative", overflow: "hidden" }}>
                {/* Background accent */}
                <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${acc.color || "#3b82f6"}22, transparent 70%)`, borderRadius: "0 14px 0 0", pointerEvents: "none" }} />

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: (acc.color || "#3b82f6") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>{acc.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{acc.name}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{typeInfo?.label}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(acc)}>✏️</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => setConfirmDeleteId(acc.id)}>🗑️</button>
                  </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Saldo Saat Ini</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: balance >= 0 ? "var(--text-primary)" : "var(--accent-red)", letterSpacing: "-0.02em" }}>{formatCurrency(balance)}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Awal: {formatCurrency(acc.initialBalance)}</div>
                </div>

                <div className="flex gap-3" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Pemasukan</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--accent-green)" }}>+{formatCurrency(income)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Pengeluaran</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--accent-red)" }}>-{formatCurrency(expense)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Transaksi</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>{txs.length}x</div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add new account card */}
          <div className="card" style={{ border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", minHeight: 180, transition: "all 0.2s ease" }}
            onClick={openAdd}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-blue)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          >
            <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>+</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>Tambah Akun</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editingAcc ? "Edit Akun" : "Tambah Akun Baru"}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Akun</label>
                <input className="form-input" placeholder="Contoh: BCA, GoPay, Dompet..." value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
              </div>

              <div className="form-group">
                <label className="form-label">Tipe Akun</label>
                <select className="form-select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AccountType }))}>
                  {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Saldo Awal</label>
                <CurrencyInput value={form.initialBalance} onChange={(raw) => setForm((f) => ({ ...f, initialBalance: raw }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Ikon</label>
                <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                  {ICONS.map((icon) => (
                    <button key={icon} onClick={() => setForm((f) => ({ ...f, icon }))} style={{ width: 40, height: 40, borderRadius: 8, border: `2px solid ${form.icon === icon ? "var(--accent-blue)" : "var(--border)"}`, background: form.icon === icon ? "rgba(59,130,246,0.1)" : "var(--bg-input)", cursor: "pointer", fontSize: "1.1rem" }}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Warna</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: `2px solid ${form.color === c ? "white" : "transparent"}`, cursor: "pointer", outline: form.color === c ? `2px solid ${c}` : "none", outlineOffset: 2 }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editingAcc ? "Simpan" : "Tambah"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfirmDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <span className="modal-title">🗑️ Hapus Akun?</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setConfirmDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⚠️</div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                  Hapus akun ini?
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Akun akan dihapus, tetapi transaksinya mungkin akan tetap ada atau menjadi tanpa akun.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmDeleteId(null)}>Batal</button>
              <button className="btn btn-danger" onClick={() => { deleteAccount(confirmDeleteId); setConfirmDeleteId(null); }}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
