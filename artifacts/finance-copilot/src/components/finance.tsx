import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import { useHealthCheck, type FinanceAccount, type FinanceBudget, type FinanceTransaction } from '@workspace/api-client-react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ReceiptText,
  Search,
  Settings,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react';

export const money = (value: number, compact = false) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value);

export const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

export const shortDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));

export const initials = (value: string) =>
  value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ReceiptText },
  { href: '/budgets', label: 'Budgets', icon: BarChart3 },
  { href: '/accounts', label: 'Accounts', icon: Landmark },
  { href: '/assistant', label: 'Assistant', icon: Bot },
];

export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <div className={`flex items-center ${small ? 'gap-2' : 'gap-2.5'}`}>
      <div className={`${small ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'} brand-mark flex items-center justify-center rounded-[11px] font-bold text-sidebar-primary-foreground shadow-sm`}>
        FC
      </div>
      {!small && <span className="font-semibold tracking-[-0.02em] text-sidebar-foreground">Finance <span className="font-serif font-medium italic text-sidebar-primary">Copilot</span></span>}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();
  const health = useHealthCheck({ query: { queryKey: ['/api/healthz'] } });
  const displayName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || 'Finance member';
  const initialsLabel = initials(displayName);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <button
        type="button"
        aria-label="Open navigation"
        data-testid="button-open-navigation"
        className="glass-control fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground shadow-sm md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>
      {mobileOpen && <button type="button" aria-label="Close navigation overlay" data-testid="button-close-navigation-overlay" className="fixed inset-0 z-40 bg-foreground/20 md:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`shell-sidebar fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${collapsed ? 'w-[78px]' : 'w-[248px]'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:block`}>
        <div className={`flex h-[76px] items-center border-b border-sidebar-border ${collapsed ? 'justify-center px-3' : 'justify-between px-5'}`}>
          <Link href="/" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring" data-testid="link-brand-home" onClick={() => setMobileOpen(false)}>
            <BrandMark small={collapsed} />
          </Link>
          {!collapsed && <button type="button" aria-label="Collapse navigation" data-testid="button-collapse-navigation" className="hidden rounded-lg p-2 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:block" onClick={() => setCollapsed(true)}><PanelLeftClose className="h-4 w-4" /></button>}
        </div>
        {collapsed && <button type="button" aria-label="Expand navigation" data-testid="button-expand-navigation" className="mx-auto mt-4 hidden rounded-lg p-2 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:block" onClick={() => setCollapsed(false)}><PanelLeftOpen className="h-4 w-4" /></button>}
        <nav className={`mt-8 space-y-1 ${collapsed ? 'px-3' : 'px-3'}`} aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link
                href={item.href}
                key={item.href}
                title={collapsed ? item.label : undefined}
                data-testid={`link-nav-${item.label.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center rounded-xl py-3 text-[13px] font-medium transition-all duration-200 ${collapsed ? 'justify-center px-2' : 'gap-3 px-3.5'} ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}
              >
                <Icon className={`h-[17px] w-[17px] shrink-0 ${active ? '' : 'transition-transform group-hover:scale-105'}`} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.label === 'Assistant' && <span className={`ml-auto h-1.5 w-1.5 rounded-full ${active ? 'bg-sidebar-primary-foreground' : 'bg-sidebar-primary'}`} />}
              </Link>
            );
          })}
        </nav>
        <div className={`mt-auto border-t border-sidebar-border p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <Link href="/settings" data-testid="link-nav-settings" title={collapsed ? 'Settings' : undefined} onClick={() => setMobileOpen(false)} className={`flex items-center rounded-xl py-3 text-[13px] font-medium text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground ${collapsed ? 'justify-center px-2' : 'gap-3 px-3.5'}`}>
            <Settings className="h-[17px] w-[17px]" />{!collapsed && <span>Settings</span>}
          </Link>
          {!collapsed && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-sidebar-accent/70 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-semibold text-sidebar-primary">{initialsLabel}</div>
              <div className="min-w-0"><p className="truncate text-xs font-semibold">{displayName}</p><p className="truncate text-[11px] text-sidebar-foreground/45">Personal workspace</p></div>
            </div>
          )}
          {!collapsed && <button type="button" onClick={() => void signOut({ redirectUrl: basePath })} data-testid="button-sign-out" className="mt-2 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-medium text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"><LogOut className="h-[17px] w-[17px]" />Sign out</button>}
        </div>
      </aside>
      <main className={`min-h-[100dvh] transition-[margin] duration-300 ${collapsed ? 'md:ml-[78px]' : 'md:ml-[248px]'}`}>
        <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-20 sm:px-8 md:px-10 md:pt-9">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
              <span className={`h-1.5 w-1.5 rounded-full ${health.isError ? 'bg-destructive' : health.isLoading ? 'bg-accent animate-pulse' : 'bg-primary'}`} />
              {health.isError ? 'Connection needs attention' : health.isLoading ? 'Checking your workspace' : 'Your workspace is up to date'}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Link href="/assistant" data-testid="link-header-assistant" className="glass-control hidden items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground sm:flex">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Ask Copilot
              </Link>
              <Link href="/settings" aria-label="Open settings" data-testid="link-header-settings" className="glass-control flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground"><Settings className="h-4 w-4" /></Link>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initialsLabel}</div>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function PageIntro({ eyebrow, title, detail, action }: { eyebrow?: string; title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="animate-rise mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-primary/70">{eyebrow}</p>}
        <h1 className="font-serif text-[clamp(2.25rem,4vw,3.5rem)] leading-[.98] tracking-[-0.045em] text-foreground">{title}</h1>
        {detail && <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{detail}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionHeading({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-sm font-semibold tracking-[-0.01em]">{title}</h2>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</div>{action}</div>;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} aria-label="Loading" data-testid="loading-skeleton" />;
}

export function QueryError({ onRetry, label = 'Something interrupted the view.' }: { onRetry?: () => void; label?: string }) {
  return <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center"><CircleHelp className="mb-3 h-6 w-6 text-destructive" /><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-xs text-muted-foreground">Your information is still safe. Try again in a moment.</p>{onRetry && <button type="button" data-testid="button-retry-query" onClick={onRetry} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">Try again</button>}</div>;
}

export function EmptyState({ icon: Icon = WalletCards, title, detail }: { icon?: LucideIcon; title: string; detail: string }) {
  return <div className="glass-panel flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="h-5 w-5" /></div><p className="text-sm font-semibold">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{detail}</p></div>;
}

export function StatCard({ label, value, detail, tone = 'default', className = '' }: { label: string; value: string; detail?: string; tone?: 'default' | 'positive' | 'negative' | 'accent'; className?: string }) {
  const toneClass = tone === 'positive' ? 'text-primary' : tone === 'negative' ? 'text-destructive' : tone === 'accent' ? 'text-accent-foreground' : 'text-foreground';
  return <div className={`glass-panel rounded-2xl border border-card-border p-5 shadow-[0_1px_0_hsl(var(--border)/.4)] transition-transform duration-300 hover:-translate-y-0.5 ${tone === 'accent' ? 'bg-accent/65' : ''} ${className}`}><p className={`text-xs font-medium ${tone === 'accent' ? 'text-foreground/70' : 'text-muted-foreground'}`}>{label}</p><p className={`mt-3 text-2xl font-semibold tracking-[-0.04em] ${toneClass}`}>{value}</p>{detail && <p className={`mt-2 text-xs ${tone === 'accent' ? 'text-foreground/65' : 'text-muted-foreground'}`}>{detail}</p>}</div>;
}

export function AccountIcon({ type }: { type: FinanceAccount['type'] }) {
  const Icon = type === 'credit' ? CreditCard : type === 'investment' ? TrendingUp : Landmark;
  return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="h-[18px] w-[18px]" /></div>;
}

export function AccountCard({ account }: { account: FinanceAccount }) {
  const positive = account.balanceChange >= 0;
  return <div className="glass-panel group rounded-2xl border border-card-border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_hsl(var(--primary)/.08)]" data-testid={`card-account-${account.id}`}><div className="flex items-start justify-between"><AccountIcon type={account.type} /><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: account.accent }} /></div><p className="mt-5 text-xs text-muted-foreground">{account.institution} · •••• {account.mask}</p><h3 className="mt-1 font-medium">{account.name}</h3><p className="mt-4 text-xl font-semibold tracking-[-0.035em]">{money(account.balance)}</p><p className={`mt-2 flex items-center gap-1 text-xs ${positive ? 'text-primary' : 'text-destructive'}`}>{positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}{positive ? '+' : ''}{money(account.balanceChange)} <span className="text-muted-foreground">{account.balanceChangeLabel}</span></p></div>;
}

export function TransactionRow({ transaction, compact = false }: { transaction: FinanceTransaction; compact?: boolean }) {
  const income = transaction.type === 'income';
  return <div className={`group flex items-center gap-3 border-b border-border/70 py-3.5 last:border-0 ${compact ? '' : 'px-4'}`} data-testid={`row-transaction-${transaction.id}`}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${income ? 'bg-primary/10 text-primary' : 'bg-secondary text-primary'}`}>{income ? <ArrowDownLeft className="h-4 w-4" /> : initials(transaction.merchant)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{transaction.merchant}</p><p className="truncate text-xs text-muted-foreground">{transaction.category} <span className="mx-1 text-border">·</span> {compact ? shortDate(transaction.date) : `${dateLabel(transaction.date)} · ${transaction.account}`}</p></div>{transaction.status === 'pending' && <span className="hidden rounded-full bg-accent/25 px-2 py-1 text-[10px] font-medium text-foreground sm:inline-flex">Pending</span>}<div className="text-right"><p className={`text-sm font-semibold ${income ? 'text-primary' : 'text-foreground'}`}>{income ? '+' : '−'}{money(transaction.amount)}</p>{!compact && <p className="text-[11px] text-muted-foreground">{transaction.note || 'No note'}</p>}</div></div>;
}

export function BudgetBar({ budget }: { budget: FinanceBudget }) {
  const percentage = Math.min(100, (budget.spent / budget.limit) * 100);
  const status = budget.status === 'over' ? 'Over budget' : budget.status === 'watch' ? 'Worth a look' : 'On track';
  return <div data-testid={`budget-${budget.id}`}><div className="mb-2 flex items-center justify-between gap-3"><div><p className="text-sm font-medium">{budget.category}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{status}</p></div><p className="text-xs font-medium">{money(budget.spent)} <span className="text-muted-foreground">/ {money(budget.limit)}</span></p></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${percentage}%`, backgroundColor: budget.color }} /></div></div>;
}

