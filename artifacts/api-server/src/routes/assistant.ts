import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { financeAccounts, financeBudgets, financeTransactions } from "@workspace/db";
import { SendAssistantChatBody, SendAssistantChatResponse } from "@workspace/api-zod";
import { ensureFinanceSeeded } from "./finance";

const router: IRouter = Router();

function localAssistantReply(
  message: string,
  accounts: Array<{ name: string; balance: number }>,
  budgets: Array<{ category: string; spent: number; limit: number }>,
  transactions: Array<{ merchant: string; category: string; amount: number; type: string }>,
) {
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalSpent = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const watchBudget = [...budgets].sort(
    (left, right) => right.spent / right.limit - left.spent / left.limit,
  )[0];
  const normalized = message.toLowerCase();

  if (normalized.includes("balance") || normalized.includes("account")) {
    return `Your connected accounts currently total $${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. The largest balance is in ${accounts.sort((left, right) => right.balance - left.balance)[0]?.name ?? "your accounts"}.`;
  }
  if (normalized.includes("budget") || normalized.includes("watch")) {
    return `${watchBudget?.category ?? "Your budgets"} is the category to watch first: $${watchBudget?.spent.toFixed(2) ?? "0.00"} of $${watchBudget?.limit.toFixed(2) ?? "0.00"} is already used. That is the clearest near-term signal in the current workspace.`;
  }
  if (normalized.includes("spend") || normalized.includes("spending")) {
    const category = Object.entries(
      transactions
        .filter((transaction) => transaction.type === "expense")
        .reduce<Record<string, number>>((result, transaction) => {
          result[transaction.category] = (result[transaction.category] ?? 0) + transaction.amount;
          return result;
        }, {}),
    ).sort((left, right) => right[1] - left[1])[0];
    return `I can see $${totalSpent.toFixed(2)} in the current transaction window. ${category ? `${category[0]} is the largest category at $${category[1].toFixed(2)}.` : "There is not enough activity to name a leading category yet."}`;
  }
  return `I can work from your current balance of $${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, ${budgets.length} budgets, and ${transactions.length} recent transactions. Try asking which budget to watch, what changed in spending, or for a summary of your accounts.`;
}

router.post("/assistant/chat", async (req, res, next) => {
  try {
    const userId = res.locals.userId as string;
    await ensureFinanceSeeded(userId);
    const { message, history = [] } = SendAssistantChatBody.parse(req.body);
    const [accounts, budgets, transactions] = await Promise.all([
      db.select().from(financeAccounts).where(eq(financeAccounts.userId, userId)),
      db.select().from(financeBudgets).where(eq(financeBudgets.userId, userId)),
      db.select().from(financeTransactions).where(eq(financeTransactions.userId, userId)),
    ]);

    const fallback = () =>
      res.json(
        SendAssistantChatResponse.parse({
          message: localAssistantReply(message, accounts, budgets, transactions),
          model: "Finance Copilot rules engine",
          sources: ["Your Finance Copilot account data", "Current budgets", "Recent transactions"],
        }),
      );

    if (!process.env.OPENAI_API_KEY) {
      fallback();
      return;
    }

    const financialContext = JSON.stringify({ accounts, budgets, transactions });
    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You are the Finance Copilot assistant. Use only the supplied financial context for personalized claims. Be concise, practical, and transparent about uncertainty. You can explain spending, budgets, cash flow, and habits, but do not give regulated investment, tax, or legal advice. If asked for a recommendation involving investments, clearly frame it as general education and suggest consulting a qualified professional. Never invent transactions or balances. Use short paragraphs and bullets when helpful.",
          },
          {
            role: "system",
            content: `Current financial context (demo account): ${financialContext}`,
          },
          ...history.slice(-8).map((item) => ({
            role: item.role,
            content: item.content,
          })),
          { role: "user", content: message },
        ],
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      req.log.warn({ status: openAiResponse.status, errorText }, "OpenAI request failed");
      fallback();
      return;
    }

    const payload = (await openAiResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const assistantMessage =
      payload.choices?.[0]?.message?.content?.trim() ||
      "I couldn’t find a clear answer from the available financial data.";
    res.json(
      SendAssistantChatResponse.parse({
        message: assistantMessage,
        model: "gpt-4.1-mini",
        sources: ["Your Finance Copilot account data", "Current budgets", "Recent transactions"],
      }),
    );
  } catch (error) {
    next(error);
  }
});

export default router;