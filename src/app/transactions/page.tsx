"use client";

import AppLayout from "@/components/AppLayout";
import { useStore } from "@/lib/useStore";
import { formatCurrency, formatDate, Transaction, getTotalBalance } from "@/lib/store";
import CurrencyInput from "@/components/CurrencyInput";
import { useState, useMemo } from "react";

type TxFilter = { type: string; categoryId: string; accountId: string; search: string; dateFrom: string; dateTo: string };

export default function TransactionsPage() {
  const { store, addTransaction, addTransactions, updateTransaction, deleteTransaction } = useStore();
  const [filter, setFilter] = useState<TxFilter>({ type: "", categoryId: "", accountId: "", search: "", dateFrom: "", dateTo: "" });
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
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
      .sort((a, b) => {
        // Sort newest date first — direct string comparison works for YYYY-MM-DD
        if (a.date > b.date) return -1;
        if (a.date < b.date) return 1;
        // Same date: sort by createdAt
        const ca = a.createdAt || a.date;
        const cb = b.createdAt || b.date;
        if (cb > ca) return 1;
        if (cb < ca) return -1;
        return 0;
      });
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

  // --- CSV helpers ---
  const escapeCSV = (val: string | number | undefined) => {
    const str = String(val ?? "");
    // Wrap in quotes if contains comma, quote, or newline
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportCSV = () => {
    try {
      const rows: string[] = ["Tipe,Tanggal,Akun,Tujuan Akun,Kategori,Jumlah,Catatan,Tag"];

      // Export currently-filtered transactions (or all if no filter)
      filtered.forEach((tx) => {
        const typeStr = tx.type === "income" ? "pemasukan" : tx.type === "expense" ? "pengeluaran" : "transfer";
        const accName = store.accounts.find((a) => a.id === tx.accountId)?.name || "";
        const destAccName = tx.destinationAccountId
          ? (store.accounts.find((a) => a.id === tx.destinationAccountId)?.name || "")
          : "";
        const catName = store.categories.find((c) => c.id === tx.categoryId)?.name || "";
        rows.push([
          escapeCSV(typeStr),
          escapeCSV(tx.date),
          escapeCSV(accName),
          escapeCSV(destAccName),
          escapeCSV(catName),
          escapeCSV(tx.amount),
          escapeCSV(tx.note),
          escapeCSV(tx.tag),
        ].join(","));
      });

      // UTF-8 BOM so Excel opens correctly
      const BOM = "\uFEFF";
      const csvContent = BOM + rows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const fileName = `FinTrack_Transaksi_${new Date().toISOString().split("T")[0]}.csv`;
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengekspor data CSV");
    }
  };

  const downloadTemplate = () => {
    const csvContent = "Tipe,Tanggal,Akun,Tujuan Akun,Kategori,Jumlah,Catatan,Tag\n"
      + "pengeluaran,2026-05-01,Uang Tunai,,Makanan,50000,Makan siang,food\n"
      + "pemasukan,2026-05-02,Rekening Bank,,Gaji,5000000,Gaji bulan Mei,income\n"
      + "transfer,2026-05-03,Uang Tunai,Rekening Bank,,100000,Nabung,saving\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Template_Bulk_Import.csv";
    link.click();
  };

  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const newTxs: Omit<Transaction, "id" | "createdAt">[] = [];
      
      // Auto-detect delimiter based on header
      const headerLine = lines[0] || "";
      const delimiter = headerLine.includes(";") ? ";" : ",";
      
      const parseCSVLine = (str: string) => {
        const result = [];
        let col = "";
        let inQuotes = false;
        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            result.push(col);
            col = "";
          } else {
            col += char;
          }
        }
        result.push(col);
        return result.map(c => c.trim());
      };
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = parseCSVLine(line);
        if (cols.length < 6) continue;
        
        const typeStr = cols[0].toLowerCase();
        let dateStr = cols[1];
        const accName = cols[2].toLowerCase();
        const destAccName = cols[3]?.toLowerCase();
        const catName = cols[4]?.toLowerCase();
        
        // Remove dots/commas from amount in case of "100.000" or "100,000"
        const rawAmount = cols[5]?.replace(/\./g, '').replace(/,/g, '') || "";
        const amount = Number(rawAmount) || 0;
        
        const note = cols[6] || "";
        const tag = cols[7] || undefined;
        
        // Normalize date format if user used "3 Mei 2026" or "DD/MM/YYYY" instead of YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const idnMonths: Record<string, string> = { jan: "01", februari: "02", maret: "03", april: "04", mei: "05", juni: "06", juli: "07", agustus: "08", september: "09", oktober: "10", november: "11", desember: "12" };
          const match = dateStr.toLowerCase().match(/^(\d{1,2})[\s\-]+([a-z]+)[\s\-]+(\d{4})$/);
          if (match && idnMonths[match[2]]) {
            dateStr = `${match[3]}-${idnMonths[match[2]]}-${match[1].padStart(2, '0')}`;
          } else if (dateStr.includes("/")) {
            const p = dateStr.split("/");
            if (p.length === 3) {
              const first = parseInt(p[0], 10);
              const second = parseInt(p[1], 10);
              const third = parseInt(p[2], 10);
              // If third part is a 4-digit year (YYYY), detect M/D/YYYY vs D/M/YYYY
              if (p[2].length === 4) {
                if (first > 12) {
                  // first part cannot be month → must be day: D/M/YYYY
                  dateStr = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
                } else {
                  // first part ≤ 12, assume M/D/YYYY (Excel default for en-US locale)
                  dateStr = `${p[2]}-${p[0].padStart(2, '0')}-${p[1].padStart(2, '0')}`;
                }
              } else if (p[0].length === 4) {
                // YYYY/MM/DD
                dateStr = `${p[0]}-${p[1].padStart(2, '0')}-${p[2].padStart(2, '0')}`;
              } else {
                // Fallback: assume D/M/YYYY
                dateStr = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
              }
            }
          } else if (dateStr.includes("-")) {
            const p = dateStr.split("-");
            if (p.length === 3 && p[0].length <= 2) dateStr = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
          } else {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) dateStr = d.toISOString().split("T")[0];
          }
        }
        
        if (!amount) continue;
        
        let type: "income" | "expense" | "transfer" = "expense";
        if (typeStr === "pemasukan") type = "income";
        if (typeStr === "transfer") type = "transfer";
        
        const acc = store.accounts.find(a => a.name.toLowerCase() === accName) || store.accounts[0];
        const destAcc = store.accounts.find(a => a.name.toLowerCase() === destAccName);
        const cat = store.categories.find(c => c.name.toLowerCase() === catName) || store.categories.find(c => c.id === "cat-14") || store.categories[0];
        
        newTxs.push({
          type,
          date: dateStr,
          accountId: acc?.id || "",
          destinationAccountId: type === "transfer" ? destAcc?.id : undefined,
          categoryId: type === "transfer" ? "cat-14" : (cat?.id || ""),
          amount,
          note,
          tag
        });
      }
      
      if (newTxs.length > 0) {
        addTransactions(newTxs);
        alert(`Berhasil mengimpor ${newTxs.length} transaksi!`);
        setShowBulkModal(false);
      } else {
        alert("Tidak ada data transaksi valid yang ditemukan dalam CSV. Pastikan format kolom sudah benar (pisahkan dengan koma atau titik koma).");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const visibleCategories = store.categories.filter((c) => {
    if (form.type === "income") return c.type === "income" || c.type === "both";
    if (form.type === "expense") return c.type === "expense" || c.type === "both";
    return true;
  });

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalBalance = getTotalBalance(store);

  return (
    <AppLayout>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Transaksi</h1>
            <p className="page-subtitle">{filtered.length} transaksi ditemukan</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={handleExportCSV} title={`Export ${filtered.length} transaksi ke CSV`}>📤 Export CSV{filtered.length < store.transactions.length ? ` (${filtered.length})` : ""}</button>
            <button className="btn btn-ghost" onClick={() => setShowBulkModal(true)}>📥 Bulk Import</button>
            <button className="btn btn-primary" onClick={openAdd}>+ Tambah</button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Summary */}
        <div className="grid-4 mb-4">
          {[
            { label: "Total Saldo", value: formatCurrency(totalBalance), color: "var(--accent-blue)" },
            { label: "Total Pemasukan", value: formatCurrency(totalIncome), color: "var(--accent-green)" },
            { label: "Total Pengeluaran", value: formatCurrency(totalExpense), color: "var(--accent-red)" },
            { label: "Selisih", value: formatCurrency(totalIncome - totalExpense), color: totalIncome - totalExpense >= 0 ? "var(--accent-green)" : "var(--accent-red)" },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color, fontSize: "1.1rem" }}>{s.value}</div>
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
                  <CurrencyInput
                    value={form.amount}
                    onChange={(raw) => setForm((f) => ({ ...f, amount: raw }))}
                    autoFocus
                  />
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

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowBulkModal(false)}>
          <div className="modal" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <span className="modal-title">📥 Bulk Import Transaksi</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowBulkModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: "var(--bg-input)", padding: "1rem", borderRadius: 10, marginBottom: "1rem", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                  Anda bisa mengimpor banyak transaksi sekaligus menggunakan file <strong>.CSV</strong>. Kolom harus mengikuti format yang tepat:
                </p>
                <div style={{ fontSize: "0.75rem", fontFamily: "monospace", background: "rgba(0,0,0,0.2)", padding: "0.5rem", borderRadius: 6, color: "var(--text-primary)", marginBottom: "1rem", overflowX: "auto", whiteSpace: "nowrap" }}>
                  Tipe,Tanggal,Akun,Tujuan Akun,Kategori,Jumlah,Catatan,Tag
                </div>
                <button className="btn btn-ghost btn-sm" style={{ width: "100%" }} onClick={downloadTemplate}>
                  ⬇️ Download Template CSV
                </button>
              </div>

              <div style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: "2rem 1rem", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-blue)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
              >
                <label style={{ cursor: "pointer", display: "block" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📄</div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>Upload File CSV</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Klik di sini untuk memilih file</div>
                  <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleBulkImport} />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