export function TrendChart({ trend }: { trend: Array<{ label: string; income: number; spending: number }> }) {
  const max = Math.max(...trend.map((point) => Math.max(point.income, point.spending)), 1);
  return <div className="flex h-48 items-end gap-2 sm:gap-4">{trend.map((point) => <div key={point.label} className="group flex h-full flex-1 flex-col justify-end gap-2"><div className="relative flex h-[calc(100%-22px)] items-end justify-center gap-1.5"><div className="w-2 rounded-t-md bg-primary/75 transition-all duration-500 group-hover:bg-primary sm:w-3" style={{ height: `${Math.max(5, point.income / max * 100)}%` }} /><div className="w-2 rounded-t-md bg-accent transition-all duration-500 group-hover:bg-accent/80 sm:w-3" style={{ height: `${Math.max(5, point.spending / max * 100)}%` }} /></div><span className="text-center text-[10px] text-muted-foreground">{point.label}</span></div>)}</div>;
}

export function Legend({ items }: { items: Array<{ label: string; color: string }> }) {
  return <div className="flex flex-wrap gap-4">{items.map((item) => <span key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>;
}

export function AddTransactionButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} data-testid="button-add-transaction" className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><Plus className="h-4 w-4" /> Add transaction</button>;
}

export function SearchField({ value, onChange, placeholder = 'Search transactions' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} data-testid="input-search-transactions" className="glass-control h-11 w-full rounded-xl border border-input pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/10" /></div>;
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return <button type="button" aria-label="Close dialog" data-testid="button-close-dialog" onClick={onClick} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>;
}

export function SelectChevron() { return <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />; }

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (value: boolean) => void; label: string; description: string }) {
  return <button type="button" role="switch" aria-checked={checked} data-testid={`toggle-${label.toLowerCase().replaceAll(' ', '-')}`} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between border-b border-border py-4 text-left last:border-0"><span><span className="block text-sm font-medium">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{description}</span></span><span className={`flex h-6 w-10 items-center rounded-full p-1 transition-colors ${checked ? 'bg-primary justify-end' : 'bg-muted justify-start'}`}><span className={`h-4 w-4 rounded-full ${checked ? 'bg-primary-foreground' : 'bg-muted-foreground/50'}`} /></span></button>;
}