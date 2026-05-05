"use client";

import AppLayout from "@/components/AppLayout";
import { useStore } from "@/lib/useStore";
import { formatCurrency, formatDate, Goal, getAccountBalance } from "@/lib/store";
import CurrencyInput from "@/components/CurrencyInput";
import { useState } from "react";

const GOAL_ICONS = ["🎯","💻","🏖️","🏠","🚗","💍","📚","✈️","🛡️","💰","🎓","🏋️"];

export default function GoalsPage() {
  const { store, addGoal, updateGoal, deleteGoal, addGoalContribution } = useStore();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showContribModal, setShowContribModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [tab, setTab] = useState<"active" | "achieved">("active");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", targetAmount: "", currentAmount: "0", deadline: "", note: "", icon: "🎯" });
  const [contribForm, setContribForm] = useState({ accountId: "", amount: "", contributionDate: new Date().toISOString().split("T")[0], note: "" });

  const filtered = store.goals.filter((g) => g.status === tab);
  const totalTarget = store.goals.filter((g) => g.status === "active").reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = store.goals.filter((g) => g.status === "active").reduce((s, g) => s + g.currentAmount, 0);

  const openAdd = () => {
    setEditingGoal(null);
    setForm({ name: "", targetAmount: "", currentAmount: "0", deadline: "", note: "", icon: "🎯" });
    setShowGoalModal(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({ name: goal.name, targetAmount: String(goal.targetAmount), currentAmount: String(goal.currentAmount), deadline: goal.deadline, note: goal.note, icon: goal.icon || "🎯" });
    setShowGoalModal(true);
  };

  const openContrib = (goal: Goal) => {
    setSelectedGoal(goal);
    setContribForm({ accountId: store.accounts[0]?.id || "", amount: "", contributionDate: new Date().toISOString().split("T")[0], note: "" });
    setShowContribModal(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.targetAmount) return;
    const current = Number(form.currentAmount) || 0;
    const target = Number(form.targetAmount);
    const data = {
      name: form.name,
      targetAmount: target,
      currentAmount: current,
      deadline: form.deadline,
      note: form.note,
      icon: form.icon,
      status: (current >= target ? "achieved" : "active") as "achieved" | "active",
    };
    if (editingGoal) updateGoal(editingGoal.id, data);
    else addGoal(data);
    setShowGoalModal(false);
  };

  const handleContrib = () => {
    if (!selectedGoal || !contribForm.amount || !contribForm.accountId) return;
    addGoalContribution({ accountId: contribForm.accountId, goalId: selectedGoal.id, amount: Number(contribForm.amount), contributionDate: contribForm.contributionDate, note: contribForm.note });
    setShowContribModal(false);
  };

  const selectedAcc = store.accounts.find((a) => a.id === contribForm.accountId);
  const selectedAccBalance = selectedAcc ? getAccountBalance(selectedAcc.id, store) : 0;
  const contribAmountNum = Number(contribForm.amount) || 0;

  const getDaysUntilDeadline = (deadline: string) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Target Keuangan</h1>
            <p className="page-subtitle">
              Terkumpul <strong style={{ color: "var(--accent-green)" }}>{formatCurrency(totalSaved)}</strong> dari {formatCurrency(totalTarget)} target
            </p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Tambah Target</button>
        </div>
      </div>

      <div className="page-body">
        {/* Summary */}
        <div className="grid-3 mb-4">
          {[
            { label: "Target Aktif", value: `${store.goals.filter((g) => g.status === "active").length} target`, icon: "🎯", color: "rgba(59,130,246,0.12)" },
            { label: "Total Terkumpul", value: formatCurrency(totalSaved), icon: "💰", color: "rgba(34,197,94,0.12)" },
            { label: "Sudah Tercapai", value: `${store.goals.filter((g) => g.status === "achieved").length} target`, icon: "🏆", color: "rgba(245,158,11,0.12)" },
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
          <button className={`tab-btn ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>
            Aktif ({store.goals.filter((g) => g.status === "active").length})
          </button>
          <button className={`tab-btn ${tab === "achieved" ? "active" : ""}`} onClick={() => setTab("achieved")}>
            Tercapai ({store.goals.filter((g) => g.status === "achieved").length})
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">{tab === "active" ? "⭐" : "🏆"}</div>
              <div className="empty-title">{tab === "active" ? "Belum ada target keuangan" : "Belum ada target yang tercapai"}</div>
              <div className="empty-desc">{tab === "active" && "Tetapkan target untuk memotivasi menabung!"}</div>
              {tab === "active" && <button className="btn btn-primary" onClick={openAdd}>+ Tambah Target</button>}
            </div>
          </div>
        ) : (
          <div className="grid-2">
            {filtered.map((goal) => {
              const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              const remaining = goal.targetAmount - goal.currentAmount;
              const days = getDaysUntilDeadline(goal.deadline);
              const isOverdue = days !== null && days < 0 && goal.status === "active";

              return (
                <div key={goal.id} className="card" style={{ position: "relative", overflow: "hidden" }}>
                  {/* Decorative arc background */}
                  <div style={{
                    position: "absolute", top: -30, right: -30, width: 120, height: 120,
                    borderRadius: "50%", backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))",
                    pointerEvents: "none",
                  }} />

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                        {goal.icon || "🎯"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{goal.name}</div>
                        {goal.deadline && (
                          <div style={{ fontSize: "0.65rem", color: isOverdue ? "var(--accent-red)" : "var(--text-muted)" }}>
                            {isOverdue ? "⚠️ Melewati deadline" : `📅 ${days !== null ? `${days} hari lagi` : ""} • ${formatDate(goal.deadline)}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(goal)}>✏️</button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => setConfirmDeleteId(goal.id)}>🗑️</button>
                    </div>
                  </div>

                  {/* Big progress circle feel using bar */}
                  <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: pct >= 100 ? "var(--accent-green)" : "var(--text-primary)", letterSpacing: "-0.03em" }}>
                      {pct.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {formatCurrency(goal.currentAmount)} dari {formatCurrency(goal.targetAmount)}
                    </div>
                  </div>

                  <div className="progress-bar" style={{ height: 10, marginBottom: "1rem", borderRadius: 5 }}>
                    <div className="progress-fill" style={{
                      width: `${pct}%`,
                      background: pct >= 100 ? "var(--accent-green)" : "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                      borderRadius: 5,
                    }} />
                  </div>

                  <div className="flex items-center justify-between" style={{ paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Sisa Target</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: remaining <= 0 ? "var(--accent-green)" : "var(--text-primary)" }}>
                        {remaining <= 0 ? "🎉 Tercapai!" : formatCurrency(remaining)}
                      </div>
                    </div>
                    {goal.status === "active" && (
                      <button className="btn btn-primary btn-sm" onClick={() => openContrib(goal)}>+ Tambah Tabungan</button>
                    )}
                    {goal.status === "achieved" && (
                      <span className="badge badge-green">🏆 Tercapai</span>
                    )}
                  </div>

                  {goal.note && (
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.5rem", fontStyle: "italic" }}>📝 {goal.note}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Goal modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowGoalModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editingGoal ? "Edit Target" : "Tambah Target Keuangan"}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowGoalModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Ikon</label>
                <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                  {GOAL_ICONS.map((icon) => (
                    <button key={icon} onClick={() => setForm((f) => ({ ...f, icon }))}
                      style={{ width: 40, height: 40, borderRadius: 8, border: `2px solid ${form.icon === icon ? "var(--accent-blue)" : "var(--border)"}`, background: form.icon === icon ? "rgba(59,130,246,0.1)" : "var(--bg-input)", cursor: "pointer", fontSize: "1.1rem" }}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nama Target</label>
                <input className="form-input" placeholder="Contoh: Dana Darurat, Beli Laptop..." value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Target Nominal</label>
                  <CurrencyInput value={form.targetAmount} onChange={(raw) => setForm((f) => ({ ...f, targetAmount: raw }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Dana Terkumpul</label>
                  <CurrencyInput value={form.currentAmount} onChange={(raw) => setForm((f) => ({ ...f, currentAmount: raw }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Deadline (Opsional)</label>
                <input className="form-input" type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Catatan</label>
                <textarea className="form-textarea" placeholder="Catatan target..." value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowGoalModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editingGoal ? "Simpan" : "Tambah"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Contribution modal */}
      {showContribModal && selectedGoal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowContribModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Tambah Tabungan: {selectedGoal.name}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowContribModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: "0.75rem", background: "var(--bg-input)", borderRadius: 10, marginBottom: "0.5rem" }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Sisa Target</span>
                  <span style={{ fontWeight: 700, color: "var(--accent-blue)" }}>
                    {formatCurrency(selectedGoal.targetAmount - selectedGoal.currentAmount)}
                  </span>
                </div>
                <div className="progress-bar" style={{ marginTop: "0.5rem" }}>
                  <div className="progress-fill" style={{ width: `${Math.min((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100, 100)}%`, background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Sumber Dana (Akun)</label>
                <select className="form-select" value={contribForm.accountId} onChange={(e) => setContribForm((f) => ({ ...f, accountId: e.target.value }))}>
                  <option value="">Pilih Akun</option>
                  {store.accounts.map((a) => {
                    const bal = getAccountBalance(a.id, store);
                    return (
                      <option key={a.id} value={a.id} disabled={bal < contribAmountNum && contribAmountNum > 0}>
                        {a.icon} {a.name} — {formatCurrency(bal)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedAcc && contribAmountNum > 0 && (
                <div style={{ padding: "0.75rem", background: "var(--bg-input)", borderRadius: 10, border: `1px solid ${selectedAccBalance < contribAmountNum ? "rgba(239,68,68,0.3)" : "var(--border)"}`, marginBottom: "0.5rem" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Saldo {selectedAcc.name}</span>
                    <span style={{ fontWeight: 700, fontSize: "0.88rem", color: selectedAccBalance >= contribAmountNum ? "var(--accent-green)" : "var(--accent-red)" }}>
                      {formatCurrency(selectedAccBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Setelah ditambah</span>
                    <span style={{ fontWeight: 700, fontSize: "0.88rem", color: selectedAccBalance - contribAmountNum >= 0 ? "var(--text-primary)" : "var(--accent-red)" }}>
                      {formatCurrency(selectedAccBalance - contribAmountNum)}
                    </span>
                  </div>
                  {selectedAccBalance < contribAmountNum && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "var(--accent-red)" }}>
                      ⚠️ Saldo Anda tidak cukup untuk menabung nominal ini
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Jumlah Tabungan</label>
                <CurrencyInput value={contribForm.amount} onChange={(raw) => setContribForm((f) => ({ ...f, amount: raw }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal</label>
                <input className="form-input" type="date" value={contribForm.contributionDate} onChange={(e) => setContribForm((f) => ({ ...f, contributionDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Catatan</label>
                <input className="form-input" placeholder="Opsional" value={contribForm.note} onChange={(e) => setContribForm((f) => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowContribModal(false)}>Batal</button>
              <button className="btn btn-primary" disabled={!contribForm.accountId || !contribForm.amount || selectedAccBalance < contribAmountNum} onClick={handleContrib}>💰 Tambah Tabungan</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfirmDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <span className="modal-title">🗑️ Hapus Target?</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setConfirmDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⚠️</div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                  Hapus target ini?
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Target dan semua data tabungannya akan dihapus permanen.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmDeleteId(null)}>Batal</button>
              <button className="btn btn-danger" onClick={() => { deleteGoal(confirmDeleteId); setConfirmDeleteId(null); }}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
