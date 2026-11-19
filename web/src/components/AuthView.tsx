import { FormEvent, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Film,
  Lock,
  LogOut,
  MessageSquare,
  Popcorn,
  QrCode,
  ShieldCheck,
  Star,
  Ticket,
  UserCheck,
  X,
} from 'lucide-react';
import {
  CANTEEN_STATUS_LABEL,
  ClientTicketOrder,
  CustomerUser,
  InternalNoticeItem,
  MovieItem,
} from '../data/cinemaData';

export interface AuthViewProps {
  currentUser: CustomerUser | null;
  userOrders?: ClientTicketOrder[];
  userNotices?: InternalNoticeItem[];
  savedMovies?: MovieItem[];
  lgpdRequestsCount?: number;
  onLogin: (user: CustomerUser) => void;
  onAuthenticateCredentials?: (
    email: string,
    password: string,
  ) => { ok: true; user: CustomerUser } | { ok: false; error: string };
  onRegisterUser?: (
    user: CustomerUser,
  ) => { ok: true; user: CustomerUser } | { ok: false; error: string };
  onUpdateProfile?: (patch: {
    name: string;
    email: string;
    newPassword?: string;
  }) => { ok: true } | { ok: false; error: string };
  onRequestPasswordRecovery?: (email: string) => {
    ok: boolean;
    token?: string;
    error?: string;
  };
  onConfirmPasswordReset?: (
    token: string,
    newPassword: string,
  ) => { ok: boolean; error?: string };
  onLogout: () => void;
  onBack: () => void;
  onGoToOrders: () => void;
  onGoToOrdersTab?: (tab: 'orders' | 'reviews' | 'lgpd') => void;
  onSelectSavedMovie?: (movieId: string) => void;
  onOpenReviewsForMovie?: (movieId: string) => void;
  onToggleMarketingOptIn?: (next: boolean) => void;
}

const LGPD_NOTICE_VERSION = 'v2.1 · Vigência a partir de 14/12/2026';

function getMemberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function LgpdFullNoticeCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-black/40 text-xs text-[var(--text-secondary)] ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-white">
          <FileText className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
          Aviso Completo de Privacidade (LGPD)
        </span>
        <span className="font-mono-tabular text-[11px] text-[var(--amber-progress)]">
          {LGPD_NOTICE_VERSION}
        </span>
      </div>

      <dl className="mt-3 space-y-2 text-[11px] leading-relaxed">
        <div>
          <dt className="inline font-bold text-white">Controlador: </dt>
          <dd className="inline">CineFood Operações Piloto Ltda. (CNPJ 00.000.000/0001-00).</dd>
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
          <dd className="font-mono-tabular inline text-white">dpo@cinefood.app</dd>
        </div>
      </dl>
    </div>
  );
}

