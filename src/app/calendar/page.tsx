"use client";

import AppLayout from "@/components/AppLayout";
import { useStore } from "@/lib/useStore";
import { formatCurrency, formatDate } from "@/lib/store";
import { useState } from "react";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

export default function CalendarPage() {
  const { store } = useStore();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const getDateStr = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${viewYear}-${m}-${d}`;
  };

  // Transactions per day
  const txByDate = new Map<string, typeof store.transactions>();
  store.transactions.forEach((t) => {
    const key = t.date;
    if (!txByDate.has(key)) txByDate.set(key, []);
    txByDate.get(key)!.push(t);
  });

  // Bills due this month
  const billDots = new Map<string, string[]>();
  store.recurringBills.forEach((b) => {
    const day = b.dueDayOrDate;
    if (day >= 1 && day <= daysInMonth) {
      const key = getDateStr(day);
      if (!billDots.has(key)) billDots.set(key, []);
      billDots.get(key)!.push(b.name + (b.status === "paid" ? " ✅" : " ⚠️"));
    }
  });

  // Debt due dates this month
  store.debts.filter((d) => d.status === "active").forEach((d) => {
    const dd = new Date(d.dueDate);
    if (dd.getFullYear() === viewYear && dd.getMonth() === viewMonth) {
      const key = d.dueDate;
      if (!billDots.has(key)) billDots.set(key, []);
      billDots.get(key)!.push(`💳 ${d.name}`);
    }
  });

  // Goal deadlines this month
  store.goals.filter((g) => g.status === "active").forEach((g) => {
    if (!g.deadline) return;
    const dd = new Date(g.deadline);
    if (dd.getFullYear() === viewYear && dd.getMonth() === viewMonth) {
      if (!billDots.has(g.deadline)) billDots.set(g.deadline, []);
      billDots.get(g.deadline)!.push(`⭐ Target: ${g.name}`);
    }
  });

  const selectedTx = selectedDate ? (txByDate.get(selectedDate) || []) : [];
  const selectedBills = selectedDate ? (billDots.get(selectedDate) || []) : [];
  const todayStr = now.toISOString().split("T")[0];

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Kalender Keuangan</h1>
        <p className="page-subtitle">Lihat transaksi dan tenggat tagihan</p>
      </div>

      <div className="page-body">
        <div className="grid-2-1" style={{ alignItems: "start" }}>
          {/* Calendar */}
          <div className="card">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button className="btn btn-ghost btn-icon" onClick={prevMonth}>←</button>
              <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
                {MONTHS_ID[viewMonth]} {viewYear}
              </span>
              <button className="btn btn-ghost btn-icon" onClick={nextMonth}>→</button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
              {DAYS.map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", padding: "0.25rem 0" }}>{d}</div>
              ))}
            </div>

            {/* Days */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dateStr = getDateStr(day);
                const dayTx = txByDate.get(dateStr) || [];
                const dayBills = billDots.get(dateStr) || [];
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const hasIncome = dayTx.some((t) => t.type === "income");
                const hasExpense = dayTx.some((t) => t.type === "expense");
                const hasBill = dayBills.length > 0;

                return (
                  <button key={day} onClick={() => setSelectedDate(isSelected ? null : dateStr)} style={{
                    borderRadius: 8,
                    padding: "0.4rem 0",
                    background: isSelected ? "var(--accent-blue)" : isToday ? "rgba(59,130,246,0.15)" : "transparent",
                    border: isToday ? "1px solid var(--accent-blue)" : "1px solid transparent",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    transition: "background 0.15s",
                  }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: isToday ? 700 : 400, color: isSelected ? "white" : isToday ? "var(--accent-blue)" : "var(--text-primary)" }}>{day}</span>
                    {/* Dots */}
                    <div style={{ display: "flex", gap: 2 }}>
                      {hasIncome && <span style={{ width: 4, height: 4, borderRadius: "50%", background: isSelected ? "rgba(255,255,255,0.7)" : "var(--accent-green)" }} />}
                      {hasExpense && <span style={{ width: 4, height: 4, borderRadius: "50%", background: isSelected ? "rgba(255,255,255,0.7)" : "var(--accent-red)" }} />}
                      {hasBill && <span style={{ width: 4, height: 4, borderRadius: "50%", background: isSelected ? "rgba(255,255,255,0.7)" : "var(--accent-amber)" }} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4" style={{ justifyContent: "center" }}>
              {[["var(--accent-green)", "Pemasukan"], ["var(--accent-red)", "Pengeluaran"], ["var(--accent-amber)", "Tagihan/Cicilan"]].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {selectedDate ? (
              <>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">📅 {formatDate(selectedDate)}</span>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedDate(null)}>✕</button>
                  </div>

                  {selectedBills.length > 0 && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Tenggat</div>
                      {selectedBills.map((b, i) => (
                        <div key={i} style={{ fontSize: "0.78rem", color: "var(--accent-amber)", padding: "0.25rem 0", borderBottom: i < selectedBills.length - 1 ? "1px solid var(--border)" : "none" }}>{b}</div>
                      ))}
                    </div>
                  )}

                  {selectedTx.length > 0 ? (
                    <div>
                      <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Transaksi ({selectedTx.length})</div>
                      {selectedTx.map((tx) => {
                        const cat = store.categories.find((c) => c.id === tx.categoryId);
                        return (
                          <div key={tx.id} className="flex items-center justify-between" style={{ padding: "0.375rem 0", borderBottom: "1px solid var(--border)" }}>
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: "0.9rem" }}>{cat?.icon || "💰"}</span>
                              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{tx.note || cat?.name}</span>
                            </div>
                            <span className={`font-semibold ${tx.type === "income" ? "tx-income" : tx.type === "expense" ? "tx-expense" : "tx-transfer"}`} style={{ fontSize: "0.8rem" }}>
                              {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "⇄"}{formatCurrency(tx.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center", padding: "0.5rem 0" }}>
                      {selectedBills.length === 0 ? "Tidak ada aktivitas" : ""}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="card">
                <div className="empty-state" style={{ padding: "2rem 1rem" }}>
                  <div className="empty-icon">📅</div>
                  <div className="empty-title">Pilih tanggal</div>
                  <div className="empty-desc">Klik tanggal di kalender untuk melihat detail</div>
                </div>
              </div>
            )}

            {/* Upcoming events */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Tagihan Bulan Ini</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {store.recurringBills.slice(0, 5).map((b) => {
                  const overdue = b.dueDayOrDate < now.getDate() && now.getMonth() === viewMonth && b.status === "unpaid";
                  return (
                    <div key={b.id} className="flex items-center justify-between" style={{ padding: "0.375rem 0.5rem", borderRadius: 8, background: "var(--bg-input)" }}>
                      <div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{b.name}</div>
                        <div style={{ fontSize: "0.65rem", color: overdue ? "var(--accent-red)" : "var(--text-muted)" }}>
                          {overdue ? "⚠️ Telat!" : `Tgl ${b.dueDayOrDate}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: b.status === "paid" ? "var(--accent-green)" : "var(--accent-red)" }}>{formatCurrency(b.amount)}</span>
                        <span className={`badge ${b.status === "paid" ? "badge-green" : "badge-red"}`}>{b.status === "paid" ? "✓" : "!"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
