import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/react';
import { Link } from 'wouter';
import {
  getGetFinanceDashboardQueryKey,
  getListFinanceAccountsQueryKey,
  getListFinanceBudgetsQueryKey,
  getListFinanceTransactionsQueryKey,
  useCreateFinanceTransaction,
  useGetFinanceDashboard,
  useListFinanceAccounts,
  useListFinanceBudgets,
  useListFinanceTransactions,
  useSendAssistantChat,
  type AssistantChatMessage,
  type FinanceTransactionInputType,
} from '@workspace/api-client-react';
import { ArrowRight, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, Filter, Info, Lightbulb, MessageSquareText, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, Target } from 'lucide-react';
import {
  AccountCard,
  AddTransactionButton,
  AppShell,
  BudgetBar,
  CloseButton,
  EmptyState,
  initials,
  Legend,
  PageIntro,
  QueryError,
  SearchField,
  SectionHeading,
  SelectChevron,
  Skeleton,
  StatCard,
  Toggle,
  TransactionRow,
  TrendChart,
  money,
} from '@/components/finance';

function QueryLoading({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-3" data-testid="loading-content">{Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div>;
}

export function DashboardPage() {
  const dashboard = useGetFinanceDashboard({ query: { queryKey: getGetFinanceDashboardQueryKey() } });
  const accounts = useListFinanceAccounts({ query: { queryKey: getListFinanceAccountsQueryKey() } });
  const budgets = useListFinanceBudgets({ query: { queryKey: getListFinanceBudgetsQueryKey() } });
  const data = dashboard.data;
  const accountData = accounts.data ?? [];
  const budgetData = budgets.data ?? [];

  return <AppShell><PageIntro eyebrow="Tuesday, October 15" title="A clearer view of your money." detail="Good morning, Alex. Here’s the short version of what moved overnight." action={<Link href="/assistant" data-testid="link-dashboard-ask-copilot" className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold transition-colors hover:border-primary/50 hover:text-primary"><Sparkles className="h-4 w-4 text-accent" /> Ask about my money</Link>} />
    {dashboard.isLoading ? <DashboardSkeleton /> : dashboard.isError || !data ? <QueryError onRetry={() => void dashboard.refetch()} /> : <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total balance" value={money(data.totalBalance)} detail={`${data.balanceChange >= 0 ? '+' : ''}${money(data.balanceChange)} · ${data.balanceChangePercent.toFixed(1)}% this month`} tone="positive" className="animate-rise stagger-1" />
        <StatCard label="Monthly income" value={money(data.monthlyIncome)} detail="Across your connected accounts" className="animate-rise stagger-2" />
        <StatCard label="Monthly spending" value={money(data.monthlySpending)} detail={`${data.savingsRate.toFixed(1)}% savings rate`} tone="accent" className="animate-rise stagger-3" />
        <StatCard label="Budget used" value={money(data.budgetUsed)} detail={`${Math.round((data.budgetUsed / data.budgetLimit) * 100)}% of ${money(data.budgetLimit)}`} className="animate-rise stagger-4" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
        <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
          <SectionHeading title="Monthly movement" detail="Income and spending over the last six months" action={<Legend items={[{ label: 'Income', color: 'hsl(var(--primary))' }, { label: 'Spending', color: 'hsl(var(--accent))' }]} />} />
          <TrendChart trend={data.trend} />
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border-[22px] border-sidebar-primary/20" />
          <div className="absolute -bottom-20 -left-8 h-36 w-36 rounded-full border-[18px] border-primary-foreground/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-medium text-primary-foreground/70"><Lightbulb className="h-4 w-4 text-sidebar-primary" /> A useful pattern</div>
            <h2 className="mt-7 max-w-sm font-serif text-2xl leading-tight tracking-[-0.03em]">{data.insight}</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-primary-foreground/70">{data.insightDetail}</p>
            <Link href="/assistant" data-testid="link-insight-assistant" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-sidebar-primary px-3.5 py-2.5 text-xs font-semibold text-sidebar-primary-foreground transition-transform hover:-translate-y-0.5">Explore with Copilot <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
          <SectionHeading title="Recent transactions" detail="Your latest account activity" action={<Link href="/transactions" data-testid="link-dashboard-transactions" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View all <ChevronRight className="h-3.5 w-3.5" /></Link>} />
          {data.recentTransactions.length ? <div>{data.recentTransactions.slice(0, 5).map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} compact />)}</div> : <EmptyState icon={CircleDollarSign} title="No recent activity" detail="New account activity will show up here as it arrives." />}
        </div>
        <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
          <SectionHeading title="Budget pulse" detail="A quick read on this month" action={<Link href="/budgets" data-testid="link-dashboard-budgets" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">See budgets <ChevronRight className="h-3.5 w-3.5" /></Link>} />
          {budgets.isLoading ? <QueryLoading rows={3} /> : budgets.isError ? <QueryError onRetry={() => void budgets.refetch()} /> : budgetData.length ? <div className="space-y-5">{budgetData.slice(0, 4).map((budget) => <BudgetBar budget={budget} key={budget.id} />)}</div> : <EmptyState icon={Target} title="No budgets yet" detail="Create a simple limit for the categories that matter most." />}
        </div>
      </section>
      <section>
        <SectionHeading title="Connected accounts" detail={`${accountData.length} accounts keeping your view current`} action={<Link href="/accounts" data-testid="link-dashboard-accounts" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Manage accounts <ChevronRight className="h-3.5 w-3.5" /></Link>} />
        {accounts.isLoading ? <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-44" /><Skeleton className="h-44" /><Skeleton className="h-44" /></div> : accounts.isError ? <QueryError onRetry={() => void accounts.refetch()} /> : <div className="grid gap-4 md:grid-cols-3">{accountData.slice(0, 3).map((account) => <AccountCard key={account.id} account={account} />)}</div>}
      </section>
    </div>}
  </AppShell>;
}

function DashboardSkeleton() {
  return <div className="space-y-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div><div className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]"><Skeleton className="h-72" /><Skeleton className="h-72" /></div></div>;
}

function TransactionDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const accounts = useListFinanceAccounts({ query: { queryKey: getListFinanceAccountsQueryKey() } });
  const create = useCreateFinanceTransaction();
  const [form, setForm] = useState({ merchant: '', category: 'Food & dining', date: new Date().toISOString().slice(0, 10), amount: '', type: 'expense' as FinanceTransactionInputType, account: '', note: '' });
  const [formError, setFormError] = useState('');
  const accountData = accounts.data ?? [];
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.merchant.trim() || !form.amount || !form.account) { setFormError('Add a merchant, amount, and account to continue.'); return; }
    setFormError('');
    create.mutate({ data: { merchant: form.merchant.trim(), category: form.category, date: form.date, amount: Number(form.amount), type: form.type, account: form.account, note: form.note.trim() || undefined } }, {
      onSuccess: () => { void queryClient.invalidateQueries({ queryKey: getListFinanceTransactionsQueryKey() }); void queryClient.invalidateQueries({ queryKey: getGetFinanceDashboardQueryKey() }); onClose(); },
      onError: () => setFormError('The transaction could not be saved. Please try again.'),
    });
  };
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/30 p-0 sm:items-center sm:p-6"><div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-2xl sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="add-transaction-title"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/70">Ledger entry</p><h2 id="add-transaction-title" className="mt-2 font-serif text-2xl tracking-[-0.03em]">Add a transaction</h2><p className="mt-1 text-xs text-muted-foreground">Keep your money story complete.</p></div><CloseButton onClick={onClose} /></div><form className="mt-6 space-y-4" onSubmit={submit}><div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1"><button type="button" data-testid="button-transaction-expense" onClick={() => setForm((current) => ({ ...current, type: 'expense' }))} className={`rounded-lg py-2 text-xs font-semibold transition-colors ${form.type === 'expense' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>Expense</button><button type="button" data-testid="button-transaction-income" onClick={() => setForm((current) => ({ ...current, type: 'income' }))} className={`rounded-lg py-2 text-xs font-semibold transition-colors ${form.type === 'income' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>Income</button></div><Field label="Merchant"><input required value={form.merchant} onChange={(event) => setForm((current) => ({ ...current, merchant: event.target.value }))} data-testid="input-transaction-merchant" placeholder="e.g. Corner market" className="form-input" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Amount"><input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} data-testid="input-transaction-amount" placeholder="0.00" className="form-input" /></Field><Field label="Date"><input required type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} data-testid="input-transaction-date" className="form-input" /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Category"><div className="relative"><select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} data-testid="select-transaction-category" className="form-input appearance-none pr-9"><option>Food & dining</option><option>Transport</option><option>Home</option><option>Shopping</option><option>Health</option><option>Salary</option><option>Other</option></select><SelectChevron /></div></Field><Field label="Account"><div className="relative"><select required value={form.account} onChange={(event) => setForm((current) => ({ ...current, account: event.target.value }))} data-testid="select-transaction-account" className="form-input appearance-none pr-9"><option value="">Choose account</option>{accountData.map((account) => <option key={account.id} value={account.name}>{account.name}</option>)}</select><SelectChevron /></div></Field></div><Field label="Note (optional)"><input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} data-testid="input-transaction-note" placeholder="What was this for?" className="form-input" /></Field>{formError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" data-testid="status-transaction-error">{formError}</p>}<button type="submit" disabled={create.isPending} data-testid="button-submit-transaction" className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{create.isPending ? 'Saving transaction…' : 'Save transaction'} {!create.isPending && <CheckCircle2 className="h-4 w-4" />}</button></form></div></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}

