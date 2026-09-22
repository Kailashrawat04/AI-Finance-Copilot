import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ClerkProvider,
  RedirectToSignIn,
  SignIn,
  SignUp,
  useAuth,
} from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  AccountsPage,
  AssistantPage,
  BudgetsPage,
  DashboardPage,
  SettingsPage,
  TransactionsPage,
} from '@/pages/finance-pages';
import NotFound from '@/pages/not-found';
import {
  Link,
  Redirect,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

function stripBase(path: string) {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#d9ad45',
    colorForeground: '#1f3c36',
    colorMutedForeground: '#6b7770',
    colorDanger: '#b94b43',
    colorBackground: '#fbf8f1',
    colorInput: '#ffffff',
    colorInputForeground: '#1f3c36',
    colorNeutral: '#d8d6ce',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.9rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fbf8f1] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#dedbd1]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#1f3c36] font-semibold',
    headerSubtitle: 'text-[#6b7770]',
    socialButtonsBlockButtonText: 'text-[#1f3c36] font-medium',
    formFieldLabel: 'text-[#1f3c36] font-medium',
    footerActionLink: 'text-[#1f3c36] font-semibold',
    footerActionText: 'text-[#6b7770]',
    dividerText: 'text-[#6b7770]',
    identityPreviewEditButton: 'text-[#1f3c36]',
    formFieldSuccessText: 'text-[#1d7f6b]',
    alertText: 'text-[#1f3c36]',
    logoBox: 'rounded-xl',
    logoImage: 'rounded-xl',
    socialButtonsBlockButton: 'border-[#dedbd1] bg-white hover:bg-[#f2efe7]',
    formButtonPrimary: 'bg-[#1f3c36] text-white hover:bg-[#285247]',
    formFieldInput: 'border-[#d8d6ce] bg-white text-[#1f3c36]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#dedbd1]',
    alert: 'border-[#e7c8a0] bg-[#fff6e6]',
    otpCodeFieldInput: 'border-[#d8d6ce] bg-white text-[#1f3c36]',
    formFieldRow: 'gap-2',
    main: 'bg-transparent',
  },
};

function AuthLoading() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <div className="h-2 w-16 animate-pulse rounded-full bg-primary/40" />
    </div>
  );
}

function LandingPage() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-6 sm:px-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" data-testid="link-public-brand">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              FC
            </span>
            <span className="font-semibold tracking-tight">
              Finance <span className="font-serif italic text-primary">Copilot</span>
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/sign-in" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground" data-testid="link-public-sign-in">
              Sign in
            </Link>
            <Link href="/sign-up" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5" data-testid="link-public-sign-up">
              Create account
            </Link>
          </nav>
        </header>

        <section className="grid items-center gap-14 pb-20 pt-24 lg:grid-cols-[1.05fr_.95fr] lg:pb-28 lg:pt-32">
          <div className="animate-rise">
            <p className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-primary/80">
              A calmer way to know your money
            </p>
            <h1 className="max-w-3xl font-serif text-[clamp(3.4rem,8vw,6.8rem)] leading-[.9] tracking-[-0.065em]">
              A clearer view of your money.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Finance Copilot brings your accounts, spending, budgets, and thoughtful answers into one private workspace built for everyday decisions.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5" data-testid="button-public-get-started">
                Get started
              </Link>
              <Link href="/sign-in" className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary" data-testid="button-public-sign-in">
                Sign in to your workspace
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span>Private by default</span>
              <span>Grounded answers</span>
              <span>No financial advice theater</span>
            </div>
          </div>

          <div className="relative animate-rise stagger-2">
            <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full border-[24px] border-accent/20" />
            <div className="relative rounded-[2rem] border border-border bg-card p-5 shadow-[0_24px_80px_hsl(var(--primary)/.12)] sm:p-7">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div>
                  <p className="text-xs text-muted-foreground">Your snapshot</p>
                  <p className="mt-1 text-sm font-semibold">September overview</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1.5 text-[10px] font-semibold text-primary">Up to date</span>
              </div>
              <div className="grid gap-3 py-6 sm:grid-cols-2">
                <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
                  <p className="text-xs text-primary-foreground/65">Total balance</p>
                  <p className="mt-5 font-serif text-3xl tracking-tight">$39,279</p>
                  <p className="mt-2 text-xs text-primary-foreground/65">+3.8% this month</p>
                </div>
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="text-xs text-muted-foreground">Savings rate</p>
                  <p className="mt-5 font-serif text-3xl tracking-tight text-primary">91.6%</p>
                  <p className="mt-2 text-xs text-muted-foreground">A useful signal, not a score</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">A useful pattern</p>
                  <span className="text-xs text-primary">Copilot</span>
                </div>
                <p className="mt-3 font-serif text-xl leading-tight">Subscriptions are your only category over plan.</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">See what moved without having to hunt through a spreadsheet.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div className="border-t border-border bg-secondary/45">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 text-sm text-muted-foreground sm:grid-cols-3 sm:px-10">
          <div><p className="font-semibold text-foreground">See the whole picture</p><p className="mt-2 leading-6">Balances, budgets, and spending context in one place.</p></div>
          <div><p className="font-semibold text-foreground">Ask better questions</p><p className="mt-2 leading-6">Get grounded explanations from the data you choose to connect.</p></div>
          <div><p className="font-semibold text-foreground">Stay in control</p><p className="mt-2 leading-6">Your workspace is yours, with clear boundaries around what Copilot can do.</p></div>
        </div>
      </div>
    </main>
  );
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <AuthLoading />;
  return isSignedIn ? <Redirect to="/app" /> : <LandingPage />;
}

function ProtectedPage({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <AuthLoading />;
  if (!isSignedIn) return <RedirectToSignIn />;
  return <>{children}</>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/app">
          <ProtectedPage><DashboardPage /></ProtectedPage>
        </Route>
        <Route path="/transactions">
          <ProtectedPage><TransactionsPage /></ProtectedPage>
        </Route>
        <Route path="/budgets">
          <ProtectedPage><BudgetsPage /></ProtectedPage>
        </Route>
        <Route path="/accounts">
          <ProtectedPage><AccountsPage /></ProtectedPage>
        </Route>
        <Route path="/assistant">
          <ProtectedPage><AssistantPage /></ProtectedPage>
        </Route>
        <Route path="/settings">
          <ProtectedPage><SettingsPage /></ProtectedPage>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to access your workspace' } },
        signUp: { start: { title: 'Create your account', subtitle: 'Start your clearer money routine' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;