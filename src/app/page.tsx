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
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { useState } from "react";

const COLORS = ["#3b82f6","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#f97316"];

export default function DashboardPage() {
  const { store } = useStore();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const totalBalance = getTotalBalance(store);
  const monthlyIncome = getMonthlyIncome(store, month, year);
  const monthlyExpense = getMonthlyExpense(store, month, year);
  const totalDebt = getTotalActiveDebt(store);
  const netCashflow = monthlyIncome - monthlyExpense;

  // Recent transactions
  const recentTx = [...store.transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // Cashflow 30 days
  const cashflowData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getTime() - (13 - i) * 86400000);
    const dStr = d.toISOString().split("T")[0];
    const dayTx = store.transactions.filter((t) => t.date === dStr);
    return {
      date: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      income: dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) / 1000,
      expense: dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0) / 1000,
    };
  });

  // Category breakdown
  const expenseByCategory = store.categories
    .filter((c) => c.type !== "income")
    .map((cat) => ({
      name: cat.name,
      value: store.transactions
        .filter((t) => {
          const d = new Date(t.date);
          return t.type === "expense" && t.categoryId === cat.id && d.getMonth() + 1 === month && d.getFullYear() === year;
        })
        .reduce((s, t) => s + t.amount, 0),
      color: cat.color,
      icon: cat.icon,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  // Upcoming bills
  const upcomingBills = store.recurringBills.filter((b) => b.status === "unpaid").slice(0, 3);

  // Budget summary
  const budgetSummary = store.budgets
    .filter((b) => b.month === month && b.year === year)
    .map((b) => {
      const cat = store.categories.find((c) => c.id === b.categoryId);
      const spent = store.transactions
        .filter((t) => {
          const d = new Date(t.date);
          return t.type === "expense" && t.categoryId === b.categoryId && d.getMonth() + 1 === month && d.getFullYear() === year;
        })
        .reduce((s, t) => s + t.amount, 0);
      const pct = Math.min((spent / b.amount) * 100, 100);
      return { ...b, cat, spent, pct };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  const tooltipStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" };

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
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}K`, ""]} />
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
              <span className="card-title">Akun & Dompet</span>
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
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pengeluaran per Kategori</span>
            </div>
            {expenseByCategory.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-title">Belum ada data</div></div>
            ) : (
              <div className="flex" style={{ gap: "1rem", alignItems: "center" }}>
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                      {expenseByCategory.map((_, i) => (
                        <Cell key={i} fill={_.color || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {expenseByCategory.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
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

        {/* Recent transactions + Upcoming */}
        <div className="grid-2-1">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Transaksi Terbaru</span>
              <button className="btn btn-ghost btn-sm" onClick={() => window.location.href = "/transactions"}>Lihat Semua</button>
            </div>
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
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{acc?.name}</div>
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
