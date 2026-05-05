"use client";

export type AccountType = "cash" | "bank" | "ewallet" | "savings" | "emergency" | "custom";
export type TransactionType = "income" | "expense" | "transfer";
export type DebtStatus = "active" | "paid";
export type GoalStatus = "active" | "achieved";
export type BillFrequency = "weekly" | "monthly" | "yearly";
export type BillStatus = "unpaid" | "paid";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  createdAt: string;
  icon?: string;
  color?: string;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense" | "both";
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  accountId: string;
  destinationAccountId?: string;
  categoryId: string;
  amount: number;
  date: string;
  note: string;
  tag?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  name: string;
  lenderName: string;
  totalAmount: number;
  monthlyInstallment: number;
  amountPaid: number;
  startDate: string;
  dueDate: string;
  status: DebtStatus;
  note: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  note: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  frequency: BillFrequency;
  dueDayOrDate: number;
  categoryId: string;
  defaultAccountId: string;
  status: BillStatus;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: number;
  year: number;
  amount: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  note: string;
  status: GoalStatus;
  icon?: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  contributionDate: string;
  note: string;
}

export interface FinanceStore {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  recurringBills: RecurringBill[];
  budgets: Budget[];
  goals: Goal[];
  goalContributions: GoalContribution[];
}

// ── Default categories ────────────────────────────────────────────────
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Gaji & Pendapatan", type: "income", icon: "💰", color: "#22c55e" },
  { id: "cat-2", name: "Freelance", type: "income", icon: "💼", color: "#3b82f6" },
  { id: "cat-3", name: "Makan & Minum", type: "expense", icon: "🍽️", color: "#f97316" },
  { id: "cat-4", name: "Transport", type: "expense", icon: "🚗", color: "#8b5cf6" },
  { id: "cat-5", name: "Tagihan", type: "expense", icon: "📃", color: "#ef4444" },
  { id: "cat-6", name: "Cicilan", type: "expense", icon: "🏦", color: "#dc2626" },
  { id: "cat-7", name: "Kesehatan", type: "expense", icon: "🏥", color: "#06b6d4" },
  { id: "cat-8", name: "Belanja", type: "expense", icon: "🛒", color: "#f59e0b" },
  { id: "cat-9", name: "Hiburan", type: "expense", icon: "🎮", color: "#ec4899" },
  { id: "cat-10", name: "Pendidikan", type: "expense", icon: "📚", color: "#6366f1" },
  { id: "cat-11", name: "Ibadah / Sedekah", type: "expense", icon: "🕌", color: "#14b8a6" },
  { id: "cat-12", name: "Keluarga", type: "expense", icon: "👨‍👩‍👦", color: "#a855f7" },
  { id: "cat-13", name: "Usaha", type: "expense", icon: "🏪", color: "#64748b" },
  { id: "cat-14", name: "Lainnya", type: "both", icon: "📌", color: "#94a3b8" },
];

// ── Seed data ─────────────────────────────────────────────────────────
const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const daysAgo = (n: number) => fmt(new Date(today.getTime() - n * 86400000));

