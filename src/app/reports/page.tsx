"use client";

import AppLayout from "@/components/AppLayout";
import { useStore } from "@/lib/useStore";
import {
  formatCurrency,
  getMonthlyIncome,
  getMonthlyExpense,
  getCategoryExpense,
} from "@/lib/store";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "@/lib/charts";
import { useState } from "react";

const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export default function ReportsPage() {
  const { store } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const prevM = month === 1 ? 12 : month - 1;
  const prevY = month === 1 ? year - 1 : year;

  const income = getMonthlyIncome(store, month, year);
  const expense = getMonthlyExpense(store, month, year);
  const prevIncome = getMonthlyIncome(store, prevM, prevY);
  const prevExpense = getMonthlyExpense(store, prevM, prevY);
  const net = income - expense;
  const savingRate = income > 0 ? ((income - expense) / income * 100) : 0;

  // Category breakdown
  const categoryData = store.categories
    .filter((c) => c.type !== "income")
    .map((cat) => ({
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      value: getCategoryExpense(cat.id, store, month, year),
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  // 6-month trend
  const trendData = Array.from({ length: 6 }, (_, i) => {
    let m = month - (5 - i);
    let y = year;
    if (m <= 0) { m += 12; y -= 1; }
    return {
      name: MONTHS_ID[m - 1],
      pemasukan: getMonthlyIncome(store, m, y) / 1000000,
      pengeluaran: getMonthlyExpense(store, m, y) / 1000000,
    };
  });

  // Top transactions
  const topTx = [...store.transactions]
    .filter((t) => {
      const d = new Date(t.date);
      return t.type === "expense" && d.getMonth() + 1 === month && d.getFullYear() === year;
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Insights
  const insights: { icon: string; type: "info" | "warn" | "good"; text: string }[] = [];
  if (expense > prevExpense && prevExpense > 0) {
    const pct = ((expense - prevExpense) / prevExpense * 100).toFixed(0);
    insights.push({ icon: "📈", type: "warn", text: `Pengeluaran naik ${pct}% dibanding bulan lalu.` });
  } else if (expense < prevExpense && prevExpense > 0) {
    const pct = ((prevExpense - expense) / prevExpense * 100).toFixed(0);
    insights.push({ icon: "📉", type: "good", text: `Pengeluaran turun ${pct}% dibanding bulan lalu. Bagus!` });
  }
  if (savingRate >= 20) {
    insights.push({ icon: "💰", type: "good", text: `Saving rate ${savingRate.toFixed(0)}% — sudah sesuai rekomendasi finansial.` });
  } else if (income > 0 && savingRate < 10) {
    insights.push({ icon: "⚠️", type: "warn", text: `Saving rate ${savingRate.toFixed(0)}% terlalu rendah. Coba target minimal 20%.` });
  }
  if (categoryData.length > 0) {
    insights.push({ icon: "🍽️", type: "info", text: `Pengeluaran terbesar: ${categoryData[0].icon} ${categoryData[0].name} (${formatCurrency(categoryData[0].value)}).` });
  }
  const unpaidBills = store.recurringBills.filter((b) => b.status === "unpaid");
  if (unpaidBills.length > 0) {
    const total = unpaidBills.reduce((s, b) => s + b.amount, 0);
    insights.push({ icon: "📃", type: "warn", text: `${unpaidBills.length} tagihan belum dibayar total ${formatCurrency(total)}.` });
  }

  const tooltipStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" };

  const insightColors: Record<string, string> = {
    good: "rgba(34,197,94,0.1)",
    warn: "rgba(245,158,11,0.1)",
    info: "rgba(59,130,246,0.1)",
  };
  const insightBorderColors: Record<string, string> = {
    good: "rgba(34,197,94,0.25)",
    warn: "rgba(245,158,11,0.25)",
    info: "rgba(59,130,246,0.25)",
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Laporan Keuangan</h1>
            <p className="page-subtitle">Ringkasan keuangan bulanan Anda</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="form-select" style={{ width: "auto" }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS_ID.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="form-select" style={{ width: "auto" }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* KPI Row */}
        <div className="grid-4 mb-4">
          {[
            { label: "Pemasukan", value: formatCurrency(income), sub: `vs ${formatCurrency(prevIncome)} lalu`, color: "var(--accent-green)", icon: "📈", up: income >= prevIncome },
            { label: "Pengeluaran", value: formatCurrency(expense), sub: `vs ${formatCurrency(prevExpense)} lalu`, color: "var(--accent-red)", icon: "📉", up: expense <= prevExpense },
            { label: "Cashflow Bersih", value: formatCurrency(net), sub: net >= 0 ? "Surplus" : "Defisit", color: net >= 0 ? "var(--accent-green)" : "var(--accent-red)", icon: "💹", up: net >= 0 },
            { label: "Saving Rate", value: `${Math.max(0, savingRate).toFixed(1)}%`, sub: "dari pemasukan", color: savingRate >= 20 ? "var(--accent-green)" : savingRate >= 10 ? "var(--accent-amber)" : "var(--accent-red)", icon: "💰", up: savingRate >= 20 },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "1.1rem" }}>{s.icon}</span>
                <span style={{ fontSize: "0.65rem", color: s.up ? "var(--accent-green)" : "var(--accent-red)" }}>
                  {s.up ? "▲" : "▼"}
                </span>
              </div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color, fontSize: "1.1rem" }}>{s.value}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid-2 mb-4">
          {/* 6-month trend */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Tren 6 Bulan Terakhir (Juta)</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#5a6d8a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5a6d8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(2)}M`, ""]} />
                <Bar dataKey="pemasukan" fill="#22c55e" radius={[4,4,0,0]} name="Pemasukan" />
                <Bar dataKey="pengeluaran" fill="#ef4444" radius={[4,4,0,0]} name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category pie */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pengeluaran per Kategori</span>
            </div>
            {categoryData.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-title">Belum ada pengeluaran</div></div>
            ) : (
              <div className="flex" style={{ gap: "1rem", alignItems: "center" }}>
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                      {categoryData.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [formatCurrency(Number(v)), ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {categoryData.slice(0, 6).map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{c.icon} {c.name}</span>
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid-2">
          {/* Top transactions */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pengeluaran Terbesar</span>
            </div>
            {topTx.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Belum ada pengeluaran</div></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {topTx.map((tx, i) => {
                  const cat = store.categories.find((c) => c.id === tx.categoryId);
                  const acc = store.accounts.find((a) => a.id === tx.accountId);
                  return (
                    <div key={tx.id} className="flex items-center gap-3" style={{ padding: "0.5rem", background: "var(--bg-input)", borderRadius: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: "#ef444422", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem", color: "var(--accent-red)", flexShrink: 0 }}>#{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>{tx.note || cat?.name}</div>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{acc?.name} • {cat?.icon} {cat?.name}</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--accent-red)" }}>-{formatCurrency(tx.amount)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI-like Insights */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">💡 Insight Keuangan</span>
            </div>
            {insights.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">💡</div><div className="empty-title">Tidak ada insight</div><div className="empty-desc">Tambah lebih banyak data transaksi</div></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {insights.map((ins, i) => (
                  <div key={i} style={{ padding: "0.75rem", background: insightColors[ins.type], border: `1px solid ${insightBorderColors[ins.type]}`, borderRadius: 10 }}>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-primary)" }}>
                      <span style={{ marginRight: "0.375rem" }}>{ins.icon}</span>
                      {ins.text}
                    </div>
                  </div>
                ))}

                <div style={{ padding: "0.75rem", background: "var(--bg-input)", borderRadius: 10 }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.375rem", fontWeight: 600 }}>RINGKASAN BULAN INI</div>
                  <div className="flex items-center justify-between" style={{ marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Rata-rata pengeluaran/hari</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{formatCurrency(expense / now.getDate())}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Estimasi pengeluaran bulan ini</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{formatCurrency(expense / now.getDate() * 30)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