export function AuthView({
  currentUser,
  userOrders = [],
  userNotices = [],
  savedMovies = [],
  lgpdRequestsCount = 0,
  onLogin,
  onAuthenticateCredentials,
  onRegisterUser,
  onUpdateProfile,
  onRequestPasswordRecovery,
  onConfirmPasswordReset,
  onLogout,
  onBack,
  onGoToOrders,
  onGoToOrdersTab,
  onSelectSavedMovie,
  onOpenReviewsForMovie,
  onToggleMarketingOptIn,
}: AuthViewProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryTokenIssued, setRecoveryTokenIssued] = useState<string | null>(null);
  const [recoveryTokenInput, setRecoveryTokenInput] = useState('');
  const [recoveryNewPass, setRecoveryNewPass] = useState('');
  const [recoveryFeedback, setRecoveryFeedback] = useState<{
    kind: 'ok' | 'err';
    text: string;
  } | null>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileEmail, setEditProfileEmail] = useState('');
  const [editProfilePassword, setEditProfilePassword] = useState('');
  const [profileFeedback, setProfileFeedback] = useState<{
    kind: 'ok' | 'err';
    text: string;
  } | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const termsDialogRef = useRef<HTMLDialogElement>(null);

  // Sign-in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginEmailErr, setLoginEmailErr] = useState(false);
  const [loginPassErr, setLoginPassErr] = useState(false);
  const [authFormError, setAuthFormError] = useState<string | null>(null);

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

  useEffect(() => {
    if (currentUser) {
      setEditProfileName(currentUser.name);
      setEditProfileEmail(currentUser.email);
      setEditProfilePassword('');
    }
  }, [currentUser]);

  useEffect(() => {
    const dialog = termsDialogRef.current;
    if (!dialog) return;
    if (termsModalOpen && !dialog.open) {
      dialog.showModal();
    } else if (!termsModalOpen && dialog.open) {
      dialog.close();
    }
  }, [termsModalOpen]);

  const formatNowPtBr = () => new Date().toLocaleString('pt-BR');

  const handleSignInSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthFormError(null);
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      const emailEl = form.elements.namedItem('login-email') as HTMLInputElement | null;
      const passEl = form.elements.namedItem('login-password') as HTMLInputElement | null;
      setLoginEmailErr(Boolean(emailEl && !emailEl.validity.valid));
      setLoginPassErr(Boolean(passEl && !passEl.validity.valid));
      return;
    }

    if (onAuthenticateCredentials) {
      const result = onAuthenticateCredentials(loginEmail.trim(), loginPassword);
      if (!result.ok) {
        setAuthFormError(result.error);
        return;
      }
      onLogin(result.user);
      onGoToOrders();
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
    setAuthFormError(null);
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

    const candidateUser: CustomerUser = {
      id: `usr-${Date.now()}`,
      name: fullName.trim(),
      email: signupEmail.trim().toLowerCase(),
      password: signupPassword,
      lgpdAcceptedAt: formatNowPtBr(),
      marketingOptIn,
    };

    if (onRegisterUser) {
      const regResult = onRegisterUser(candidateUser);
      if (!regResult.ok) {
        setAuthFormError(regResult.error);
        return;
      }
      onLogin(regResult.user);
      onGoToOrders();
      return;
    }

    onLogin(candidateUser);
    onGoToOrders();
  };

  const handleRequestRecovery = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = recoveryEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setRecoveryFeedback({ kind: 'err', text: 'Informe um e-mail válido para recuperação.' });
      return;
    }
    if (onRequestPasswordRecovery) {
      const res = onRequestPasswordRecovery(cleaned);
      if (!res.ok) {
        setRecoveryFeedback({
          kind: 'err',
          text: res.error ?? 'Não foi possível emitir token de recuperação.',
        });
        return;
      }
      setRecoveryTokenIssued(res.token ?? null);
      setRecoveryTokenInput(res.token ?? '');
      setRecoveryFeedback({
        kind: 'ok',
        text: res.token
          ? `Token temporário gerado em sandbox: ${res.token}`
          : 'Se o e-mail estiver cadastrado, um token temporário foi emitido.',
      });
      return;
    }
    const simToken = `CF-REC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setRecoveryTokenIssued(simToken);
    setRecoveryTokenInput(simToken);
    setRecoveryFeedback({ kind: 'ok', text: `Token temporário gerado: ${simToken}` });
  };

  const handleConfirmRecoveryReset = (e: FormEvent) => {
    e.preventDefault();
    if (recoveryNewPass.length < 8) {
      setRecoveryFeedback({ kind: 'err', text: 'A nova senha deve conter ao menos 8 caracteres.' });
      return;
    }
    if (onConfirmPasswordReset) {
      const res = onConfirmPasswordReset(recoveryTokenInput.trim(), recoveryNewPass);
      if (!res.ok) {
        setRecoveryFeedback({
          kind: 'err',
          text: res.error ?? 'Token inválido ou expirado.',
        });
        return;
      }
    } else if (recoveryTokenInput.trim() !== recoveryTokenIssued) {
      setRecoveryFeedback({ kind: 'err', text: 'Token de recuperação inválido.' });
      return;
    }
    setRecoveryTokenIssued(null);
    setRecoveryTokenInput('');
    setRecoveryNewPass('');
    setRecoveryOpen(false);
    setRecoveryFeedback({
      kind: 'ok',
      text: 'Senha redefinida com sucesso. Entre com a nova senha.',
    });
  };

  const handleProfileSave = (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const trimmedName = editProfileName.trim();
    const trimmedEmail = editProfileEmail.trim().toLowerCase();
    if (trimmedName.length < 2) {
      setProfileFeedback({ kind: 'err', text: 'Informe um nome completo com ao menos 2 caracteres.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setProfileFeedback({ kind: 'err', text: 'Informe um e-mail válido.' });
      return;
    }
    if (editProfilePassword && editProfilePassword.length < 8) {
      setProfileFeedback({ kind: 'err', text: 'A nova senha deve ter no mínimo 8 caracteres.' });
      return;
    }

    if (onUpdateProfile) {
      const res = onUpdateProfile({
        name: trimmedName,
        email: trimmedEmail,
        ...(editProfilePassword ? { newPassword: editProfilePassword } : {}),
      });
      if (!res.ok) {
        setProfileFeedback({ kind: 'err', text: res.error });
        return;
      }
    } else {
      onLogin({
        ...currentUser,
        name: trimmedName,
        email: trimmedEmail,
        ...(editProfilePassword ? { password: editProfilePassword } : {}),
      });
    }
    setEditProfilePassword('');
    setEditingProfile(false);
    setProfileFeedback({ kind: 'ok', text: 'Dados do perfil atualizados com sucesso.' });
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

  const openOrdersSection = (tab: 'orders' | 'reviews' | 'lgpd') => {
    if (onGoToOrdersTab) {
      onGoToOrdersTab(tab);
    } else {
      onGoToOrders();
    }
  };

  // Derived Member Hub stats when signed in
  const activeOrders = userOrders.filter(
    (o) => o.status === 'ATIVO' && o.orderKind !== 'canteen-only',
  );
  const featuredTicket =
    activeOrders[0] ?? userOrders.find((o) => o.status === 'ATIVO') ?? userOrders[0] ?? null;
  const reviewedOrders = userOrders.filter(
    (o) => o.orderKind !== 'canteen-only' && typeof o.rating === 'number' && o.rating > 0,
  );
  const pendingReviewOrders = userOrders.filter(
    (o) =>
      o.orderKind !== 'canteen-only' &&
      o.checkedIn &&
      o.sessionEnded &&
      o.status !== 'CANCELADO' &&
      !(typeof o.rating === 'number' && o.rating > 0),
  );
  const unreadNoticesCount = userNotices.filter((n) => !n.read).length;

  return (
    <section
      className="relative min-h-[calc(100vh-80px)] overflow-x-clip px-4 py-8 sm:px-8 sm:py-10"
      aria-label="Autenticação e Privacidade"
    >
      {/* Shared Atmospheric Dark Backdrop + Subtle Ambient Glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img
          src="/assets/horizon-backdrop.jpg"
          alt=""
          className="h-full w-full scale-105 object-cover object-center opacity-15 blur-sm"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(196,10,20,0.14),transparent_48%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.09),transparent_45%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0E12]/88 via-[#0D0E12]/90 to-[#0D0E12]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1160px]">
        <button
          type="button"
          onClick={onBack}
          className="cine-press inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] backdrop-blur-md transition-colors hover:border-white/25 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Voltar ao Cartaz</span>
        </button>

        {currentUser ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 space-y-6"
          >
            {/* Member Identity Hero Banner */}
            <div className="rounded-3xl border border-white/12 bg-[var(--bg-elevated)]/92 p-4 shadow-2xl backdrop-blur-md sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3.5 border-b border-white/10 pb-4 sm:gap-4 sm:pb-6">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-[var(--brand-red)] to-[#7F070E] font-display text-xl font-extrabold tracking-wide text-white shadow-lg sm:h-16 sm:w-16 sm:text-2xl">
                    {getMemberInitials(currentUser.name)}
                    <span
                      title="Sessão autenticada"
                      className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--bg-elevated)] bg-[var(--success-emerald)] text-[#0D0E12] sm:h-6 sm:w-6"
                    >
                      <UserCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--success-emerald)] sm:text-xs">
                      Sessão Autenticada
                    </p>
                    <h1 className="font-display mt-0.5 truncate text-2xl font-extrabold uppercase text-white sm:text-4xl">
                      {currentUser.name}
                    </h1>
                    <p className="break-all text-xs text-[var(--text-secondary)] sm:text-sm">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-2.5">
                  <button
                    type="button"
                    onClick={() => openOrdersSection('orders')}
                    className="cine-press inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-[var(--brand-red-hover)] sm:flex-none sm:px-5"
                  >
                    <Ticket className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">Meus Ingressos &amp; LGPD</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile((v) => !v);
                      setProfileFeedback(null);
                    }}
                    className="cine-press inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:border-white/40 hover:bg-white/10 sm:px-4"
                  >
                    <span>{editingProfile ? 'Fechar Edição' : 'Editar Perfil'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="cine-press inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white sm:px-4"
                  >
                    <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Encerrar Sessão</span>
                  </button>
                </div>
              </div>

              {profileFeedback && (
                <p
                  role={profileFeedback.kind === 'err' ? 'alert' : 'status'}
                  className={`mt-4 rounded-xl border px-3.5 py-2.5 text-xs ${
                    profileFeedback.kind === 'err'
                      ? 'border-red-400/40 bg-red-500/15 text-red-200'
                      : 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                  }`}
                >
                  {profileFeedback.text}
                </p>
              )}

              {editingProfile && (
                <form
                  onSubmit={handleProfileSave}
                  className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-white/12 bg-black/40 p-4 sm:grid-cols-3"
                >
                  <div>
                    <label htmlFor="edit-profile-name" className="block text-xs font-semibold text-white">
                      Nome completo
                    </label>
                    <input
                      id="edit-profile-name"
                      type="text"
                      required
                      minLength={2}
                      value={editProfileName}
                      onChange={(e) => setEditProfileName(e.target.value)}
                      className="cine-input mt-1 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-profile-email" className="block text-xs font-semibold text-white">
                      E-mail
                    </label>
                    <input
                      id="edit-profile-email"
                      type="email"
                      required
                      value={editProfileEmail}
                      onChange={(e) => setEditProfileEmail(e.target.value)}
                      className="cine-input mt-1 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-profile-password" className="block text-xs font-semibold text-white">
                      Nova senha (opcional)
                    </label>
                    <input
                      id="edit-profile-password"
                      type="password"
                      minLength={8}
                      placeholder="Manter atual"
                      value={editProfilePassword}
                      onChange={(e) => setEditProfilePassword(e.target.value)}
                      className="cine-input mt-1 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 sm:col-span-3">
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="cine-press min-h-[44px] rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="cine-press min-h-[44px] rounded-xl bg-[var(--brand-red)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)]"
                    >
                      Salvar Perfil
                    </button>
                  </div>
                </form>
              )}

              {/* Member Quick Telemetry Strip */}
              <div className="mt-3.5 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-4 sm:gap-3">
                <button
                  type="button"
                  onClick={() => openOrdersSection('orders')}
                  className="cine-press flex min-h-[52px] items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5 text-left transition-colors hover:border-white/25 sm:min-h-[58px] sm:px-4 sm:py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] sm:text-[11px]">
                      Ingressos Ativos
                    </p>
                    <p className="font-mono-tabular mt-0.5 text-lg font-bold text-white sm:text-xl">
                      {activeOrders.length}
                    </p>
                  </div>
                  <Ticket className="h-4 w-4 shrink-0 text-[var(--brand-red)] sm:h-5 sm:w-5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => openOrdersSection('reviews')}
                  className="cine-press flex min-h-[52px] items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5 text-left transition-colors hover:border-white/25 sm:min-h-[58px] sm:px-4 sm:py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] sm:text-[11px]">
                      Avaliações Feitas
                    </p>
                    <p className="font-mono-tabular mt-0.5 text-lg font-bold text-white sm:text-xl">
                      {reviewedOrders.length}
                    </p>
                  </div>
                  <Star className="h-4 w-4 shrink-0 text-[var(--amber-progress)] sm:h-5 sm:w-5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => openOrdersSection('orders')}
                  className="cine-press flex min-h-[52px] items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5 text-left transition-colors hover:border-white/25 sm:min-h-[58px] sm:px-4 sm:py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] sm:text-[11px]">
                      Avisos Não Lidos
                    </p>
                    <p className="font-mono-tabular mt-0.5 text-lg font-bold text-white sm:text-xl">
                      {unreadNoticesCount}
                    </p>
                  </div>
                  <Bell
                    className={`h-4 w-4 shrink-0 sm:h-5 sm:w-5 ${
                      unreadNoticesCount > 0
                        ? 'text-[var(--amber-progress)]'
                        : 'text-[var(--text-muted)]'
                    }`}
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => openOrdersSection('lgpd')}
                  className="cine-press flex min-h-[58px] items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-left transition-colors hover:border-white/25"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Protocolos LGPD
                    </p>
                    <p className="font-mono-tabular mt-0.5 text-xl font-bold text-white">
                      {lgpdRequestsCount}
                    </p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-[var(--success-emerald)]" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Stacked Member Activity Cards + Bottom 2-Column Row */}
            <div className="space-y-6">
              {/* Active Cinema Pass Stub */}
              <section
                aria-label="Próxima sessão e passe ativo"
                className="overflow-hidden rounded-3xl border border-white/12 bg-[var(--bg-elevated)]/92 shadow-xl backdrop-blur-md"
              >
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-[var(--amber-progress)]" aria-hidden="true" />
                      <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                        {featuredTicket ? 'Passe em Destaque' : 'Sua Próxima Sessão'}
                      </h2>
                    </div>
                    {featuredTicket && (
                      <span className="font-mono-tabular rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        {featuredTicket.id}
                      </span>
                    )}
                  </div>

                  {featuredTicket ? (
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <img
                          src={featuredTicket.posterSrc}
                          alt={featuredTicket.movieTitle}
                          className="h-28 w-20 shrink-0 rounded-xl border border-white/15 object-cover shadow-md"
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                featuredTicket.status === 'ATIVO'
                                  ? 'bg-[var(--success-emerald)]/20 text-[#6EE7B7]'
                                  : 'bg-white/10 text-[var(--text-secondary)]'
                              }`}
                            >
                              {featuredTicket.status}
                            </span>
                            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                              {featuredTicket.format}
                            </span>
                          </div>

                          <h3 className="font-display line-clamp-1 text-2xl font-extrabold uppercase text-white">
                            {featuredTicket.movieTitle}
                          </h3>

                          <p className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
                              {featuredTicket.dateLabel}
                            </span>
                            <span className="font-mono-tabular inline-flex items-center gap-1 text-white">
                              <Clock className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
                              {featuredTicket.time}
                            </span>
                            <span>{featuredTicket.room}</span>
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {featuredTicket.seatsLabel.length > 0 && (
                              <span className="font-mono-tabular rounded-lg border border-[var(--brand-red)]/40 bg-[var(--brand-red)]/15 px-2.5 py-1 text-xs font-bold text-white">
                                Assentos: {featuredTicket.seatsLabel.join(', ')}
                              </span>
                            )}
                            {featuredTicket.canteenSummary && (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--amber-progress)]/35 bg-[var(--amber-progress)]/10 px-2.5 py-1 text-xs font-semibold text-[#FDE68A]">
                                <Popcorn className="h-3.5 w-3.5" aria-hidden="true" />
                                {CANTEEN_STATUS_LABEL[featuredTicket.canteenStatus]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Perforated Divider */}
                      <div className="relative -mx-6 my-5 flex items-center" aria-hidden="true">
                        <span className="-ml-3 h-6 w-6 shrink-0 rounded-full border border-white/15 bg-[#0D0E12]" />
                        <div className="ticket-perforated-divider mx-3 flex-1" />
                        <span className="-mr-3 h-6 w-6 shrink-0 rounded-full border border-white/15 bg-[#0D0E12]" />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
                          Token: <strong className="text-white">{featuredTicket.qrToken}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => openOrdersSection('orders')}
                          className="cine-press inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:border-white/40 hover:bg-white/10"
                        >
                          <span>Ver Todos os Pedidos</span>
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-sm text-[var(--text-secondary)]">
                        Você ainda não possui ingressos emitidos nesta sessão.
                      </p>
                      <button
                        type="button"
                        onClick={onBack}
                        className="cine-press mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10"
                      >
                        <Film className="h-4 w-4 text-[var(--brand-red)]" aria-hidden="true" />
                        <span>Explorar Filmes em Cartaz</span>
                      </button>
                    </div>
                  )}
                </section>

                {/* User's Published Reviews ("Minhas Avaliações") */}
                <section
                  aria-label="Avaliações feitas por você"
                  className="rounded-3xl border border-white/12 bg-[var(--bg-elevated)]/92 p-6 shadow-xl backdrop-blur-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-[var(--amber-progress)]" aria-hidden="true" />
                      <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                        Minhas Avaliações ({reviewedOrders.length})
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => openOrdersSection('reviews')}
                      className="inline-flex min-h-[36px] items-center gap-1 text-xs font-semibold text-[var(--amber-progress)] hover:underline"
                    >
                      <span>
                        {pendingReviewOrders.length > 0
                          ? `${pendingReviewOrders.length} sessão(ões) para avaliar`
                          : 'Gerenciar avaliações'}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  {reviewedOrders.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-white/12 bg-black/25 p-5 text-xs leading-relaxed text-[var(--text-secondary)]">
                      <p>
                        Você ainda não publicou avaliações de sessões assistidas.
                        {pendingReviewOrders.length > 0
                          ? ` Há ${pendingReviewOrders.length} sessão(ões) já concluída(s) e elegível(eis) para avaliação.`
                          : ''}
                      </p>
                      {pendingReviewOrders.length > 0 && (
                        <button
                          type="button"
                          onClick={() => openOrdersSection('reviews')}
                          className="cine-press mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--amber-progress)]/45 bg-[var(--amber-progress)]/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#FCD34D] transition hover:bg-[var(--amber-progress)]/25"
                        >
                          <Star className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Avaliar Sessão Concluída</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {reviewedOrders.map((order) => (
                        <article
                          key={order.id}
                          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/35 p-4 sm:flex-row sm:items-start"
                        >
                          <img
                            src={order.posterSrc}
                            alt={`Pôster de ${order.movieTitle}`}
                            className="h-20 w-14 shrink-0 rounded-lg border border-white/10 object-cover"
                          />
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <h3 className="font-display text-lg font-extrabold uppercase text-white">
                                  {order.movieTitle}
                                </h3>
                                <p className="text-[11px] text-[var(--text-muted)]">
                                  {order.complex} · {order.dateLabel} · {order.format}
                                </p>
                              </div>

                              <div
                                className="inline-flex items-center gap-1 rounded-full border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/15 px-2.5 py-1 text-xs font-bold text-[#FCD34D]"
                                aria-label={`Nota ${order.rating} de 5`}
                              >
                                {[1, 2, 3, 4, 5].map((starNum) => (
                                  <Star
                                    key={starNum}
                                    className={`h-3.5 w-3.5 ${
                                      (order.rating ?? 0) >= starNum
                                        ? 'fill-current text-[var(--amber-progress)]'
                                        : 'text-white/20'
                                    }`}
                                    aria-hidden="true"
                                  />
                                ))}
                                <span className="font-mono-tabular ml-1">{order.rating}/5</span>
                              </div>
                            </div>

                            {order.reviewTitle && (
                              <p className="text-xs font-bold text-white">{order.reviewTitle}</p>
                            )}
                            {order.reviewComment && (
                              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                                &ldquo;{order.reviewComment}&rdquo;
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-emerald)]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6EE7B7]">
                                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                                Entrada Validada
                              </span>
                              {onOpenReviewsForMovie && (
                                <button
                                  type="button"
                                  onClick={() => onOpenReviewsForMovie(order.movieId)}
                                  className="inline-flex min-h-[36px] items-center gap-1 text-[11px] font-semibold text-white/80 hover:text-white hover:underline"
                                >
                                  <span>Ver no Catálogo</span>
                                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                {/* Saved Watchlist Section */}
                <section
                  aria-label="Filmes salvos na sua lista"
                  className="rounded-3xl border border-white/12 bg-[var(--bg-elevated)]/92 p-6 shadow-xl backdrop-blur-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-[var(--amber-progress)]" aria-hidden="true" />
                      <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                        Minha Lista ({savedMovies.length})
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={onBack}
                      className="inline-flex min-h-[36px] items-center gap-1 text-xs font-semibold text-[var(--amber-progress)] hover:underline"
                    >
                      <span>Explorar Cartaz</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  {savedMovies.length === 0 ? (
                    <p className="mt-3 rounded-2xl border border-dashed border-white/12 bg-black/25 p-4 text-xs leading-relaxed text-[var(--text-secondary)]">
                      Nenhum filme salvo ainda. Use o botão de salvar na vitrine{' '}
                      <strong className="text-white">Em Cartaz</strong> ou em{' '}
                      <strong className="text-white">Sessões</strong> para acompanhar estreias aqui.
                    </p>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {savedMovies.map((movie) => (
                        <button
                          key={movie.id}
                          type="button"
                          onClick={() => (onSelectSavedMovie ? onSelectSavedMovie(movie.id) : onBack())}
                          className="cine-press flex min-h-[44px] items-center gap-3 rounded-2xl border border-white/12 bg-black/35 p-3 text-left transition hover:border-white/30"
                        >
                          <img
                            src={movie.posterSrc}
                            alt={`Pôster de ${movie.title}`}
                            className="h-16 w-11 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-display truncate text-lg font-extrabold uppercase text-white">
                              {movie.title}
                            </p>
                            <p className="truncate text-[11px] text-[var(--text-secondary)]">
                              {movie.genre} · {movie.duration}
                            </p>
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--amber-progress)]">
                              Ver Sessões <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>

              {/* Bottom 2-Column Row Below Minha Lista: Avisos da Conta & Preferências & Segurança */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch">
                {/* Recent Internal Notices Summary */}
                <section
                  aria-label="Resumo de avisos internos"
                  className="flex flex-col rounded-3xl border border-white/12 bg-[var(--bg-elevated)]/92 p-6 shadow-xl backdrop-blur-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-[var(--amber-progress)]" aria-hidden="true" />
                      <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                        Avisos da Conta
                      </h2>
                    </div>
                    {unreadNoticesCount > 0 && (
                      <span className="rounded-full bg-[var(--brand-red)] px-2.5 py-0.5 text-[11px] font-bold text-white">
                        {unreadNoticesCount} novo(s)
                      </span>
                    )}
                  </div>

                  {userNotices.length === 0 ? (
                    <p className="mt-3 text-xs text-[var(--text-secondary)]">
                      Nenhum aviso operacional registrado até o momento.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-2.5">
                      {userNotices.slice(0, 2).map((notice) => (
                        <li
                          key={notice.id}
                          className="rounded-2xl border border-white/10 bg-black/35 p-3.5 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-white">{notice.title}</span>
                            {!notice.read && (
                              <span className="rounded-full bg-[var(--amber-progress)]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#FCD34D]">
                                Não lido
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[var(--text-secondary)]">{notice.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Preferences & On-Demand Privacy Popup */}
                <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/12 bg-[var(--bg-elevated)]/92 p-6 shadow-xl backdrop-blur-md">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3.5">
                      <ShieldCheck className="h-4 w-4 text-[var(--success-emerald)]" aria-hidden="true" />
                      <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                        Preferências &amp; Segurança
                      </h2>
                    </div>

                    {/* Tactile Pill Switch for Optional Marketing Opt-in */}
                    <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-xs">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-bold uppercase tracking-wider text-white">
                            Comunicações Promocionais
                          </p>
                          <p className="mt-1 text-[var(--text-secondary)]">
                            Envio de pré-vendas e estreias:{' '}
                            <strong className="text-white">
                              {currentUser.marketingOptIn ? 'Ativado' : 'Desativado'}
                            </strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={currentUser.marketingOptIn}
                          aria-label={
                            currentUser.marketingOptIn
                              ? 'Revogar Consentimento de Marketing'
                              : 'Conceder Consentimento de Marketing'
                          }
                          onClick={handleToggleMarketing}
                          className={`cine-press relative inline-flex h-11 w-[68px] shrink-0 cursor-pointer items-center rounded-full border px-1.5 transition-colors ${
                            currentUser.marketingOptIn
                              ? 'border-[var(--success-emerald)]/60 bg-[var(--success-emerald)]/25'
                              : 'border-white/20 bg-white/10'
                          }`}
                        >
                          <motion.span
                            layout
                            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                            className={`h-7 w-7 rounded-full shadow-md ${
                              currentUser.marketingOptIn
                                ? 'ml-auto bg-[var(--success-emerald)]'
                                : 'bg-white/80'
                            }`}
                          />
                        </button>
                      </div>

                      {marketingUpdatedAt && (
                        <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#6EE7B7]">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            Atualizado em <span className="font-mono-tabular">{marketingUpdatedAt}</span>
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* On-demand Terms & Privacy Popup Trigger */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setTermsModalOpen(true)}
                      className="cine-press inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:border-white/40 hover:bg-white/10"
                    >
                      <FileText className="h-4 w-4 text-[var(--amber-progress)]" aria-hidden="true" />
                      <span>Visualizar Termos de Uso e Privacidade</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openOrdersSection('lgpd')}
                      className="cine-press inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-black/35 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] transition hover:border-white/30 hover:text-white"
                    >
                      <ShieldCheck className="h-4 w-4 text-[var(--success-emerald)]" aria-hidden="true" />
                      <span>Solicitações LGPD ({lgpdRequestsCount})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            {/* Primary Glass Auth Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl border border-white/15 bg-[var(--bg-elevated)]/92 p-6 shadow-2xl backdrop-blur-md sm:p-8"
            >
              <div
                role="tablist"
                aria-label="Tipo de acesso"
                className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/45 p-1.5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signin'}
                  onClick={() => setMode('signin')}
                  className={`cine-press min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                    mode === 'signin'
                      ? 'bg-white text-[#0D0E12] shadow-sm'
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
                  className={`cine-press min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                    mode === 'signup'
                      ? 'bg-white text-[#0D0E12] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  Criar Conta (LGPD)
                </button>
              </div>

              {mode === 'signin' ? (
                <form noValidate onSubmit={handleSignInSubmit} className="mt-6 space-y-5">
                  <div>
                    <h1 className="font-display text-3xl font-extrabold uppercase text-white sm:text-4xl">
                      Acesse sua Conta
                    </h1>
                    <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                      Consulte seus ingressos privados, avalie sessões encerradas e gerencie solicitações LGPD.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="login-email" className="block text-xs font-semibold text-white">
                      E-mail cadastrado
                    </label>
                    <span
                      id="login-email-hint"
                      className="mt-0.5 block text-[11px] text-[var(--text-muted)]"
                    >
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
                      aria-describedby={
                        loginEmailErr ? 'login-email-hint login-email-err' : 'login-email-hint'
                      }
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        if (loginEmailErr && e.currentTarget.validity.valid) setLoginEmailErr(false);
                      }}
                      onBlur={(e) => setLoginEmailErr(!e.currentTarget.validity.valid)}
                      className="cine-input mt-1.5 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-base text-white placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)] sm:text-sm"
                    />
                    <p
                      id="login-email-err"
                      className="cine-error-msg mt-1 items-center gap-1.5 text-xs text-[#FCA5A5]"
                    >
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
                    <span
                      id="login-pass-hint"
                      className="mt-0.5 block text-[11px] text-[var(--text-muted)]"
                    >
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
                      aria-describedby={
                        loginPassErr ? 'login-pass-hint login-pass-err' : 'login-pass-hint'
                      }
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginPassErr && e.currentTarget.validity.valid) setLoginPassErr(false);
                      }}
                      onBlur={(e) => setLoginPassErr(!e.currentTarget.validity.valid)}
                      className="cine-input mt-1.5 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-base text-white focus:border-[var(--focus-ring)] sm:text-sm"
                    />
                    <p
                      id="login-pass-err"
                      className="cine-error-msg mt-1 items-center gap-1.5 text-xs text-[#FCA5A5]"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>A senha deve conter ao menos 8 caracteres.</span>
                    </p>
                  </div>

                  {authFormError && (
                    <p
                      role="alert"
                      className="flex items-center gap-2 rounded-xl border border-red-400/45 bg-red-500/15 px-3.5 py-2.5 text-xs text-red-200"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{authFormError}</span>
                    </p>
                  )}

                  {recoveryFeedback && !recoveryOpen && (
                    <p
                      role="status"
                      className="flex items-center gap-2 rounded-xl border border-emerald-400/45 bg-emerald-500/15 px-3.5 py-2.5 text-xs text-emerald-200"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{recoveryFeedback.text}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryOpen((v) => !v);
                        setRecoveryFeedback(null);
                      }}
                      className="inline-flex min-h-[44px] items-center text-xs font-semibold text-[var(--amber-progress)] hover:underline"
                    >
                      {recoveryOpen ? 'Voltar ao login' : 'Esqueci minha senha'}
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                    <button
                      type="submit"
                      className="cine-press inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-[var(--brand-red-hover)]"
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
                      className="cine-press inline-flex min-h-[46px] items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                    >
                      Acesso Rápido Demo (Joana)
                    </button>
                  </div>
                </form>
              ) : (
                <form noValidate onSubmit={handleSignUpSubmit} className="mt-6 space-y-5">
                  <div>
                    <h1 className="font-display text-3xl font-extrabold uppercase text-white sm:text-4xl">
                      Criar Conta CineFood
                    </h1>
                    <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                      Cadastro com transparência LGPD completa antes da criação da conta.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="full-name" className="block text-xs font-semibold text-white">
                      Nome completo
                    </label>
                    <span
                      id="full-name-hint"
                      className="mt-0.5 block text-[11px] text-[var(--text-muted)]"
                    >
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
                      className="cine-input mt-1.5 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-base text-white focus:border-[var(--focus-ring)] sm:text-sm"
                    />
                    <p
                      id="full-name-err"
                      className="cine-error-msg mt-1 items-center gap-1.5 text-xs text-[#FCA5A5]"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>Informe seu nome completo (mínimo 2 caracteres).</span>
                    </p>
                  </div>

                  <div>
                    <label htmlFor="signup-email" className="block text-xs font-semibold text-white">
                      E-mail
                    </label>
                    <span
                      id="signup-email-hint"
                      className="mt-0.5 block text-[11px] text-[var(--text-muted)]"
                    >
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
                        if (signupEmailErr && e.currentTarget.validity.valid) {
                          setSignupEmailErr(false);
                        }
                      }}
                      onBlur={(e) => setSignupEmailErr(!e.currentTarget.validity.valid)}
                      className="cine-input mt-1.5 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-base text-white focus:border-[var(--focus-ring)] sm:text-sm"
                    />
                    <p
                      id="signup-email-err"
                      className="cine-error-msg mt-1 items-center gap-1.5 text-xs text-[#FCA5A5]"
                    >
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
                      className="cine-input mt-1.5 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-base text-white focus:border-[var(--focus-ring)] sm:text-sm"
                    />
                    <p
                      id="new-password-err"
                      className="cine-error-msg mt-1 items-center gap-1.5 text-xs text-[#FCA5A5]"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>A senha precisa ter 8+ caracteres com maiúscula, minúscula e número.</span>
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <LgpdFullNoticeCard compact />

                    <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-xl border border-white/10 bg-black/30 p-3 text-[var(--text-secondary)]">
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

                    <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-xl border border-white/10 bg-black/30 p-3 text-[var(--text-secondary)]">
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
                    className="cine-press inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-[var(--brand-red-hover)]"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span>Criar Conta &amp; Registrar Ciência LGPD</span>
                  </button>
                </form>
              )}

              {mode === 'signin' && recoveryOpen && (
                <div className="mt-5 space-y-4 rounded-2xl border border-[var(--amber-progress)]/35 bg-black/45 p-4">
                  <div>
                    <h2 className="font-display text-xl font-bold uppercase text-white">
                      Recuperação de Senha (RF-01)
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      Gere um token temporário de uso único para redefinir sua senha em ambiente sandbox.
                    </p>
                  </div>

                  {recoveryFeedback && (
                    <p
                      role={recoveryFeedback.kind === 'err' ? 'alert' : 'status'}
                      className={`rounded-xl border px-3 py-2 text-xs ${
                        recoveryFeedback.kind === 'err'
                          ? 'border-red-400/40 bg-red-500/15 text-red-200'
                          : 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                      }`}
                    >
                      {recoveryFeedback.text}
                    </p>
                  )}

                  <form onSubmit={handleRequestRecovery} className="flex flex-col gap-2 sm:flex-row">
                    <label htmlFor="recovery-email" className="sr-only">
                      E-mail para recuperação
                    </label>
                    <input
                      id="recovery-email"
                      type="email"
                      required
                      placeholder="E-mail da conta cadastrada"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="cine-input min-h-[44px] flex-1 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                    />
                    <button
                      type="submit"
                      className="cine-press min-h-[44px] rounded-xl border border-[var(--amber-progress)]/45 bg-[var(--amber-progress)]/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#FDE68A]"
                    >
                      Emitir Token
                    </button>
                  </form>

                  <form onSubmit={handleConfirmRecoveryReset} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label htmlFor="recovery-token" className="block text-[11px] font-semibold text-white">
                        Token de recuperação
                      </label>
                      <input
                        id="recovery-token"
                        type="text"
                        required
                        value={recoveryTokenInput}
                        onChange={(e) => setRecoveryTokenInput(e.target.value)}
                        className="cine-input mt-1 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 font-mono text-xs text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="recovery-new-pass" className="block text-[11px] font-semibold text-white">
                        Nova senha (mín. 8 caracteres)
                      </label>
                      <input
                        id="recovery-new-pass"
                        type="password"
                        required
                        minLength={8}
                        value={recoveryNewPass}
                        onChange={(e) => setRecoveryNewPass(e.target.value)}
                        className="cine-input mt-1 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="cine-press min-h-[44px] rounded-xl bg-[var(--brand-red)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white sm:col-span-2"
                    >
                      Redefinir Senha
                    </button>
                  </form>
                </div>
              )}
            </motion.div>

            {/* Right Cinematic Showcase & Privacy Trust Aside */}
            <aside className="flex flex-col gap-5">
              <div className="overflow-hidden rounded-3xl border border-white/12 bg-[var(--bg-elevated)]/92 shadow-xl backdrop-blur-md">
                <div className="relative h-36 overflow-hidden">
                  <img
                    src="/assets/solaris-backdrop.jpg"
                    alt=""
                    className="h-full w-full object-cover object-center opacity-55"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-[var(--bg-elevated)]/65 to-transparent" />
                  <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--amber-progress)]/40 bg-black/65 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#FCD34D] backdrop-blur-sm">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Privacidade &amp; Segurança
                    </span>
                  </div>
                </div>

                <div className="space-y-4 p-6 text-xs text-[var(--text-secondary)]">
                  <h2 className="font-display text-2xl font-bold uppercase text-white">
                    Por que criar sua conta?
                  </h2>

                  <ul className="space-y-3 leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <Film className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-red)]" aria-hidden="true" />
                      <span>
                        Histórico privado de ingressos QR individuais e status da cantina em tempo real.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Popcorn className="mt-0.5 h-4 w-4 shrink-0 text-[var(--amber-progress)]" aria-hidden="true" />
                      <span>
                        Cancelamento self-service conforme CDC (até 7 dias da compra e 2h antes da sessão).
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Star className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success-emerald)]" aria-hidden="true" />
                      <span>
                        Avaliação pós-sessão com edição e exclusão após o check-in na portaria.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--focus-ring)]" aria-hidden="true" />
                      <span>Autoatendimento de direitos LGPD com protocolo rastreável.</span>
                    </li>
                  </ul>

                  <LgpdFullNoticeCard compact />

                  <div className="rounded-xl border border-white/10 bg-black/35 p-3.5 text-[11px] text-[var(--text-muted)]">
                    Protótipo frontend: credenciais são validadas localmente no navegador sem envio a servidor externo.
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Terms of Use & Privacy Popup Dialog (<dialog>) */}
      <dialog
        ref={termsDialogRef}
        aria-label="Termos de Uso e Privacidade"
        onCancel={(e) => {
          e.preventDefault();
          setTermsModalOpen(false);
        }}
        className="m-auto w-[min(92vw,680px)] rounded-3xl border border-white/15 bg-[var(--bg-elevated)] p-6 text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm sm:p-7"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--amber-progress)]/35 bg-[var(--amber-progress)]/15 text-[var(--amber-progress)]">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-extrabold uppercase text-white">
                Termos de Uso e Privacidade
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Transparência contratual e dados pessoais (LGPD · Lei nº 13.709/2018)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTermsModalOpen(false)}
            aria-label="Fechar termos de uso e privacidade"
            className="cine-press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[var(--text-secondary)] transition hover:border-white/35 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          {currentUser && (
            <div className="rounded-2xl border border-[var(--success-emerald)]/30 bg-[var(--success-emerald)]/10 p-4 text-xs">
              <p className="font-bold uppercase tracking-wider text-[#6EE7B7]">
                Termo LGPD Registrado na Conta
              </p>
              <p className="mt-1 leading-relaxed text-[var(--text-secondary)]">
                Ciência contratual (Art. 7º, V) confirmada por{' '}
                <strong className="text-white">{currentUser.name}</strong> em{' '}
                <strong className="font-mono-tabular text-white">{currentUser.lgpdAcceptedAt}</strong>.
              </p>
            </div>
          )}

          <LgpdFullNoticeCard />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => {
              setTermsModalOpen(false);
              openOrdersSection('lgpd');
            }}
            className="cine-press inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
          >
            <ShieldCheck className="h-4 w-4 text-[var(--success-emerald)]" aria-hidden="true" />
            <span>Abrir Solicitações LGPD</span>
          </button>

          <button
            type="button"
            autoFocus
            onClick={() => setTermsModalOpen(false)}
            className="cine-press inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--brand-red)] px-6 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-[var(--brand-red-hover)]"
          >
            Fechar
          </button>
        </div>
      </dialog>
    </section>
  );
}
