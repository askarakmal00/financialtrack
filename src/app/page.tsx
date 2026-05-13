"use client";

import AppLayout from "@/components/AppLayout";
import { useStore } from "@/lib/useStore";
import {
  getAccountBalance,
  getTotalBalance,
  getMonthlyIncome,
  getMonthlyExpense,
  getTotalActiveDebt,
  formatCurrency,
  formatDate,
} from "@/lib/store";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "@/lib/charts";
import { useState } from "react";

// Vivid, high-contrast palette (no grey, no light colors)
const COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
];

export default function DashboardPage() {
  const { store } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const totalBalance = getTotalBalance(store);
  const monthlyIncome = getMonthlyIncome(store, month, year);
  const monthlyExpense = getMonthlyExpense(store, month, year);
  const totalDebt = getTotalActiveDebt(store);
  const netCashflow = monthlyIncome - monthlyExpense;

  // Active filter label for display
  const activeFilterLabel = selectedCategory
    ? store.categories.find((c) => c.id === selectedCategory)?.name ?? null
    : selectedTag ?? null;

  const clearFilter = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
  };

  // Recent transactions — filtered by category OR tag
  const recentTx = [...store.transactions]
    .filter((t) => {
      if (selectedCategory && t.categoryId !== selectedCategory) return false;
      if (selectedTag) {
        const txTag = (t.tag ?? "").trim().toLowerCase();
        const selTag = selectedTag.toLowerCase();
        if (selectedTag === "(Tanpa Tag)") {
          if (txTag !== "") return false;
        } else {
          if (txTag !== selTag) return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      const ca = a.createdAt || a.date;
      const cb = b.createdAt || b.date;
      return cb.localeCompare(ca);
    })
    .slice(0, selectedCategory || selectedTag ? 20 : 6);

  // Cashflow 14 days
  const cashflowData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (13 - i));
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayTx = store.transactions.filter((t) => t.date === dStr);
    return {
      date: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      income: dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) / 1000,
      expense: dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0) / 1000,
    };
  });

  // Category breakdown (current month)
  const expenseByCategory = store.categories
    .filter((c) => c.type !== "income")
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      value: store.transactions
        .filter((t) => {
          const parts = t.date?.split("-");
          if (!parts || parts.length < 3) return false;
          return t.type === "expense" && t.categoryId === cat.id && Number(parts[1]) === month && Number(parts[0]) === year;
        })
        .reduce((s, t) => s + t.amount, 0),
      color: cat.color,
      icon: cat.icon,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  // Expense by Tag (current month) — normalize casing
  const expenseByTag = (() => {
    // key = lowercase tag, value = { displayTag, total }
    const tagMap: Record<string, { displayTag: string; value: number }> = {};
    store.transactions
      .filter((t) => {
        const parts = t.date?.split("-");
        if (!parts || parts.length < 3) return false;
        return t.type === "expense" && Number(parts[1]) === month && Number(parts[0]) === year;
      })
      .forEach((t) => {
        const raw = (t.tag ?? "").trim();
        const key = raw.toLowerCase() || "(tanpa tag)";
        const display = raw || "(Tanpa Tag)";
        if (!tagMap[key]) tagMap[key] = { displayTag: display, value: 0 };
        tagMap[key].value += t.amount;
      });
    return Object.entries(tagMap)
      .map(([, { displayTag, value }]) => ({ tag: displayTag, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  })();

  // Upcoming bills
  const upcomingBills = store.recurringBills.filter((b) => b.status === "unpaid").slice(0, 3);

  // Budget summary
  const budgetSummary = store.budgets
    .filter((b) => b.month === month && b.year === year)
    .map((b) => {
      const cat = store.categories.find((c) => c.id === b.categoryId);
      const spent = store.transactions
        .filter((t) => {
          const parts = t.date?.split("-");
          if (!parts || parts.length < 3) return false;
          return t.type === "expense" && t.categoryId === b.categoryId && Number(parts[1]) === month && Number(parts[0]) === year;
        })
        .reduce((s, t) => s + t.amount, 0);
      const pct = Math.min((spent / b.amount) * 100, 100);
      return { ...b, cat, spent, pct };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  const tooltipStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" };
  const tooltipStyleBright = { background: "#1e293b", border: "1px solid #475569", borderRadius: 8, fontSize: 12, color: "#f1f5f9", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" };

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          {now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="page-body">
        {/* Stat cards */}
        <div className="grid-4 mb-4">
          {[
            { label: "Total Saldo", value: formatCurrency(totalBalance), icon: "💰", bg: "rgba(59,130,246,0.12)", change: null },
            { label: "Pemasukan Bulan Ini", value: formatCurrency(monthlyIncome), icon: "📈", bg: "rgba(34,197,94,0.12)", change: "up" },
            { label: "Pengeluaran Bulan Ini", value: formatCurrency(monthlyExpense), icon: "📉", bg: "rgba(239,68,68,0.12)", change: "down" },
            { label: "Total Hutang Aktif", value: formatCurrency(totalDebt), icon: "🏦", bg: "rgba(245,158,11,0.12)", change: null },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: "1.15rem" }}>{s.value}</div>
              {s.change && (
                <div className={`stat-change ${s.change}`}>
                  {s.change === "up" ? "▲" : "▼"} Bulan ini
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Cashflow chart + Accounts */}
        <div className="grid-2-1 mb-4">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Cashflow 14 Hari Terakhir</span>
              <span className={`badge ${netCashflow >= 0 ? "badge-green" : "badge-red"}`}>
                {netCashflow >= 0 ? "+" : ""}{formatCurrency(netCashflow)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cashflowData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#5a6d8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5a6d8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}K`, ""]} />
                <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#incomeGrad)" strokeWidth={2} name="Pemasukan" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} name="Pengeluaran" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2" style={{ justifyContent: "center" }}>
              <div className="flex items-center gap-1 text-xs" style={{ color: "#22c55e" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} /> Pemasukan</div>
              <div className="flex items-center gap-1 text-xs" style={{ color: "#ef4444" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} /> Pengeluaran</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Akun &amp; Dompet</span>
            </div>
            <div className="flex flex-1" style={{ flexDirection: "column", gap: "0.625rem" }}>
              {store.accounts.map((acc) => {
                const bal = getAccountBalance(acc.id, store);
                return (
                  <div key={acc.id} className="flex items-center justify-between" style={{
                    padding: "0.625rem 0.75rem",
                    background: "var(--bg-input)",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                  }}>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: acc.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>{acc.icon}</div>
                      <div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{acc.name}</div>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{acc.type}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: bal >= 0 ? "var(--text-primary)" : "var(--accent-red)" }}>
                      {formatCurrency(bal)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Expense breakdown + Budget */}
        <div className="grid-2 mb-4">
          {/* Pie chart by category */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pengeluaran per Kategori</span>
              {selectedCategory && (
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCategory(null)}>✕ Reset</button>
              )}
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              💡 Klik kategori untuk filter Transaksi Terbaru
            </p>
            {expenseByCategory.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-title">Belum ada data</div></div>
            ) : (
              <div className="flex" style={{ gap: "1rem", alignItems: "center" }}>
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                      {expenseByCategory.map((c, i) => (
                        <Cell
                          key={i}
                          fill={c.color || COLORS[i % COLORS.length]}
                          onClick={() => { setSelectedTag(null); setSelectedCategory(selectedCategory === c.id ? null : c.id); }}
                          style={{ cursor: "pointer", opacity: selectedCategory === c.id || !selectedCategory ? 1 : 0.3, transition: "opacity 0.2s" }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {expenseByCategory.slice(0, 5).map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between"
                      style={{ cursor: "pointer", opacity: selectedCategory === c.id || !selectedCategory ? 1 : 0.3, transition: "opacity 0.2s", borderRadius: 6, padding: "2px 4px", background: selectedCategory === c.id ? (c.color || COLORS[i % COLORS.length]) + "22" : "transparent" }}
                      onClick={() => { setSelectedTag(null); setSelectedCategory(selectedCategory === c.id ? null : c.id); }}
                    >
                      <div className="flex items-center gap-2">
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color || COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{c.icon} {c.name}</span>
                      </div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Progress Budget</span>
              <button className="btn btn-ghost btn-sm" onClick={() => window.location.href = "/budget"}>Lihat Semua</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {budgetSummary.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">🎯</div><div className="empty-title">Belum ada budget</div></div>
              ) : (
                budgetSummary.map((b, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{b.cat?.icon} {b.cat?.name}</span>
                      <span style={{ fontSize: "0.72rem", color: b.pct >= 90 ? "var(--accent-red)" : b.pct >= 70 ? "var(--accent-amber)" : "var(--text-muted)" }}>
                        {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: `${b.pct}%`,
                        background: b.pct >= 90 ? "var(--accent-red)" : b.pct >= 70 ? "var(--accent-amber)" : "var(--accent-blue)",
                      }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Expense by Tag bar chart */}
        <div className="card mb-4">
          <div className="card-header">
            <span className="card-title">🏷️ Pengeluaran per Tag — Bulan Ini</span>
            <div className="flex items-center gap-2">
              {expenseByTag.length > 0 && (
                <span className="badge badge-red">{expenseByTag.length} tag</span>
              )}
              {selectedTag && (
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTag(null)}>✕ Reset</button>
              )}
            </div>
          </div>
          {expenseByTag.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏷️</div>
              <div className="empty-title">Belum ada data tag</div>
              <div className="empty-desc">Tambahkan tag pada transaksi untuk melihat breakdown di sini</div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                💡 Klik bar untuk filter Transaksi Terbaru
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={expenseByTag}
                  margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                  barCategoryGap="30%"
                >
                  <XAxis
                    dataKey="tag"
                    tick={{ fill: "#cbd5e1", fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#7a8fa8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyleBright}
                    formatter={(v: any) => [formatCurrency(Number(v ?? 0)), "Pengeluaran"]}
                    labelStyle={{ color: "#f1f5f9", fontWeight: 700, marginBottom: 4, fontSize: 13 }}
                    itemStyle={{ color: "#e2e8f0" }}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    onClick={(data: any) => {
                      const tag = data?.tag as string;
                      setSelectedCategory(null);
                      setSelectedTag(selectedTag === tag ? null : tag);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {expenseByTag.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                        opacity={selectedTag === entry.tag || !selectedTag ? 1 : 0.3}
                        stroke={selectedTag === entry.tag ? "#fff" : "none"}
                        strokeWidth={selectedTag === entry.tag ? 1.5 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Tag legend */}
              <div className="flex" style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                {expenseByTag.map((entry, i) => (
                  <div
                    key={i}
                    onClick={() => { setSelectedCategory(null); setSelectedTag(selectedTag === entry.tag ? null : entry.tag); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "3px 10px",
                      borderRadius: 20, cursor: "pointer", fontSize: "0.72rem", fontWeight: 500,
                      background: selectedTag === entry.tag ? COLORS[i % COLORS.length] + "33" : "var(--bg-input)",
                      border: `1px solid ${selectedTag === entry.tag ? COLORS[i % COLORS.length] : "var(--border)"}`,
                      color: selectedTag === entry.tag ? COLORS[i % COLORS.length] : "var(--text-secondary)",
                      opacity: selectedTag === entry.tag || !selectedTag ? 1 : 0.5,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "inline-block", flexShrink: 0 }} />
                    {entry.tag}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent transactions + Upcoming */}
        <div className="grid-2-1">
          <div className="card">
            <div className="card-header">
              <div>
                <span className="card-title">Transaksi Terbaru</span>
                {activeFilterLabel && (
                  <span style={{
                    marginLeft: "0.5rem", fontSize: "0.72rem", padding: "2px 8px", borderRadius: 10,
                    background: "var(--accent-blue)22", color: "var(--accent-blue)",
                    border: "1px solid var(--accent-blue)44",
                  }}>
                    Filter: {activeFilterLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(selectedCategory || selectedTag) && (
                  <button className="btn btn-ghost btn-sm" onClick={clearFilter}>✕ Reset Filter</button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => window.location.href = "/transactions"}>Lihat Semua</button>
              </div>
            </div>
            {recentTx.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <div className="empty-title">Tidak ada transaksi</div>
                <div className="empty-desc">Tidak ditemukan transaksi untuk filter ini</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transaksi</th>
                    <th>Tanggal</th>
                    <th style={{ textAlign: "right" }}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((tx) => {
                    const cat = store.categories.find((c) => c.id === tx.categoryId);
                    const acc = store.accounts.find((a) => a.id === tx.accountId);
                    return (
                      <tr key={tx.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: (cat?.color || "#64748b") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>{cat?.icon || "💰"}</div>
                            <div>
                              <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>{tx.note || cat?.name}</div>
                              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                                {acc?.name}
                                {tx.tag && <span style={{ marginLeft: 5, padding: "1px 5px", borderRadius: 6, background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>#{tx.tag}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{formatDate(tx.date)}</td>
                        <td style={{ textAlign: "right" }}>
                          <span className={`font-semibold ${tx.type === "income" ? "tx-income" : tx.type === "expense" ? "tx-expense" : "tx-transfer"}`} style={{ fontSize: "0.82rem" }}>
                            {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "⇄"}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Tagihan Belum Bayar</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {upcomingBills.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">✅</div><div className="empty-title">Semua sudah dibayar!</div></div>
              ) : (
                upcomingBills.map((bill) => (
                  <div key={bill.id} style={{ padding: "0.75rem", background: "var(--bg-input)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{bill.name}</span>
                      <span className="badge badge-red">Belum Bayar</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tgl {bill.dueDayOrDate} tiap bulan</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-red)" }}>{formatCurrency(bill.amount)}</span>
                    </div>
                  </div>
                ))
              )}
              <button className="btn btn-ghost btn-sm w-full mt-2" onClick={() => window.location.href = "/bills"}>Kelola Tagihan →</button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
