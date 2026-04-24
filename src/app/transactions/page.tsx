"use client";

import AppLayout from "@/components/AppLayout";
import { useStore } from "@/lib/useStore";
import { formatCurrency, formatDate, Transaction } from "@/lib/store";
import { useState, useMemo } from "react";

type TxFilter = { type: string; categoryId: string; accountId: string; search: string; dateFrom: string; dateTo: string };

export default function TransactionsPage() {
  const { store, addTransaction, updateTransaction, deleteTransaction } = useStore();
  const [filter, setFilter] = useState<TxFilter>({ type: "", categoryId: "", accountId: "", search: "", dateFrom: "", dateTo: "" });
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [form, setForm] = useState({ type: "expense", accountId: "", destinationAccountId: "", categoryId: "", amount: "", date: new Date().toISOString().split("T")[0], note: "", tag: "" });

  const filtered = useMemo(() => {
    return [...store.transactions]
      .filter((t) => {
        if (filter.type && t.type !== filter.type) return false;
        if (filter.categoryId && t.categoryId !== filter.categoryId) return false;
        if (filter.accountId && t.accountId !== filter.accountId) return false;
        if (filter.dateFrom && t.date < filter.dateFrom) return false;
        if (filter.dateTo && t.date > filter.dateTo) return false;
        if (filter.search) {
          const q = filter.search.toLowerCase();
          const cat = store.categories.find((c) => c.id === t.categoryId);
          if (!t.note?.toLowerCase().includes(q) && !cat?.name?.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [store, filter]);

  const openAdd = () => {
    setEditingTx(null);
    setForm({ type: "expense", accountId: store.accounts[0]?.id || "", destinationAccountId: "", categoryId: "", amount: "", date: new Date().toISOString().split("T")[0], note: "", tag: "" });
    setShowModal(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setForm({ type: tx.type, accountId: tx.accountId, destinationAccountId: tx.destinationAccountId || "", categoryId: tx.categoryId, amount: String(tx.amount), date: tx.date, note: tx.note, tag: tx.tag || "" });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!form.amount || !form.accountId) return;
    const data = { type: form.type as "income" | "expense" | "transfer", accountId: form.accountId, destinationAccountId: form.destinationAccountId || undefined, categoryId: form.categoryId || "cat-14", amount: Number(form.amount), date: form.date, note: form.note, tag: form.tag };
    if (editingTx) updateTransaction(editingTx.id, data);
    else addTransaction(data);
    setShowModal(false);
  };

  const visibleCategories = store.categories.filter((c) => {
    if (form.type === "income") return c.type === "income" || c.type === "both";
    if (form.type === "expense") return c.type === "expense" || c.type === "both";
    return true;
  });

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <AppLayout>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Transaksi</h1>
            <p className="page-subtitle">{filtered.length} transaksi ditemukan</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Tambah</button>
        </div>
      </div>

      <div className="page-body">
        {/* Summary */}
        <div className="grid-3 mb-4">
          {[
            { label: "Total Pemasukan", value: formatCurrency(totalIncome), color: "var(--accent-green)" },
            { label: "Total Pengeluaran", value: formatCurrency(totalExpense), color: "var(--accent-red)" },
            { label: "Selisih", value: formatCurrency(totalIncome - totalExpense), color: totalIncome - totalExpense >= 0 ? "var(--accent-green)" : "var(--accent-red)" },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
            <input className="form-input" placeholder="🔍 Cari..." value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} />
            <select className="form-select" value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}>
              <option value="">Semua Jenis</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
              <option value="transfer">Transfer</option>
            </select>
            <select className="form-select" value={filter.categoryId} onChange={(e) => setFilter((f) => ({ ...f, categoryId: e.target.value }))}>
              <option value="">Semua Kategori</option>
              {store.categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <select className="form-select" value={filter.accountId} onChange={(e) => setFilter((f) => ({ ...f, accountId: e.target.value }))}>
              <option value="">Semua Akun</option>
              {store.accounts.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
            </select>
            <input type="date" className="form-input" value={filter.dateFrom} onChange={(e) => setFilter((f) => ({ ...f, dateFrom: e.target.value }))} placeholder="Dari" />
            <input type="date" className="form-input" value={filter.dateTo} onChange={(e) => setFilter((f) => ({ ...f, dateTo: e.target.value }))} placeholder="Sampai" />
          </div>
        </div>

        {/* Table */}
        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💸</div>
              <div className="empty-title">Tidak ada transaksi</div>
              <div className="empty-desc">Tambahkan transaksi pertama Anda</div>
              <button className="btn btn-primary" onClick={openAdd}>+ Tambah Transaksi</button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaksi</th>
                  <th>Kategori</th>
                  <th>Akun</th>
                  <th>Tanggal</th>
                  <th style={{ textAlign: "right" }}>Jumlah</th>
                  <th style={{ textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const cat = store.categories.find((c) => c.id === tx.categoryId);
                  const acc = store.accounts.find((a) => a.id === tx.accountId);
                  const destAcc = tx.destinationAccountId ? store.accounts.find((a) => a.id === tx.destinationAccountId) : null;
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: (cat?.color || "#64748b") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", flexShrink: 0 }}>{cat?.icon || "💰"}</div>
                          <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{tx.note || cat?.name || "-"}</span>
                        </div>
                      </td>
                      <td><span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{cat?.name || "-"}</span></td>
                      <td><span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{acc?.name}{destAcc ? ` → ${destAcc.name}` : ""}</span></td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{formatDate(tx.date)}</td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`font-semibold ${tx.type === "income" ? "tx-income" : tx.type === "expense" ? "tx-expense" : "tx-transfer"}`} style={{ fontSize: "0.85rem" }}>
                          {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "⇄"}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1" style={{ justifyContent: "center" }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(tx)} title="Edit">✏️</button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteTransaction(tx.id)} title="Hapus">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* FAB */}
      <button className="fab" onClick={openAdd} title="Tambah Transaksi">+</button>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editingTx ? "Edit Transaksi" : "Tambah Transaksi"}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Type tabs */}
              <div className="flex gap-2">
                {[["expense", "📉 Pengeluaran"], ["income", "📈 Pemasukan"], ["transfer", "⇄ Transfer"]].map(([v, l]) => (
                  <button key={v} className={`btn flex-1 ${form.type === v ? "btn-primary" : "btn-ghost"}`} onClick={() => setForm((f) => ({ ...f, type: v, categoryId: "" }))}>
                    {l}
                  </button>
                ))}
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Nominal</label>
                  <input className="form-input" type="number" placeholder="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal</label>
                  <input className="form-input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Akun {form.type === "transfer" ? "Sumber" : ""}</label>
                <select className="form-select" value={form.accountId} onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}>
                  <option value="">Pilih Akun</option>
                  {store.accounts.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                </select>
              </div>

              {form.type === "transfer" && (
                <div className="form-group">
                  <label className="form-label">Akun Tujuan</label>
                  <select className="form-select" value={form.destinationAccountId} onChange={(e) => setForm((f) => ({ ...f, destinationAccountId: e.target.value }))}>
                    <option value="">Pilih Akun Tujuan</option>
                    {store.accounts.filter((a) => a.id !== form.accountId).map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                  </select>
                </div>
              )}

              {form.type !== "transfer" && (
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select className="form-select" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                    <option value="">Pilih Kategori</option>
                    {visibleCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Catatan</label>
                <input className="form-input" placeholder="Catatan (opsional)" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Tag (opsional)</label>
                <input className="form-input" placeholder="contoh: pribadi, kerja" value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editingTx ? "Simpan" : "Tambah"}</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
