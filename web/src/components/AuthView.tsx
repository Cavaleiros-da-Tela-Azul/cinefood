import { FormEvent, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Lock,
  LogOut,
  Shield,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { CustomerUser, STAFF_PROFILES, StaffRoleGroup } from '../data/cinemaData';

interface AuthViewProps {
  currentUser: CustomerUser | null;
  onLogin: (user: CustomerUser) => void;
  onLogout: () => void;
  onBack: () => void;
  onGoToOrders: () => void;
  onEnterBackstage: (role: StaffRoleGroup) => void;
}

export function AuthView({
  currentUser,
  onLogin,
  onLogout,
  onBack,
  onGoToOrders,
  onEnterBackstage,
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
  const [showLgpdFull, setShowLgpdFull] = useState(false);

  const [nameErr, setNameErr] = useState(false);
  const [signupEmailErr, setSignupEmailErr] = useState(false);
  const [signupPassErr, setSignupPassErr] = useState(false);
  const [lgpdNoticeErr, setLgpdNoticeErr] = useState(false);

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
      email: loginEmail,
      lgpdAcceptedAt: '12/11/2026 às 16:40',
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
      lgpdAcceptedAt: '12/11/2026 · consentimento registrado',
      marketingOptIn,
    });
    onGoToOrders();
  };

  return (
    <section className="mx-auto max-w-[960px] px-4 py-10 sm:px-8" aria-label="Autenticação e Privacidade">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-[40px] items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Voltar ao Cartaz</span>
      </button>

      {currentUser ? (
        <div className="mt-8 rounded-2xl border border-white/15 bg-[var(--bg-elevated)] p-6 shadow-2xl sm:p-8">
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
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:border-white/40 hover:text-white"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Encerrar Sessão</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs">
              <p className="font-bold uppercase tracking-wider text-white">Termo LGPD (RF-17)</p>
              <p className="mt-1 text-[var(--text-secondary)]">
                Ciência e base contratual registradas em <strong className="text-white">{currentUser.lgpdAcceptedAt}</strong>.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs">
              <p className="font-bold uppercase tracking-wider text-white">Comunicações Promocionais</p>
              <p className="mt-1 text-[var(--text-secondary)]">
                Opt-in opcional:{' '}
                <strong className="text-white">{currentUser.marketingOptIn ? 'Ativado' : 'Desativado'}</strong>.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
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
                className={`min-h-[42px] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
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
                className={`min-h-[42px] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
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
                    className="cine-input mt-1.5 w-full rounded-lg border border-white/15 bg-black/45 px-3.5 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)] focus:outline-none"
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
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--amber-progress)] hover:underline"
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
                    className="cine-input mt-1.5 w-full rounded-lg border border-white/15 bg-black/45 px-3.5 py-2.5 text-sm text-white focus:border-[var(--focus-ring)] focus:outline-none"
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
                        id: 'usr-joana-01',
                        name: 'Joana Silva',
                        email: 'joana.silva@cinefood.app',
                        lgpdAcceptedAt: '12/11/2026 às 14:20',
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
                    Cadastro com transparência LGPD e consentimento explícito para emissão de bilhetes.
                  </p>
                </div>

                <div>
                  <label htmlFor="full-name" className="block text-xs font-semibold text-white">
                    Nome completo
                  </label>
                  <span id="full-name-hint" className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                    Nome único utilizado na validação de portaria e meia-entrada
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
                    className="cine-input mt-1.5 w-full rounded-lg border border-white/15 bg-black/45 px-3.5 py-2.5 text-sm text-white focus:border-[var(--focus-ring)] focus:outline-none"
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
                    className="cine-input mt-1.5 w-full rounded-lg border border-white/15 bg-black/45 px-3.5 py-2.5 text-sm text-white focus:border-[var(--focus-ring)] focus:outline-none"
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
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--amber-progress)] hover:underline"
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
                    className="cine-input mt-1.5 w-full rounded-lg border border-white/15 bg-black/45 px-3.5 py-2.5 text-sm text-white focus:border-[var(--focus-ring)] focus:outline-none"
                  />
                  <p id="new-password-err" className="cine-error-msg mt-1 items-center gap-1.5 text-xs text-[#FCA5A5]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>A senha precisa ter 8+ caracteres com maiúscula, minúscula e número.</span>
                  </p>
                </div>

                {/* Mandatory LGPD Terms Consent (RF-17) */}
                <div className="space-y-3 rounded-xl border border-white/10 bg-black/35 p-4 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-white">
                      <FileText className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
                      Termo de Privacidade LGPD (RF-17)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowLgpdFull((v) => !v)}
                      className="text-[11px] font-semibold text-[var(--amber-progress)] hover:underline"
                    >
                      {showLgpdFull ? 'Recolher detalhes' : 'Ler política resumida'}
                    </button>
                  </div>

                  {showLgpdFull && (
                    <p className="rounded-lg border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                      Tratamos nome e e-mail sob execução contratual (Art. 7º, V da LGPD) exclusivamente para emissão de ingressos QR, entrega da cantina vinculada ao assento e atendimento ao titular (acesso, correção e anonimização com retenção fiscal legal obrigatória).
                    </p>
                  )}

                  <label className="flex cursor-pointer items-start gap-2.5 text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={lgpdRequired}
                      onChange={(e) => {
                        setLgpdRequired(e.target.checked);
                        if (e.target.checked) setLgpdNoticeErr(false);
                      }}
                      className="mt-0.5 h-4 w-4 accent-[var(--brand-red)]"
                    />
                    <span>
                      <strong className="text-white">(Obrigatório)</strong> Li e concordo com os Termos de Uso e Política de Privacidade CineFood para execução da compra.
                    </span>
                  </label>

                  {lgpdNoticeErr && (
                    <p role="alert" className="flex items-center gap-1.5 text-xs text-[#FCA5A5]">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>É necessário aceitar o Termo de Privacidade para concluir o cadastro.</span>
                    </p>
                  )}

                  <label className="flex cursor-pointer items-start gap-2.5 text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[var(--brand-red)]"
                    />
                    <span>(Opcional) Receber avisos de pré-venda e combos exclusivos por e-mail.</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)]"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>Criar Conta &amp; Aceitar LGPD</span>
                </button>
              </form>
            )}
          </div>

          <aside className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[var(--bg-elevated)] p-6 text-xs text-[var(--text-secondary)]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#FCD34D]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Privacidade &amp; Segurança (RF-01 / RF-17)
              </div>
              <h2 className="font-display text-2xl font-bold uppercase text-white">
                Por que criar sua conta?
              </h2>
              <ul className="space-y-2.5 leading-relaxed">
                <li>• Histórico privado de ingressos QR e status da cantina em tempo real.</li>
                <li>• Cancelamento self-service conforme CDC até 2 horas antes da sessão.</li>
                <li>• Avaliação pós-sessão liberada automaticamente após o check-in na portaria.</li>
                <li>• Autoatendimento de direitos LGPD com protocolo rastreável.</li>
              </ul>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-3.5 text-[11px]">
              Protótipo frontend: credenciais são validadas localmente no navegador sem envio a servidor externo.
            </div>
          </aside>
        </div>
      )}

      {/* Portal separado para Colaboradores & Grupos Operacionais (CRM Backstage) */}
      <div className="mt-10 rounded-2xl border border-amber-400/25 bg-[#0F1117] p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-500/10 text-amber-300">
              <Shield className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-400">
                Ambiente Interno Separado · RBAC por Grupo de Usuário
              </p>
              <h2 className="font-display text-2xl font-bold uppercase text-white">
                CineFood Backstage (CRM Operacional)
              </h2>
            </div>
          </div>
          <span className="font-mono text-[11px] text-white/50">rota isolada #/ops</span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STAFF_PROFILES.map((profile) => (
            <button
              key={profile.role}
              type="button"
              onClick={() => onEnterBackstage(profile.role)}
              className="group flex flex-col justify-between rounded-xl border border-white/12 bg-black/35 p-4 text-left transition-colors hover:border-amber-400/50 hover:bg-black/55 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    {profile.stationCode}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-white/40 group-hover:text-amber-300" aria-hidden="true" />
                </div>
                <p className="mt-2 text-sm font-bold text-white">{profile.groupLabel}</p>
                <p className="mt-0.5 text-[11px] text-white/60">{profile.operatorName}</p>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-white/50">
                {profile.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}