const SEED_DATA: FinanceStore = {
  accounts: [
    { id: "acc-1", name: "Dompet", type: "cash", initialBalance: 500000, createdAt: daysAgo(60), icon: "👛", color: "#f59e0b" },
    { id: "acc-2", name: "BCA", type: "bank", initialBalance: 8000000, createdAt: daysAgo(60), icon: "🏦", color: "#3b82f6" },
    { id: "acc-3", name: "GoPay", type: "ewallet", initialBalance: 200000, createdAt: daysAgo(60), icon: "💚", color: "#22c55e" },
    { id: "acc-4", name: "Tabungan", type: "savings", initialBalance: 15000000, createdAt: daysAgo(60), icon: "💎", color: "#8b5cf6" },
  ],
  categories: DEFAULT_CATEGORIES,
  transactions: [
    { id: "t1", type: "income", accountId: "acc-2", categoryId: "cat-1", amount: 8500000, date: daysAgo(20), note: "Gaji Maret", createdAt: daysAgo(20) },
    { id: "t2", type: "expense", accountId: "acc-1", categoryId: "cat-3", amount: 45000, date: daysAgo(19), note: "Makan siang", createdAt: daysAgo(19) },
    { id: "t3", type: "expense", accountId: "acc-2", categoryId: "cat-4", amount: 150000, date: daysAgo(18), note: "Bensin", createdAt: daysAgo(18) },
    { id: "t4", type: "expense", accountId: "acc-2", categoryId: "cat-5", amount: 350000, date: daysAgo(17), note: "Listrik PLN", createdAt: daysAgo(17) },
    { id: "t5", type: "expense", accountId: "acc-2", categoryId: "cat-6", amount: 950000, date: daysAgo(15), note: "Cicilan motor", createdAt: daysAgo(15) },
    { id: "t6", type: "expense", accountId: "acc-3", categoryId: "cat-8", amount: 275000, date: daysAgo(14), note: "Belanja bulanan", createdAt: daysAgo(14) },
    { id: "t7", type: "expense", accountId: "acc-1", categoryId: "cat-3", amount: 35000, date: daysAgo(13), note: "Kopi & snack", createdAt: daysAgo(13) },
    { id: "t8", type: "income", accountId: "acc-2", categoryId: "cat-2", amount: 1500000, date: daysAgo(12), note: "Project freelance", createdAt: daysAgo(12) },
    { id: "t9", type: "expense", accountId: "acc-2", categoryId: "cat-9", amount: 120000, date: daysAgo(10), note: "Netflix + Spotify", createdAt: daysAgo(10) },
    { id: "t10", type: "transfer", accountId: "acc-2", destinationAccountId: "acc-4", categoryId: "cat-14", amount: 1000000, date: daysAgo(9), note: "Nabung", createdAt: daysAgo(9) },
    { id: "t11", type: "expense", accountId: "acc-1", categoryId: "cat-3", amount: 65000, date: daysAgo(7), note: "Makan keluarga", createdAt: daysAgo(7) },
    { id: "t12", type: "expense", accountId: "acc-3", categoryId: "cat-4", amount: 25000, date: daysAgo(6), note: "Ojek online", createdAt: daysAgo(6) },
    { id: "t13", type: "expense", accountId: "acc-2", categoryId: "cat-7", amount: 200000, date: daysAgo(5), note: "Apotek", createdAt: daysAgo(5) },
    { id: "t14", type: "expense", accountId: "acc-2", categoryId: "cat-11", amount: 100000, date: daysAgo(4), note: "Sedekah", createdAt: daysAgo(4) },
    { id: "t15", type: "expense", accountId: "acc-1", categoryId: "cat-3", amount: 55000, date: daysAgo(2), note: "Makan siang + minum", createdAt: daysAgo(2) },
    { id: "t16", type: "income", accountId: "acc-2", categoryId: "cat-1", amount: 8500000, date: fmt(today), note: "Gaji April", createdAt: fmt(today) },
  ],
  debts: [
    { id: "d1", name: "KPR Rumah", lenderName: "Bank BRI", totalAmount: 150000000, monthlyInstallment: 2100000, amountPaid: 25200000, startDate: "2023-01-01", dueDate: "2033-01-01", status: "active", note: "KPR 10 tahun" },
    { id: "d2", name: "Kredit Motor", lenderName: "Adira Finance", totalAmount: 18000000, monthlyInstallment: 950000, amountPaid: 9500000, startDate: "2023-04-01", dueDate: "2025-04-01", status: "active", note: "Motor Honda Beat" },
    { id: "d3", name: "Pinjaman Teman", lenderName: "Budi Santoso", totalAmount: 2000000, monthlyInstallment: 0, amountPaid: 2000000, startDate: "2024-01-01", dueDate: "2024-06-01", status: "paid", note: "Sudah lunas" },
  ],
  debtPayments: [
    { id: "dp1", debtId: "d1", amount: 2100000, paymentDate: daysAgo(25), note: "Bayar bulan ini" },
    { id: "dp2", debtId: "d2", amount: 950000, paymentDate: daysAgo(15), note: "Cicilan maret" },
  ],
  recurringBills: [
    { id: "b1", name: "PLN Listrik", amount: 350000, frequency: "monthly", dueDayOrDate: 20, categoryId: "cat-5", defaultAccountId: "acc-2", status: "paid", createdAt: daysAgo(30) },
    { id: "b2", name: "IndiHome Internet", amount: 280000, frequency: "monthly", dueDayOrDate: 15, categoryId: "cat-5", defaultAccountId: "acc-2", status: "unpaid", createdAt: daysAgo(30) },
    { id: "b3", name: "BPJS Kesehatan", amount: 85000, frequency: "monthly", dueDayOrDate: 10, categoryId: "cat-7", defaultAccountId: "acc-2", status: "unpaid", createdAt: daysAgo(30) },
    { id: "b4", name: "Netflix", amount: 54000, frequency: "monthly", dueDayOrDate: 5, categoryId: "cat-9", defaultAccountId: "acc-3", status: "paid", createdAt: daysAgo(30) },
    { id: "b5", name: "Spotify Premium", amount: 54990, frequency: "monthly", dueDayOrDate: 8, categoryId: "cat-9", defaultAccountId: "acc-3", status: "unpaid", createdAt: daysAgo(30) },
  ],
  budgets: [
    { id: "bg1", categoryId: "cat-3", month: today.getMonth() + 1, year: today.getFullYear(), amount: 1200000 },
    { id: "bg2", categoryId: "cat-4", month: today.getMonth() + 1, year: today.getFullYear(), amount: 500000 },
    { id: "bg3", categoryId: "cat-5", month: today.getMonth() + 1, year: today.getFullYear(), amount: 700000 },
    { id: "bg4", categoryId: "cat-8", month: today.getMonth() + 1, year: today.getFullYear(), amount: 600000 },
    { id: "bg5", categoryId: "cat-9", month: today.getMonth() + 1, year: today.getFullYear(), amount: 200000 },
    { id: "bg6", categoryId: "cat-7", month: today.getMonth() + 1, year: today.getFullYear(), amount: 300000 },
  ],
  goals: [
    { id: "g1", name: "Dana Darurat", targetAmount: 30000000, currentAmount: 15000000, deadline: "2025-12-31", note: "Target 6x pengeluaran bulanan", status: "active", icon: "🛡️" },
    { id: "g2", name: "Beli Laptop Baru", targetAmount: 15000000, currentAmount: 4500000, deadline: "2025-08-31", note: "MacBook Air M2", status: "active", icon: "💻" },
    { id: "g3", name: "Liburan Bali", targetAmount: 8000000, currentAmount: 2000000, deadline: "2025-06-30", note: "Liburan keluarga", status: "active", icon: "🏖️" },
  ],
  goalContributions: [
    { id: "gc1", goalId: "g1", amount: 1000000, contributionDate: daysAgo(30), note: "Tabungan bulan lalu" },
    { id: "gc2", goalId: "g2", amount: 500000, contributionDate: daysAgo(15), note: "Sisihkan gaji" },
  ],
};