export function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const params = useMemo(() => ({ ...(search ? { search } : {}), ...(category ? { category } : {}), limit: 100 }), [category, search]);
  const transactions = useListFinanceTransactions(params, { query: { queryKey: getListFinanceTransactionsQueryKey(params) } });
  const categories = useMemo(() => Array.from(new Set((transactions.data ?? []).map((transaction) => transaction.category))).sort(), [transactions.data]);
  return <AppShell><PageIntro eyebrow="Your ledger" title="Every move, in one place." detail="Search, filter, and annotate the activity behind your bigger picture." action={<AddTransactionButton onClick={() => setShowDialog(true)} />} /><div className="animate-rise stagger-1 rounded-2xl border border-card-border bg-card p-4 sm:p-5"><div className="flex flex-col gap-3 lg:flex-row"><div className="flex-1"><SearchField value={search} onChange={setSearch} /></div><div className="relative lg:w-56"><Filter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select value={category} onChange={(event) => setCategory(event.target.value)} data-testid="select-filter-category" className="h-11 w-full appearance-none rounded-xl border border-input bg-card pl-10 pr-9 text-sm outline-none focus:border-primary"><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><SelectChevron /></div></div></div><div className="mt-5 rounded-2xl border border-card-border bg-card"><div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6"><div><h2 className="text-sm font-semibold">Activity</h2><p className="mt-1 text-xs text-muted-foreground">{transactions.data?.length ?? 0} transactions showing</p></div><span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex"><SlidersHorizontal className="h-3.5 w-3.5" /> Updated moments ago</span></div>{transactions.isLoading ? <div className="p-4"><QueryLoading rows={6} /></div> : transactions.isError ? <div className="p-4"><QueryError onRetry={() => void transactions.refetch()} /></div> : transactions.data?.length ? <div className="px-4 sm:px-6">{transactions.data.map((transaction) => <TransactionRow transaction={transaction} key={transaction.id} />)}</div> : <div className="p-4"><EmptyState icon={Search} title="No matching transactions" detail={search || category ? 'Try clearing a filter or searching for a different merchant.' : 'Your ledger is ready for its first entry.'} /></div>}</div>{showDialog && <TransactionDialog onClose={() => setShowDialog(false)} />}</AppShell>;
}

