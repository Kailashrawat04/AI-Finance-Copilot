import { pgTable, real, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const financeAccounts = pgTable("finance_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  institution: text("institution").notNull(),
  type: text("type").notNull(),
  mask: text("mask").notNull(),
  balance: real("balance").notNull(),
  balanceChange: real("balance_change").notNull(),
  balanceChangeLabel: text("balance_change_label").notNull(),
  accent: text("accent").notNull(),
});

export const financeTransactions = pgTable("finance_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  merchant: text("merchant").notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  amount: real("amount").notNull(),
  type: text("type").notNull(),
  account: text("account").notNull(),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("posted"),
});

export const financeBudgets = pgTable("finance_budgets", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  category: text("category").notNull(),
  spent: real("spent").notNull(),
  limit: real("limit").notNull(),
  color: text("color").notNull(),
  status: text("status").notNull(),
});

export const insertFinanceAccountSchema = createInsertSchema(financeAccounts);
export const insertFinanceTransactionSchema = createInsertSchema(financeTransactions);
export const insertFinanceBudgetSchema = createInsertSchema(financeBudgets);

export type FinanceAccount = typeof financeAccounts.$inferSelect;
export type FinanceTransaction = typeof financeTransactions.$inferSelect;
export type FinanceBudget = typeof financeBudgets.$inferSelect;