// ── LocalStorage helpers ──────────────────────────────────────────────
const STORE_KEY = "financeTrackerData";

export function getStore(): FinanceStore {
  if (typeof window === "undefined") return SEED_DATA;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      localStorage.setItem(STORE_KEY, JSON.stringify(SEED_DATA));
      return SEED_DATA;
    }
    return JSON.parse(raw) as FinanceStore;
  } catch {
    return SEED_DATA;
  }
}

export function saveStore(data: FinanceStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

export function resetStore(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORE_KEY, JSON.stringify(SEED_DATA));
}

// ── Financial calculations ────────────────────────────────────────────
export function getAccountBalance(accountId: string, store: FinanceStore): number {
  const account = store.accounts.find((a) => a.id === accountId);
  if (!account) return 0;
  let balance = account.initialBalance;
  for (const t of store.transactions) {
    if (t.type === "income" && t.accountId === accountId) balance += t.amount;
    if (t.type === "expense" && t.accountId === accountId) balance -= t.amount;
    if (t.type === "transfer") {
      if (t.accountId === accountId) balance -= t.amount;
      if (t.destinationAccountId === accountId) balance += t.amount;
    }
  }
  return balance;
}

export function getTotalBalance(store: FinanceStore): number {
  return store.accounts.reduce((sum, acc) => sum + getAccountBalance(acc.id, store), 0);
}

export function getMonthlyIncome(store: FinanceStore, month: number, year: number): number {
  return store.transactions
    .filter((t) => {
      const d = new Date(t.date);
      return t.type === "income" && d.getMonth() + 1 === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getMonthlyExpense(store: FinanceStore, month: number, year: number): number {
  return store.transactions
    .filter((t) => {
      const d = new Date(t.date);
      return t.type === "expense" && d.getMonth() + 1 === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getCategoryExpense(categoryId: string, store: FinanceStore, month: number, year: number): number {
  return store.transactions
    .filter((t) => {
      const d = new Date(t.date);
      return t.type === "expense" && t.categoryId === categoryId && d.getMonth() + 1 === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalActiveDebt(store: FinanceStore): number {
  return store.debts
    .filter((d) => d.status === "active")
    .reduce((sum, d) => sum + (d.totalAmount - d.amountPaid), 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