export function BudgetsPage() {
  const budgets = useListFinanceBudgets({ query: { queryKey: getListFinanceBudgetsQueryKey() } });
  const dashboard = useGetFinanceDashboard({ query: { queryKey: getGetFinanceDashboardQueryKey() } });
  const data = budgets.data ?? [];
  const totalSpent = data.reduce((sum, budget) => sum + budget.spent, 0);
  const totalLimit = data.reduce((sum, budget) => sum + budget.limit, 0);
  return <AppShell><PageIntro eyebrow="This month" title="Spend with a little more intention." detail="Budgets are guardrails, not judgments. Use the context to decide what deserves your attention." action={<button type="button" disabled data-testid="button-create-budget" title="Budget creation is not available in this workspace yet" className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-muted-foreground opacity-70"><Plus className="h-4 w-4" /> Create budget</button>} />{budgets.isLoading ? <DashboardSkeleton /> : budgets.isError ? <QueryError onRetry={() => void budgets.refetch()} /> : <div className="space-y-6"><div className="grid gap-4 md:grid-cols-3"><StatCard label="Total planned" value={money(totalLimit)} detail="Across active categories" /><StatCard label="Spent so far" value={money(totalSpent)} detail={`${totalLimit ? Math.round(totalSpent / totalLimit * 100) : 0}% of your plan`} tone={totalSpent > totalLimit ? 'negative' : 'positive'} /><StatCard label="Categories to watch" value={String(data.filter((budget) => budget.status !== 'on_track').length).padStart(2, '0')} detail="Worth a closer look this week" tone="accent" /></div><div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6"><SectionHeading title="Category progress" detail="Where each dollar is landing" /><div className="space-y-7">{data.length ? data.map((budget) => <BudgetBar key={budget.id} budget={budget} />) : <EmptyState icon={Target} title="Set your first budget" detail="Give your month a shape with one category limit." />}</div></div><div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6"><SectionHeading title="Spending context" detail="Compared with your recent baseline" /><div className="space-y-4">{dashboard.data?.spendingByCategory && Object.entries(dashboard.data.spendingByCategory).slice(0, 6).map(([label, value], index) => <div key={label} className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-primary">{String(index + 1).padStart(2, '0')}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3 text-xs"><span className="truncate font-medium">{label}</span><span className="font-semibold">{money(value)}</span></div><div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary/75" style={{ width: `${Math.min(100, value / Math.max(...Object.values(dashboard.data?.spendingByCategory ?? { total: 1 })) * 100)}%` }} /></div></div></div>)}{!dashboard.data && <p className="text-xs text-muted-foreground">Spending context will appear when your overview is available.</p>}<div className="mt-8 rounded-xl bg-secondary/70 p-4"><div className="flex gap-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p className="text-xs leading-5 text-muted-foreground">Copilot can help explain a category shift, but it will never decide what you should spend.</p></div></div></div></div></div></div>}</AppShell>;
}

