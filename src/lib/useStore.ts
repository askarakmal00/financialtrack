"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FinanceStore,
  getStore,
  saveStore,
  Account,
  Transaction,
  Debt,
  DebtPayment,
  RecurringBill,
  Budget,
  Goal,
  GoalContribution,
  generateId,
} from "./store";

export function useStore() {
  const [store, setStore] = useState<FinanceStore>(() => getStore());

  // Reload from localStorage on mount
  useEffect(() => {
    setStore(getStore());
  }, []);

  const update = useCallback((updater: (prev: FinanceStore) => FinanceStore) => {
    setStore((prev) => {
      const next = updater(prev);
      saveStore(next);
      return next;
    });
  }, []);

  // ── Accounts ──────────────────────────────────────────
  const addAccount = (data: Omit<Account, "id" | "createdAt">) =>
    update((s) => ({
      ...s,
      accounts: [...s.accounts, { ...data, id: generateId(), createdAt: new Date().toISOString().split("T")[0] }],
    }));

  const updateAccount = (id: string, data: Partial<Account>) =>
    update((s) => ({ ...s, accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...data } : a)) }));

  const deleteAccount = (id: string) =>
    update((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== id) }));

  // ── Transactions ──────────────────────────────────────
  const addTransaction = (data: Omit<Transaction, "id" | "createdAt">) =>
    update((s) => ({
      ...s,
      transactions: [
        ...s.transactions,
        { ...data, id: generateId(), createdAt: new Date().toISOString() },
      ],
    }));

  const updateTransaction = (id: string, data: Partial<Transaction>) =>
    update((s) => ({ ...s, transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...data } : t)) }));

  const deleteTransaction = (id: string) =>
    update((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));

  // ── Debts ─────────────────────────────────────────────
  const addDebt = (data: Omit<Debt, "id">) =>
    update((s) => ({ ...s, debts: [...s.debts, { ...data, id: generateId() }] }));

  const updateDebt = (id: string, data: Partial<Debt>) =>
    update((s) => ({ ...s, debts: s.debts.map((d) => (d.id === id ? { ...d, ...data } : d)) }));

  const deleteDebt = (id: string) =>
    update((s) => ({ ...s, debts: s.debts.filter((d) => d.id !== id) }));

  const addDebtPayment = (data: Omit<DebtPayment, "id"> & { accountId?: string }) =>
    update((s) => {
      const payment: DebtPayment = { debtId: data.debtId, amount: data.amount, paymentDate: data.paymentDate, note: data.note, id: generateId() };
      const updatedDebts = s.debts.map((d) => {
        if (d.id !== data.debtId) return d;
        const newAmountPaid = d.amountPaid + data.amount;
        return {
          ...d,
          amountPaid: newAmountPaid,
          status: (newAmountPaid >= d.totalAmount ? "paid" : "active") as "paid" | "active",
        };
      });
      const newTransactions = [...s.transactions];
      if (data.accountId) {
        const debt = s.debts.find((d) => d.id === data.debtId);
        newTransactions.push({
          id: generateId(), type: "expense", accountId: data.accountId,
          categoryId: "cat-6", amount: data.amount, date: data.paymentDate,
          note: `Bayar cicilan: ${debt?.name || ""}`,
          createdAt: new Date().toISOString(),
        });
      }
      return { ...s, debts: updatedDebts, debtPayments: [...s.debtPayments, payment], transactions: newTransactions };
    });

  // ── Recurring Bills ───────────────────────────────────
  const addBill = (data: Omit<RecurringBill, "id" | "createdAt">) =>
    update((s) => ({
      ...s,
      recurringBills: [...s.recurringBills, { ...data, id: generateId(), createdAt: new Date().toISOString().split("T")[0] }],
    }));

  const updateBill = (id: string, data: Partial<RecurringBill>) =>
    update((s) => ({ ...s, recurringBills: s.recurringBills.map((b) => (b.id === id ? { ...b, ...data } : b)) }));

  const deleteBill = (id: string) =>
    update((s) => ({ ...s, recurringBills: s.recurringBills.filter((b) => b.id !== id) }));

  const payBill = (id: string, accountId?: string) =>
    update((s) => {
      const bill = s.recurringBills.find((b) => b.id === id);
      if (!bill) return s;
      const targetAccountId = accountId || bill.defaultAccountId;
      if (!targetAccountId) return s;
      const now = new Date();
      const newTx: Transaction = {
        id: generateId(), type: "expense",
        accountId: targetAccountId,
        categoryId: bill.categoryId,
        amount: bill.amount,
        date: now.toISOString().split("T")[0],
        note: `Bayar tagihan: ${bill.name}`,
        createdAt: now.toISOString(),
      };
      return {
        ...s,
        recurringBills: s.recurringBills.map((b) => (b.id === id ? { ...b, status: "paid" as const } : b)),
        transactions: [...s.transactions, newTx],
      };
    });

  // ── Budgets ───────────────────────────────────────────
  const saveBudget = (data: Omit<Budget, "id">) =>
    update((s) => {
      const existing = s.budgets.find((b) => b.categoryId === data.categoryId && b.month === data.month && b.year === data.year);
      if (existing) {
        return { ...s, budgets: s.budgets.map((b) => (b.id === existing.id ? { ...b, amount: data.amount } : b)) };
      }
      return { ...s, budgets: [...s.budgets, { ...data, id: generateId() }] };
    });

  const deleteBudget = (id: string) =>
    update((s) => ({ ...s, budgets: s.budgets.filter((b) => b.id !== id) }));

  // ── Goals ─────────────────────────────────────────────
  const addGoal = (data: Omit<Goal, "id">) =>
    update((s) => ({ ...s, goals: [...s.goals, { ...data, id: generateId() }] }));

  const updateGoal = (id: string, data: Partial<Goal>) =>
    update((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...data } : g)) }));

  const deleteGoal = (id: string) =>
    update((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));

  const addGoalContribution = (data: Omit<GoalContribution, "id"> & { accountId?: string }) =>
    update((s) => {
      const contribution: GoalContribution = { goalId: data.goalId, amount: data.amount, contributionDate: data.contributionDate, note: data.note, id: generateId() };
      const updatedGoals = s.goals.map((g) => {
        if (g.id !== data.goalId) return g;
        const newAmount = g.currentAmount + data.amount;
        return {
          ...g,
          currentAmount: newAmount,
          status: (newAmount >= g.targetAmount ? "achieved" : "active") as "achieved" | "active",
        };
      });
      const newTransactions = [...s.transactions];
      if (data.accountId) {
        const goal = s.goals.find((g) => g.id === data.goalId);
        newTransactions.push({
          id: generateId(), type: "transfer", accountId: data.accountId,
          destinationAccountId: undefined, categoryId: "cat-14",
          amount: data.amount, date: data.contributionDate,
          note: `Tabungan target: ${goal?.name || ""}`,
          createdAt: new Date().toISOString(),
        });
      }
      return { ...s, goals: updatedGoals, goalContributions: [...s.goalContributions, contribution], transactions: newTransactions };
    });

  return {
    store,
    // Accounts
    addAccount, updateAccount, deleteAccount,
    // Transactions
    addTransaction, updateTransaction, deleteTransaction,
    // Debts
    addDebt, updateDebt, deleteDebt, addDebtPayment,
    // Bills
    addBill, updateBill, deleteBill, payBill,
    // Budgets
    saveBudget, deleteBudget,
    // Goals
    addGoal, updateGoal, deleteGoal, addGoalContribution,
  };
}
