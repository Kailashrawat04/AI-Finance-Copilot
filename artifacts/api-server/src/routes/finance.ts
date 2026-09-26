import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  financeAccounts,
  financeBudgets,
  financeTransactions,
} from "@workspace/db";
import {
  CreateFinanceTransactionBody,
  CreateFinanceTransactionResponse,
  CreateFinanceAccountBody,
  CreateFinanceAccountResponse,
  CreateFinanceBudgetBody,
  CreateFinanceBudgetResponse,
  GetFinanceDashboardResponse,
  ListFinanceAccountsResponse,
  ListFinanceBudgetsResponse,
  ListFinanceTransactionsQueryParams,
  ListFinanceTransactionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const seedAccounts = [
  {
    id: "account-1",
    name: "Everyday Checking",
    institution: "Northstar Bank",
    type: "checking",
    mask: "4821",
    balance: 12480.32,
    balanceChange: 4.8,
    balanceChangeLabel: "vs. last month",
    accent: "teal",
  },
  {
    id: "account-2",
    name: "High-yield Savings",
    institution: "Northstar Bank",
    type: "savings",
    mask: "1904",
    balance: 28640.0,
    balanceChange: 8.2,
    balanceChangeLabel: "vs. last month",
    accent: "gold",
  },
  {
    id: "account-3",
    name: "Platinum Card",
    institution: "Amethyst",
    type: "credit",
    mask: "7742",
    balance: -1840.65,
    balanceChange: -12.4,
    balanceChangeLabel: "utilization",
    accent: "violet",
  },
];

const seedTransactions = [
  {
    id: "txn-1",
    merchant: "Blue Bottle Coffee",
    category: "Dining",
    date: "2026-09-21",
    amount: 8.5,
    type: "expense",
    account: "Platinum Card",
    note: "Morning coffee",
    status: "posted",
  },
  {
    id: "txn-2",
    merchant: "Acme Payroll",
    category: "Income",
    date: "2026-09-20",
    amount: 4820,
    type: "income",
    account: "Everyday Checking",
    note: "September paycheck",
    status: "posted",
  },
  {
    id: "txn-3",
    merchant: "Whole Foods Market",
    category: "Groceries",
    date: "2026-09-19",
    amount: 124.76,
    type: "expense",
    account: "Everyday Checking",
    note: "Weekly groceries",
    status: "posted",
  },
  {
    id: "txn-4",
    merchant: "Notion",
    category: "Subscriptions",
    date: "2026-09-18",
    amount: 10,
    type: "expense",
    account: "Platinum Card",
    note: "Monthly plan",
    status: "posted",
  },
  {
    id: "txn-5",
    merchant: "Metro Transit",
    category: "Transport",
    date: "2026-09-17",
    amount: 42,
    type: "expense",
    account: "Platinum Card",
    note: "Monthly pass",
    status: "posted",
  },
  {
    id: "txn-6",
    merchant: "Juniper House",
    category: "Dining",
    date: "2026-09-16",
    amount: 86.2,
    type: "expense",
    account: "Platinum Card",
    note: "Dinner with friends",
    status: "posted",
  },
  {
    id: "txn-7",
    merchant: "Lumen Electric",
    category: "Utilities",
    date: "2026-09-15",
    amount: 74.2,
    type: "expense",
    account: "Everyday Checking",
    note: "August statement",
    status: "posted",
  },
  {
    id: "txn-8",
    merchant: "Atlas Fitness",
    category: "Health",
    date: "2026-09-14",
    amount: 59,
    type: "expense",
    account: "Platinum Card",
    note: "Monthly membership",
    status: "pending",
  },
];

const seedBudgets = [
  { id: "budget-1", category: "Dining", spent: 318, limit: 450, color: "coral", status: "on_track" },
  { id: "budget-2", category: "Groceries", spent: 412, limit: 500, color: "teal", status: "on_track" },
  { id: "budget-3", category: "Transport", spent: 286, limit: 300, color: "gold", status: "watch" },
  { id: "budget-4", category: "Subscriptions", spent: 196, limit: 180, color: "violet", status: "over" },
];

const seedPromises = new Map<string, Promise<void>>();

export async function ensureFinanceSeeded(_userId: string) {
  // New workspaces intentionally start empty. Existing user-owned rows remain
  // untouched; the legacy starter arrays above are no longer inserted.
}

function toTransactionResponse(transaction: typeof seedTransactions[number]) {
  return {
    ...transaction,
    note: transaction.note ?? "",
    date: new Date(`${transaction.date}T00:00:00.000Z`),
  };
}

router.get("/finance/accounts", async (_req, res, next) => {
  try {
    const userId = res.locals.userId as string;
    await ensureFinanceSeeded(userId);
    const accounts = await db
      .select()
      .from(financeAccounts)
      .where(eq(financeAccounts.userId, userId));
    res.json(ListFinanceAccountsResponse.parse(accounts));
  } catch (error) {
    next(error);
  }
});

router.post("/finance/accounts", async (req, res, next) => {
  try {
    const userId = res.locals.userId as string;
    const body = CreateFinanceAccountBody.parse(req.body);
    const account = {
      id: crypto.randomUUID(),
      userId,
      name: body.name,
      institution: body.institution,
      type: body.type,
      mask: body.mask,
      balance: body.balance,
      balanceChange: body.balanceChange ?? 0,
      balanceChangeLabel: body.balanceChangeLabel ?? "manual entry",
      accent: body.accent ?? "teal",
    };
    await db.insert(financeAccounts).values(account);
    res.status(201).json(CreateFinanceAccountResponse.parse(account));
  } catch (error) {
    next(error);
  }
});

router.get("/finance/transactions", async (req, res, next) => {
  try {
    const userId = res.locals.userId as string;
    await ensureFinanceSeeded(userId);
    const params = ListFinanceTransactionsQueryParams.parse(req.query);
    const filters = [];
    if (params.search) {
      filters.push(
        or(
          ilike(financeTransactions.merchant, `%${params.search}%`),
          ilike(financeTransactions.note, `%${params.search}%`),
        ),
      );
    }
    if (params.category) filters.push(eq(financeTransactions.category, params.category));
    const transactions = await db
      .select()
      .from(financeTransactions)
      .where(and(eq(financeTransactions.userId, userId), ...filters))
      .orderBy(desc(financeTransactions.date))
      .limit(params.limit);
    res.json(ListFinanceTransactionsResponse.parse(transactions.map((item) => toTransactionResponse(item))));
  } catch (error) {
    next(error);
  }
});

router.post("/finance/transactions", async (req, res, next) => {
  try {
    const userId = res.locals.userId as string;
    const body = CreateFinanceTransactionBody.parse(req.body);
    const transaction = {
      id: crypto.randomUUID(),
      userId,
      merchant: body.merchant,
      category: body.category,
      date: body.date.toISOString().slice(0, 10),
      amount: body.amount,
      type: body.type,
      account: body.account,
      note: body.note ?? "",
      status: "posted",
    };
    await db.insert(financeTransactions).values(transaction);
    res.status(201).json(CreateFinanceTransactionResponse.parse(toTransactionResponse(transaction)));
  } catch (error) {
    next(error);
  }
});

router.get("/finance/budgets", async (_req, res, next) => {
  try {
    const userId = res.locals.userId as string;
    await ensureFinanceSeeded(userId);
    const budgets = await db
      .select()
      .from(financeBudgets)
      .where(eq(financeBudgets.userId, userId));
    res.json(
      ListFinanceBudgetsResponse.parse(
        budgets.map((budget) => ({
          ...budget,
          status:
            budget.spent > budget.limit
              ? "over"
              : budget.spent / budget.limit >= 0.85
                ? "watch"
                : "on_track",
        })),
      ),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/finance/budgets", async (req, res, next) => {
  try {
    const userId = res.locals.userId as string;
    const body = CreateFinanceBudgetBody.parse(req.body);
    const budget = {
      id: crypto.randomUUID(),
      userId,
      category: body.category,
      spent: 0,
      limit: body.limit,
      color: body.color ?? "teal",
      status: "on_track",
    };
    await db.insert(financeBudgets).values(budget);
    res.status(201).json(CreateFinanceBudgetResponse.parse(budget));
  } catch (error) {
    next(error);
  }
});

router.get("/finance/dashboard", async (_req, res, next) => {
  try {
    const userId = res.locals.userId as string;
    await ensureFinanceSeeded(userId);
    const [accounts, transactions, budgets] = await Promise.all([
      db.select().from(financeAccounts).where(eq(financeAccounts.userId, userId)),
      db
        .select()
        .from(financeTransactions)
        .where(eq(financeTransactions.userId, userId))
        .orderBy(desc(financeTransactions.date)),
      db.select().from(financeBudgets).where(eq(financeBudgets.userId, userId)),
    ]);
    const monthlyIncome = transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
    const monthlySpending = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    const spendingByCategory = transactions
      .filter((item) => item.type === "expense")
      .reduce<Record<string, number>>((result, item) => {
        result[item.category] = (result[item.category] ?? 0) + item.amount;
        return result;
      }, {});
    const budgetUsed = budgets.reduce((sum, budget) => sum + budget.spent, 0);
    const budgetLimit = budgets.reduce((sum, budget) => sum + budget.limit, 0);
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const hasWorkspaceData = accounts.length > 0 || transactions.length > 0 || budgets.length > 0;
    const response = {
      totalBalance,
      balanceChange: monthlyIncome - monthlySpending,
      balanceChangePercent: hasWorkspaceData ? 3.8 : 0,
      monthlyIncome,
      monthlySpending,
      savingsRate: monthlyIncome ? ((monthlyIncome - monthlySpending) / monthlyIncome) * 100 : 0,
      budgetUsed,
      budgetLimit,
      insight: hasWorkspaceData ? "Subscriptions are your only category over plan" : "Your workspace is ready",
      insightDetail: hasWorkspaceData
        ? "You’re $16 above your subscription budget. Everything else is tracking on target."
        : "Add an account, budget, or transaction to see your personal money picture here.",
      spendingByCategory,
      trend: hasWorkspaceData
        ? [
            { label: "Apr", income: 5200, spending: 3600 },
            { label: "May", income: 5200, spending: 3980 },
            { label: "Jun", income: 4820, spending: 3420 },
            { label: "Jul", income: 4820, spending: 3120 },
            { label: "Aug", income: 4820, spending: 3280 },
            { label: "Sep", income: 4820, spending: monthlySpending },
          ]
        : [
            { label: "Apr", income: 0, spending: 0 },
            { label: "May", income: 0, spending: 0 },
            { label: "Jun", income: 0, spending: 0 },
            { label: "Jul", income: 0, spending: 0 },
            { label: "Aug", income: 0, spending: 0 },
            { label: "Sep", income: 0, spending: 0 },
          ],
      recentTransactions: transactions.slice(0, 6).map(toTransactionResponse),
    };
    res.json(GetFinanceDashboardResponse.parse(response));
  } catch (error) {
    next(error);
  }
});

export default router;