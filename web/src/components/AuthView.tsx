import { FormEvent, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Lock,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { CustomerUser } from '../data/cinemaData';

export interface AuthViewProps {
  currentUser: CustomerUser | null;
  onLogin: (user: CustomerUser) => void;
  onLogout: () => void;
  onBack: () => void;
  onGoToOrders: () => void;
  onToggleMarketingOptIn?: (next: boolean) => void;
}

const LGPD_NOTICE_VERSION = 'v2.1 · Vigência a partir de 14/12/2026';

function LgpdFullNoticeCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-black/35 text-xs text-[var(--text-secondary)] ${
        compact ? 'p-3.5' : 'p-4 sm:p-5'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-white">
          <FileText className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
          Aviso Completo de Privacidade (LGPD · RF-17)
        </span>
        <span className="font-mono-tabular text-[11px] text-[var(--amber-progress)]">
          {LGPD_NOTICE_VERSION}
        </span>
      </div>

      <dl className="mt-3 space-y-2 text-[11px] leading-relaxed">
        <div>
          <dt className="inline font-bold text-white">Controlador: </dt>
          <dd className="inline">CineFood Entretenimento S.A. (CNPJ 00.000.000/0001-00).</dd>
        </div>
        <div>
          <dt className="inline font-bold text-white">Base Legal Principal: </dt>
          <dd className="inline">
            Execução contratual (Art. 7º, V da LGPD) para emissão de ingressos QR individuais, validação documental de meia-entrada na portaria e entrega da cantina no assento ou balcão.
          </dd>
        </div>
        <div>
          <dt className="inline font-bold text-white">Marketing Opcional: </dt>
          <dd className="inline">
            Consentimento explícito e opcional (Art. 7º, I), livremente revogável a qualquer momento na sua conta sem prejuízo à compra.
          </dd>
        </div>
        <div>
          <dt className="inline font-bold text-white">Compartilhamento com Terceiros: </dt>
          <dd className="inline">
            Gateway de pagamento (Pix e cartão tokenizado, sem armazenamento de CVV/número completo) e operação interna de portaria/bomboniere.
          </dd>
        </div>
        <div>
          <dt className="inline font-bold text-white">Prazo de Retenção: </dt>
          <dd className="inline">
            Dados cadastrais mantidos enquanto a conta estiver ativa; registros fiscais e financeiros conservados por 5 anos por obrigação legal (CTN Art. 173).
          </dd>
        </div>
        <div>
          <dt className="inline font-bold text-white">Contato do Encarregado (DPO): </dt>
          <dd className="inline font-mono-tabular text-white">dpo@cinefood.app</dd>
        </div>
      </dl>
    </div>
  );
}