export function AccountsPage() {
  const accounts = useListFinanceAccounts({ query: { queryKey: getListFinanceAccountsQueryKey() } });
  const data = accounts.data ?? [];
  const total = data.reduce((sum, account) => sum + account.balance, 0);
  return <AppShell><PageIntro eyebrow="Connected accounts" title="Your whole picture, together." detail="Finance Copilot reads the accounts you choose to connect. You stay in control of the view." action={<button type="button" disabled data-testid="button-connect-account" title="Account connection is not available in this workspace yet" className="flex cursor-not-allowed items-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-xs font-semibold text-muted-foreground opacity-70"><Plus className="h-4 w-4" /> Connect account</button>} />{accounts.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div> : accounts.isError ? <QueryError onRetry={() => void accounts.refetch()} /> : <div className="space-y-6"><div className="rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8"><div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end"><div><p className="text-xs text-primary-foreground/65">Combined balance</p><p className="mt-3 font-serif text-4xl tracking-[-0.04em]">{money(total)}</p></div><div className="max-w-xs text-sm leading-6 text-primary-foreground/70">Every account is represented here, so your daily view starts with the same grounded number.</div></div></div>{data.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.map((account) => <AccountCard key={account.id} account={account} />)}</div> : <EmptyState icon={CircleDollarSign} title="Connect your first account" detail="Add a checking, savings, credit, or investment account to start seeing the full picture." />}<div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">Your data, explained plainly</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Finance Copilot uses your connected account data to summarize patterns. It does not move money, make trades, or act as a financial advisor.</p></div></div></div>}</AppShell>;
}

