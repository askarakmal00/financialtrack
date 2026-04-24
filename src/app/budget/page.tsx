"use client";

import AppLayout from "@/components/AppLayout";
import { useStore } from "@/lib/useStore";
import { formatCurrency, getCategoryExpense } from "@/lib/store";
import { useState } from "react";

export default function BudgetPage() {
  const { store, saveBudget, deleteBudget } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ categoryId: "", amount: "" });

  const expenseCategories = store.categories.filter((c) => c.type === "expense" || c.type === "both");

  const budgetList = expenseCategories.map((cat) => {
    const budget = store.budgets.find((b) => b.categoryId === cat.id && b.month === month && b.year === year);
    const spent = getCategoryExpense(cat.id, store, month, year);
    const limit = budget?.amount || 0;
    const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const over = limit > 0 && spent > limit;
    const warn = limit > 0 && pct >= 70 && !over;
    return { cat, budget, spent, limit, pct, over, warn };
  }).filter((b) => b.budget || b.spent > 0);

  const unbudgetedWithSpend = expenseCategories.filter((cat) => {
    const hasBudget = store.budgets.some((b) => b.categoryId === cat.id && b.month === month && b.year === year);
    const spent = getCategoryExpense(cat.id, store, month, year);
    return !hasBudget && spent > 0;
  });

  const totalBudget = budgetList.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgetList.reduce((s, b) => s + b.spent, 0);
  const overBudgetCount = budgetList.filter((b) => b.over).length;

  const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

  const handleSubmit = () => {
    if (!form.categoryId || !form.amount) return;
    saveBudget({ categoryId: form.categoryId, month, year, amount: Number(form.amount) });
    setShowModal(false);
  };

  const openAdd = () => {
    setForm({ categoryId: expenseCategories[0]?.id || "", amount: "" });
    setShowModal(true);
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Budget Bulanan</h1>
            <p className="page-subtitle">Atur pengeluaran per kategori</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="form-select" style={{ width: "auto" }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="form-select" style={{ width: "auto" }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[2024,2025,2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn btn-primary" onClick={openAdd}>+ Set Budget</button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Summary */}
        <div className="grid-3 mb-4">
          {[
            { label: "Total Budget", value: formatCurrency(totalBudget), icon: "🎯", color: "rgba(59,130,246,0.12)" },
            { label: "Total Terpakai", value: formatCurrency(totalSpent), icon: "💸", color: totalSpent > totalBudget ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)" },
            { label: "Sisa Budget", value: formatCurrency(totalBudget - totalSpent), icon: "✅", color: totalBudget - totalSpent >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: "1.1rem" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {overBudgetCount > 0 && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "0.875rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.25rem" }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--accent-red)" }}>Peringatan Budget!</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{overBudgetCount} kategori melebihi budget bulan {MONTHS[month - 1]} {year}</div>
            </div>
          </div>
        )}

        {/* Budget list */}
        {budgetList.length === 0 && unbudgetedWithSpend.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <div className="empty-title">Belum ada budget</div>
              <div className="empty-desc">Set budget untuk mengontrol pengeluaran Anda</div>
              <button className="btn btn-primary" onClick={openAdd}>+ Set Budget</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {budgetList.map(({ cat, budget, spent, limit, pct, over, warn }) => (
              <div key={cat.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>{cat.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>{cat.name}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                        {formatCurrency(spent)} dari {formatCurrency(limit)} budget
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {over ? <span className="badge badge-red">⚠️ Over Budget</span>
                      : warn ? <span className="badge badge-amber">⚡ Hampir Habis</span>
                      : limit > 0 ? <span className="badge badge-green">✓ Aman</span>
                      : <span className="badge badge-muted">Tidak ada limit</span>}
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => {
                      setForm({ categoryId: cat.id, amount: String(limit) });
                      setShowModal(true);
                    }}>✏️</button>
                    {budget && <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteBudget(budget.id)}>🗑️</button>}
                  </div>
                </div>

                <div className="progress-bar" style={{ height: 8, marginBottom: "0.5rem" }}>
                  <div className="progress-fill" style={{
                    width: `${pct}%`,
                    background: over ? "var(--accent-red)" : warn ? "var(--accent-amber)" : "var(--accent-green)",
                  }} />
                </div>

                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                    Sisa: <strong style={{ color: over ? "var(--accent-red)" : "var(--accent-green)" }}>{formatCurrency(limit - spent)}</strong>
                  </span>
                  <span style={{ fontSize: "0.68rem", color: over ? "var(--accent-red)" : warn ? "var(--accent-amber)" : "var(--text-muted)", fontWeight: 700 }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}

            {/* Unbudgeted categories with spending */}
            {unbudgetedWithSpend.map((cat) => {
              const spent = getCategoryExpense(cat.id, store, month, year);
              return (
                <div key={cat.id} className="card" style={{ borderStyle: "dashed" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>{cat.icon}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>{cat.name}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Pengeluaran: {formatCurrency(spent)} • Tidak ada budget</div>
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => { setForm({ categoryId: cat.id, amount: "" }); setShowModal(true); }}>Set Budget</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Set Budget Kategori</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                Budget untuk <strong style={{ color: "var(--text-primary)" }}>{MONTHS[month - 1]} {year}</strong>
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-select" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                  {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Batas Budget (Rp)</label>
                <input className="form-input" type="number" placeholder="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Simpan Budget</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