export function AuthView({
  currentUser,
  onLogin,
  onLogout,
  onBack,
  onGoToOrders,
  onToggleMarketingOptIn,
}: AuthViewProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);

  // Sign-in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginEmailErr, setLoginEmailErr] = useState(false);
  const [loginPassErr, setLoginPassErr] = useState(false);

  // Sign-up state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [lgpdRequired, setLgpdRequired] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [nameErr, setNameErr] = useState(false);
  const [signupEmailErr, setSignupEmailErr] = useState(false);
  const [signupPassErr, setSignupPassErr] = useState(false);
  const [lgpdNoticeErr, setLgpdNoticeErr] = useState(false);

  const [marketingUpdatedAt, setMarketingUpdatedAt] = useState<string | null>(null);

  const formatNowPtBr = () => new Date().toLocaleString('pt-BR');

  const handleSignInSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      const emailEl = form.elements.namedItem('login-email') as HTMLInputElement | null;
      const passEl = form.elements.namedItem('login-password') as HTMLInputElement | null;
      setLoginEmailErr(Boolean(emailEl && !emailEl.validity.valid));
      setLoginPassErr(Boolean(passEl && !passEl.validity.valid));
      return;
    }

    onLogin({
      id: 'usr-signed-in',
      name: loginEmail.split('@')[0].replace('.', ' ') || 'Cliente CineFood',
      email: loginEmail.trim(),
      lgpdAcceptedAt: formatNowPtBr(),
      marketingOptIn: false,
    });
    onGoToOrders();
  };

  const handleSignUpSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity() || !lgpdRequired) {
      const nameEl = form.elements.namedItem('full-name') as HTMLInputElement | null;
      const emailEl = form.elements.namedItem('signup-email') as HTMLInputElement | null;
      const passEl = form.elements.namedItem('new-password') as HTMLInputElement | null;
      setNameErr(Boolean(nameEl && !nameEl.validity.valid));
      setSignupEmailErr(Boolean(emailEl && !emailEl.validity.valid));
      setSignupPassErr(Boolean(passEl && !passEl.validity.valid));
      setLgpdNoticeErr(!lgpdRequired);
      return;
    }

    onLogin({
      id: `usr-${Date.now()}`,
      name: fullName.trim(),
      email: signupEmail.trim(),
      lgpdAcceptedAt: formatNowPtBr(),
      marketingOptIn,
    });
    onGoToOrders();
  };

  const handleToggleMarketing = () => {
    if (!currentUser) return;
    const next = !currentUser.marketingOptIn;
    setMarketingUpdatedAt(formatNowPtBr());
    if (onToggleMarketingOptIn) {
      onToggleMarketingOptIn(next);
    } else {
      onLogin({ ...currentUser, marketingOptIn: next });
    }
  };

  return (
    <section className="mx-auto max-w-[960px] px-4 py-10 sm:px-8" aria-label="Autenticação e Privacidade">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Voltar ao Cartaz</span>
      </button>

      {currentUser ? (
        <div className="mt-8 space-y-6 rounded-2xl border border-white/15 bg-[var(--bg-elevated)] p-6 shadow-2xl sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex items-start gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--success-emerald)]/15 text-[var(--success-emerald)]">
                <UserCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--success-emerald)]">
                  Sessão Autenticada
                </p>
                <h1 className="font-display mt-1 text-3xl font-extrabold uppercase text-white sm:text-4xl">
                  {currentUser.name}
                </h1>
                <p className="break-all text-sm text-[var(--text-secondary)]">{currentUser.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:border-white/40 hover:text-white"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Encerrar Sessão</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs">
              <p className="font-bold uppercase tracking-wider text-white">Termo LGPD (RF-17)</p>
              <p className="mt-1 text-[var(--text-secondary)]">
                Ciência contratual (Art. 7º, V) registrada em{' '}
                <strong className="font-mono-tabular text-white">{currentUser.lgpdAcceptedAt}</strong>.
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">{LGPD_NOTICE_VERSION}</p>
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-4 text-xs">
              <div>
                <p className="font-bold uppercase tracking-wider text-white">Comunicações Promocionais</p>
                <p className="mt-1 text-[var(--text-secondary)]">
                  Consentimento opcional (Art. 7º, I):{' '}
                  <strong className="text-white">
                    {currentUser.marketingOptIn ? 'Ativado' : 'Desativado'}
                  </strong>
                </p>
                {marketingUpdatedAt && (
                  <p className="mt-1 text-[11px] text-[#6EE7B7]">
                    Atualizado em <span className="font-mono-tabular">{marketingUpdatedAt}</span>
                  </p>
                )}
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={currentUser.marketingOptIn}
                onClick={handleToggleMarketing}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  currentUser.marketingOptIn
                    ? 'border-rose-400/50 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25'
                    : 'border-[var(--success-emerald)]/50 bg-[var(--success-emerald)]/15 text-[#6EE7B7] hover:bg-[var(--success-emerald)]/25'
                }`}
              >
                {currentUser.marketingOptIn
                  ? 'Revogar Consentimento de Marketing'
                  : 'Conceder Consentimento de Marketing'}
              </button>
            </div>
          </div>

          <LgpdFullNoticeCard />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onGoToOrders}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)]"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>Abrir Meus Ingressos &amp; LGPD</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-white/15 bg-[var(--bg-elevated)] p-6 shadow-2xl sm:p-8">
            <div
              role="tablist"
              aria-label="Tipo de acesso"
              className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/40 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => setMode('signin')}
                className={`min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  mode === 'signin'
                    ? 'bg-white text-[#0D0E12]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => setMode('signup')}
                className={`min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  mode === 'signup'
                    ? 'bg-white text-[#0D0E12]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Criar Conta (LGPD)
              </button>
            </div>

            {mode === 'signin' ? (
              <form noValidate onSubmit={handleSignInSubmit} className="mt-6 space-y-5">
                <div>
                  <h1 className="font-display text-3xl font-extrabold uppercase text-white">
                    Acesse sua Conta
                  </h1>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Consulte seus ingressos privados, avalie sessões encerradas e gerencie solicitações LGPD.
                  </p>
                </div>

                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-white">
                    E-mail cadastrado
                  </label>
                  <span id="login-email-hint" className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                    Formato: voce@exemplo.com
                  </span>
                  <input
                    id="login-email"
                    name="login-email"
                    type="email"
                    required
                    spellCheck={false}
                    autoComplete="username"
                    enterKeyHint="next"
                    value={loginEmail}
                    aria-invalid={loginEmailErr}
                    aria-describedby={loginEmailErr ? 'login-email-hint login-email-err' : 'login-email-hint'}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (loginEmailErr && e.currentTarget.validity.valid) setLoginEmailErr(false);
                    }}
                    onBlur={(e) => setLoginEmailErr(!e.currentTarget.validity.valid)}
                    className="cine-input mt-1.5 min-h-[44px] w-full rounded-lg border border-white/15 bg-black/45 px-3.5 py-2.5 text-base text-white placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)] sm:text-sm"
                  />
                  <p id="login-email-err" className="cine-error-msg mt-1 items-center gap-1.5 text-xs text-[#FCA5A5]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Informe um e-mail válido no formato voce@exemplo.com.</span>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-xs font-semibold text-white">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-pressed={showPassword}
                      className="inline-flex min-h-[44px] items-center gap-1 px-1 text-[11px] font-semibold text-[var(--amber-progress)] hover:underline"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      <span>{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>
                    </button>
                  </div>
                  <span id="login-pass-hint" className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                    Mínimo de 8 caracteres
                  </span>
                  <input
                    id="login-password"
                    name="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="current-password"
                    enterKeyHint="done"
                    value={loginPassword}
                    aria-invalid={loginPassErr}
                    aria-describedby={loginPassErr ? 'login-pass-hint login-pass-err' : 'login-pass-hint'}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginPassErr && e.currentTarget.validity.valid) setLoginPassErr(false);
                    }}
                    onBlur={(e) => setLoginPassErr(!e.currentTarget.validity.valid)}
                    className="cine-input mt-1.5 min-h-[44px] w-full rounded-lg border border-white/15 bg-black/45 px-3.5 py-2.5 text-base text-white focus:border-[var(--focus-ring)] sm:text-sm"
                  />
                  <p id="login-pass-err" className="cine-error-msg mt-1 items-center gap-1.5 text-xs text-[#FCA5A5]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>A senha deve conter ao menos 8 caracteres.</span>
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                  <button
                    type="submit"
                    className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)]"
                  >
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    <span>Entrar na Conta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLogin({
                        id: 'usr-joana',
                        name: 'Joana Silva',
                        email: 'joana.silva@cinefood.app',
                        lgpdAcceptedAt: formatNowPtBr(),
                        marketingOptIn: false,
                      });
                      onGoToOrders();
                    }}
                    className="inline-flex min-h-[46px] items-center justify-center rounded-lg border border-white/20 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    Acesso Rápido Demo (Joana)
                  </button>
                </div>
              </form>
            ) : (
              <form noValidate onSubmit={handleSignUpSubmit} className="mt-6 space-y-5">
                <div>
                  <h1 className="font-display text-3xl font-extrabold uppercase text-white">
                    Criar Conta CineFood
                  </h1>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Cadastro com transparência LGPD completa antes da criação da conta.
                  </p>
                </div>

                <div>
                  <label htmlFor="full-name" className="block text-xs font-semibold text-white">
                    Nome completo
                  </label>
                  <span id="full-name-hint" className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                    Nome utilizado na validação de portaria e meia-entrada
                  </span>
                  <input
                    id="full-name"
                    name="full-name"
                    type="text"
                    required
                    minLength={2}
                    autoComplete="name"
                    enterKeyHint="next"
                    value={fullName}
                    aria-invalid={nameErr}
                    aria-describedby={nameErr ? 'full-name-hint full-name-err' : 'full-name-hint'}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (nameErr && e.currentTarget.validity.valid) setNameErr(false);
                    }}
                    onBlur={(e) => setNameErr(!e.currentTarget.validity.valid)}
                    className="cine-input mt-1.5 min-h-[44px] w-full rounded-lg border border-white/15 bg-black/45 px-3.5 py-2.5 text-base text-white focus:border-[var(--focus-ring)] sm:text-sm"
                  />
                  <p id="full-name-err" className="cine-error-msg mt-1 items-center gap-1.5 text-xs text-[#FCA5A5]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Informe seu nome completo (mínimo 2 caracteres).</span>
                  </p>
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-xs font-semibold text-white">
                    E-mail
                  </label>
                  <span id="signup-email-hint" className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                    Formato: voce@exemplo.com
                  </span>
                  <input
                    id="signup-email"
                    name="signup-email"
                    type="email"
                    required
                    spellCheck={false}
                    autoComplete="username"
                    enterKeyHint="next"
                    value={signupEmail}
                    aria-invalid={signupEmailErr}
                    aria-describedby={
                      signupEmailErr ? 'signup-email-hint signup-email-err' : 'signup-email-hint'
                    }
                    onChange={(e) => {
                      setSignupEmail(e.target.value);
                      if (signupEmailErr && e.currentTarget.validity.valid) setSignupEmailErr(false);
                    }}
                    onBlur={(e) => setSignupEmailErr(!e.currentTarget.validity.valid)}
                    className="cine-input mt-1.5 min-h-[44px] w-full rounded-lg border border-white/15 bg-black/45 px-3.5 py-2.5 text-base text-white focus:border-[var(--focus-ring)] sm:text-sm"
                  />
                  <p id="signup-email-err" className="cine-error-msg mt-1 items-center gap-1.5 text-xs text-[#FCA5A5]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Digite um e-mail válido no formato voce@exemplo.com.</span>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="new-password" className="block text-xs font-semibold text-white">
                      Criar senha segura
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-pressed={showPassword}
                      className="inline-flex min-h-[44px] items-center gap-1 px-1 text-[11px] font-semibold text-[var(--amber-progress)] hover:underline"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      <span>{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>
                    </button>
                  </div>
                  <ul
                    id="password-rules"
                    className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-[var(--text-muted)]"
                  >
                    <li>• Mínimo 8 caracteres</li>
                    <li>• Letra maiúscula e minúscula</li>
                    <li>• Pelo menos 1 número</li>
                  </ul>
                  <input
                    id="new-password"
                    name="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                    autoComplete="new-password"
                    enterKeyHint="done"
                    value={signupPassword}
                    aria-invalid={signupPassErr}
                    aria-describedby={
                      signupPassErr ? 'password-rules new-password-err' : 'password-rules'
                    }
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                      if (signupPassErr && e.currentTarget.validity.valid) setSignupPassErr(false);
                    }}
                    onBlur={(e) => setSignupPassErr(!e.currentTarget.validity.valid)}
                    className="cine-input mt-1.5 min-h-[44px] w-full rounded-lg border border-white/15 bg-black/45 px-3.5 py-2.5 text-base text-white focus:border-[var(--focus-ring)] sm:text-sm"
                  />
                  <p id="new-password-err" className="cine-error-msg mt-1 items-center gap-1.5 text-xs text-[#FCA5A5]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>A senha precisa ter 8+ caracteres com maiúscula, minúscula e número.</span>
                  </p>
                </div>

                {/* Full LGPD Notice & Separate Contractual Acknowledgment vs Optional Marketing Consent */}
                <div className="space-y-3 text-xs">
                  <LgpdFullNoticeCard compact />

                  <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 bg-black/25 p-3 text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={lgpdRequired}
                      onChange={(e) => {
                        setLgpdRequired(e.target.checked);
                        if (e.target.checked) setLgpdNoticeErr(false);
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-red)]"
                    />
                    <span>
                      <strong className="text-white">(Ciência Contratual)</strong> Li o Aviso de Privacidade LGPD e estou ciente do tratamento dos meus dados sob execução contratual (Art. 7º, V).
                    </span>
                  </label>

                  {lgpdNoticeErr && (
                    <p role="alert" className="flex items-center gap-1.5 text-xs text-[#FCA5A5]">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>Confirme a ciência do Aviso de Privacidade para criar sua conta.</span>
                    </p>
                  )}

                  <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 bg-black/25 p-3 text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-red)]"
                    />
                    <span>
                      <strong className="text-white">(Opcional)</strong> Autorizo o envio de pré-vendas e promoções por e-mail (pode ser revogado a qualquer momento).
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)]"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>Criar Conta &amp; Registrar Ciência LGPD</span>
                </button>
              </form>
            )}
          </div>

          <aside className="flex flex-col justify-between gap-5 rounded-2xl border border-white/10 bg-[var(--bg-elevated)] p-6 text-xs text-[var(--text-secondary)]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#FCD34D]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Privacidade &amp; Segurança (RF-01 / RF-17)
              </div>
              <h2 className="font-display text-2xl font-bold uppercase text-white">
                Por que criar sua conta?
              </h2>
              <ul className="space-y-2.5 leading-relaxed">
                <li>• Histórico privado de ingressos QR individuais e status da cantina em tempo real.</li>
                <li>• Cancelamento self-service conforme CDC (até 7 dias da compra e 2h antes da sessão).</li>
                <li>• Avaliação pós-sessão com edição e exclusão após o check-in na portaria.</li>
                <li>• Autoatendimento de direitos LGPD com protocolo rastreável.</li>
              </ul>

              <LgpdFullNoticeCard compact />
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 text-[11px]">
              Protótipo frontend: credenciais são validadas localmente no navegador sem envio a servidor externo.
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