export function AssistantPage() {
  const send = useSendAssistantChat();
  const [messages, setMessages] = useState<AssistantChatMessage[]>([{ role: 'assistant', content: 'I’m here to help you understand your money. Ask about a spending pattern, a budget, or what changed this month. I’ll stick to the data and call out what I can’t know.' }]);
  const [input, setInput] = useState('');
  const [lastMeta, setLastMeta] = useState<{ model: string; sources: string[] } | null>(null);
  const suggestions = ['What changed in my spending this month?', 'Which budget should I look at first?', 'Give me a calm summary of my accounts'];
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || send.isPending) return;
    const history = messages;
    setMessages((current) => [...current, { role: 'user', content: message }]);
    setInput('');
    send.mutate({ data: { message, history } }, { onSuccess: (response) => { setMessages((current) => [...current, { role: 'assistant', content: response.message }]); setLastMeta({ model: response.model, sources: response.sources }); }, onError: () => setMessages((current) => [...current, { role: 'assistant', content: 'I couldn’t reach the assistant just now. Your question was not saved. Please try again.' }]) });
  };
  return <AppShell><PageIntro eyebrow="Grounded guidance" title="Ask about your money." detail="A private conversation with context from your connected accounts—without the performance of certainty." /><div className="grid gap-6 xl:grid-cols-[1fr_300px]"><section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-card-border bg-card"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></div><div><p className="text-sm font-semibold">Finance Copilot</p><p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Grounded in your workspace</p></div></div><button type="button" data-testid="button-clear-chat" onClick={() => { setMessages([]); setLastMeta(null); }} className="text-xs text-muted-foreground transition-colors hover:text-foreground">Clear chat</button></div><div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">{messages.length ? messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex gap-3 animate-rise ${message.role === 'user' ? 'justify-end' : ''}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-secondary text-foreground'}`} data-testid={`message-${message.role}-${index}`}>{message.content}</div></div>) : <EmptyState icon={MessageSquareText} title="A fresh conversation" detail="Start with a question about your accounts, spending, or budgets." />}{send.isPending && <div className="flex gap-3"><div className="rounded-2xl rounded-bl-md bg-secondary px-4 py-3"><span className="inline-flex gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/50" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/70 [animation-delay:150ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" /></span></div></div>}</div><div className="border-t border-border p-4"><div className="mb-3 flex gap-2 overflow-x-auto pb-1">{suggestions.map((suggestion) => <button type="button" key={suggestion} data-testid={`button-suggestion-${suggestion.slice(0, 8).replaceAll(' ', '-').toLowerCase()}`} onClick={() => setInput(suggestion)} className="shrink-0 rounded-full border border-border px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">{suggestion}</button>)}</div><form onSubmit={submit} className="flex items-end gap-2 rounded-xl border border-input bg-background p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"><textarea value={input} onChange={(event) => setInput(event.target.value)} data-testid="input-assistant-message" rows={1} placeholder="Ask a question about your finances…" className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground/70" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><button type="submit" disabled={!input.trim() || send.isPending} data-testid="button-send-assistant" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"><ArrowRight className="h-4 w-4" /></button></form><p className="mt-2 text-center text-[10px] text-muted-foreground">Copilot is informational, not financial advice.</p></div></section><aside className="space-y-4"><div className="rounded-2xl border border-card-border bg-card p-5"><div className="flex items-center gap-2 text-xs font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Grounding & transparency</div><p className="mt-3 text-xs leading-5 text-muted-foreground">Every answer is generated from the latest finance context available to your workspace. If a conclusion is uncertain, Copilot should say so.</p>{lastMeta && <div className="mt-5 space-y-3 border-t border-border pt-4"><div><p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Model</p><p className="mt-1 text-xs font-medium">{lastMeta.model}</p></div><div><p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Sources</p><div className="mt-1 space-y-1">{lastMeta.sources.map((source) => <p key={source} className="text-xs text-muted-foreground">{source}</p>)}</div></div></div>}</div><div className="rounded-2xl border border-border bg-secondary/50 p-5"><p className="flex items-center gap-2 text-xs font-semibold"><Info className="h-4 w-4 text-primary" /> Good questions to ask</p><ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground"><li>• What changed since last month?</li><li>• Where am I spending more than usual?</li><li>• Explain this without recommending an action.</li></ul></div></aside></div></AppShell>;
}

export function SettingsPage() {
  const { user } = useUser();
  const displayName = user?.fullName || user?.username || 'Finance member';
  const email = user?.primaryEmailAddress?.emailAddress || 'Your verified email';
  const [weekly, setWeekly] = useState(() => localStorage.getItem('finance-weekly') !== 'false');
  const [alerts, setAlerts] = useState(() => localStorage.getItem('finance-alerts') !== 'false');
  const [compact, setCompact] = useState(() => localStorage.getItem('finance-compact') === 'true');
  const [profileSaved, setProfileSaved] = useState(false);
  useEffect(() => { localStorage.setItem('finance-weekly', String(weekly)); }, [weekly]);
  useEffect(() => { localStorage.setItem('finance-alerts', String(alerts)); }, [alerts]);
  useEffect(() => { localStorage.setItem('finance-compact', String(compact)); }, [compact]);
  return <AppShell><PageIntro eyebrow="Workspace preferences" title="Make it feel like yours." detail="Small choices that shape how Finance Copilot shows up in your day." /><div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]"><section className="rounded-2xl border border-card-border bg-card p-6"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/70">Profile</p><div className="mt-5 flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">{initials(displayName)}</div><div><h2 className="text-lg font-semibold">{displayName}</h2><p className="mt-1 text-xs text-muted-foreground">{email}</p></div></div><div className="mt-8 space-y-4"><Field label="Display name"><input defaultValue={displayName} data-testid="input-profile-name" className="form-input" /></Field><Field label="Time zone"><div className="relative"><select defaultValue="Pacific Time" data-testid="select-profile-timezone" className="form-input appearance-none pr-9"><option>Pacific Time</option><option>Mountain Time</option><option>Central Time</option><option>Eastern Time</option></select><SelectChevron /></div></Field><div className="flex items-center gap-3"><button type="button" data-testid="button-save-profile" onClick={() => setProfileSaved(true)} className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">Save profile</button>{profileSaved && <span className="text-xs text-primary" data-testid="status-profile-saved">Profile saved locally</span>}</div></div></section><section className="space-y-6"><div className="rounded-2xl border border-card-border bg-card p-6"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/70">Preferences</p><div className="mt-3"><Toggle checked={weekly} onChange={setWeekly} label="Weekly money note" description="A quiet Monday recap of what changed." /><Toggle checked={alerts} onChange={setAlerts} label="Budget nudges" description="A note when a category needs your attention." /><Toggle checked={compact} onChange={setCompact} label="Compact transaction rows" description="Keep more activity visible at a glance." /></div></div><div className="rounded-2xl border border-card-border bg-card p-6"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/70">Trust & privacy</p><div className="mt-4 space-y-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-sm font-medium">You are always in control</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Assistant answers use your finance context for this workspace. We never present a guess as a fact or a recommendation as advice.</p></div></div><div className="flex gap-3"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-sm font-medium">Last synced today</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Connected account freshness is shown in the overview status.</p></div></div></div></div></section></div></AppShell>;
}