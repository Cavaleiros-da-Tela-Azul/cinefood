import { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  Popcorn,
  QrCode,
  RotateCcw,
  ShieldAlert,
  Ticket,
  Timer,
} from 'lucide-react';
import { MEIA_CATEGORIES, MovieItem, SelectedSeat, SessionSlot } from '../data/cinemaData';
import { CartComboLine, DeliveryMode } from './CanteenSheet';
import { StepperBar } from './StepperBar';

export interface CheckoutViewProps {
  movie?: MovieItem | null;
  session?: SessionSlot | null;
  selectedSeats: SelectedSeat[];
  cart: CartComboLine[];
  deliveryMode: DeliveryMode;
  defaultBuyer: { name: string; email: string };
  secondsLeft?: number;
  isCanteenOnly?: boolean;
  onBackToSeats: () => void;
  onOpenCanteen: () => void;
  onConfirmPayment: (method: 'pix' | 'card') => void;
  onLatePixRefund?: () => void;
}

type SimOutcome = 'ok' | 'late-pix' | 'gateway-error';

const FOCUS_RING_CLASS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]';

function formatTimer(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function CheckoutView({
  movie,
  session,
  selectedSeats,
  cart,
  deliveryMode,
  defaultBuyer,
  secondsLeft = 600,
  isCanteenOnly = false,
  onBackToSeats,
  onOpenCanteen,
  onConfirmPayment,
  onLatePixRefund,
}: CheckoutViewProps) {
  const [method, setMethod] = useState<'pix' | 'card'>('pix');
  const [buyerName, setBuyerName] = useState(defaultBuyer.name);
  const [buyerEmail, setBuyerEmail] = useState(defaultBuyer.email);
  const [cardHolder, setCardHolder] = useState(defaultBuyer.name || 'TITULAR SANDBOX');
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  const [emailInvalid, setEmailInvalid] = useState(false);
  const [nameInvalid, setNameInvalid] = useState(false);
  const [simOutcome, setSimOutcome] = useState<SimOutcome>('ok');
  const [paymentAlert, setPaymentAlert] = useState<SimOutcome | null>(null);
  const [paymentPhase, setPaymentPhase] = useState<'idle' | 'pending'>('idle');

  const ticketCount = isCanteenOnly ? 0 : selectedSeats.length;
  const hasHoldTimer = ticketCount > 0;
  const isHoldExpired = hasHoldTimer && secondsLeft <= 0;
  const isCriticalTime = hasHoldTimer && secondsLeft <= 120;

  useEffect(() => {
    setBuyerName(defaultBuyer.name);
    setBuyerEmail(defaultBuyer.email);
    setCardHolder(defaultBuyer.name || 'TITULAR SANDBOX');
  }, [defaultBuyer.name, defaultBuyer.email]);

  useEffect(() => {
    if (isHoldExpired && simOutcome === 'ok') {
      setSimOutcome('late-pix');
    }
  }, [isHoldExpired, simOutcome]);

  useEffect(() => {
    if (paymentPhase !== 'pending') return undefined;
    const timer = window.setTimeout(() => {
      setPaymentPhase('idle');
      if (simOutcome === 'late-pix') {
        setPaymentAlert('late-pix');
        onLatePixRefund?.();
        return;
      }
      if (simOutcome === 'gateway-error') {
        setPaymentAlert('gateway-error');
        return;
      }
      setPaymentAlert(null);
      onConfirmPayment(method);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [paymentPhase, simOutcome, method, onConfirmPayment, onLatePixRefund]);

  const basePrice = session?.basePrice ?? 40;
  const ticketsTotal = isCanteenOnly
    ? 0
    : selectedSeats.reduce(
        (sum, s) => sum + (s.tier === 'meia' ? basePrice * 0.5 : basePrice),
        0,
      );

  const canteenTotal = cart.reduce((acc, line) => {
    const addonsSum = line.item.addons
      .filter((a) => line.selectedAddonIds.includes(a.id))
      .reduce((s, a) => s + a.price, 0);
    return acc + (line.item.price + addonsSum) * line.quantity;
  }, 0);

  const grandTotal = ticketsTotal + canteenTotal;
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136cinefood-sandbox-${grandTotal}005204000053039865802BR`;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (paymentPhase === 'pending') return;
    if (isHoldExpired) return;

    const form = e.currentTarget;
    if (!form.checkValidity()) {
      const nameEl = form.elements.namedItem('buyerName') as HTMLInputElement | null;
      const emailEl = form.elements.namedItem('buyerEmail') as HTMLInputElement | null;
      setNameInvalid(Boolean(nameEl && !nameEl.validity.valid));
      setEmailInvalid(Boolean(emailEl && !emailEl.validity.valid));
      form.reportValidity();
      return;
    }

    setPaymentAlert(null);
    setPaymentPhase('pending');
  };

  return (
    <section
      className="relative min-h-[calc(100dvh-68px)] overflow-x-hidden bg-[var(--bg-base)]"
      aria-label="Pagamento Sandbox"
    >
      {/* Atmospheric Cinema / Culinary Backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {!isCanteenOnly && movie ? (
          <>
            <img
              src={movie.backdropSrc}
              alt=""
              decoding="async"
              className="h-full w-full object-cover object-center opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-base)]/95 via-[var(--bg-base)]/82 to-[var(--bg-base)]/95" />
          </>
        ) : (
          <div
            className="absolute inset-0 opacity-75"
            style={{
              background:
                'radial-gradient(circle at 20% 15%, rgba(245, 158, 11, 0.14) 0%, transparent 45%), radial-gradient(circle at 80% 25%, rgba(196, 10, 20, 0.12) 0%, transparent 45%)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-[var(--bg-base)]/70" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1240px] px-4 py-8 sm:px-8 sm:py-10">
        <button
          type="button"
          onClick={onBackToSeats}
          className={`cine-press inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] backdrop-blur-md hover:border-[var(--border-strong)] hover:text-white ${FOCUS_RING_CLASS}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{isCanteenOnly ? 'Voltar à Cantina' : 'Voltar aos Assentos'}</span>
        </button>

        <div className="mt-5">
          <StepperBar current={3} />
        </div>

        {/* Live 10-Min Hold Countdown (06_ref5) */}
        {hasHoldTimer && (
          <div
            className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-xs backdrop-blur-md ${
              isHoldExpired
                ? 'border-rose-400/60 bg-rose-500/15 text-rose-100'
                : isCriticalTime
                  ? 'border-[var(--brand-red)]/60 bg-[var(--brand-red)]/15 text-rose-100'
                  : 'border-white/15 bg-[var(--bg-elevated)]/80 text-[var(--text-secondary)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/35">
                <Timer
                  className={`h-4 w-4 ${
                    isHoldExpired || isCriticalTime ? 'text-[#FCA5A5]' : 'text-[var(--amber-progress)]'
                  }`}
                  aria-hidden="true"
                />
              </span>
              <div>
                <p className="font-bold uppercase tracking-wider text-white">
                  {isHoldExpired
                    ? 'Trava de Reserva Expirada (00:00)'
                    : 'Trava Temporária de Assentos (10 min)'}
                </p>
                <p className="mt-0.5 text-[var(--text-secondary)]">
                  {isHoldExpired
                    ? 'Os assentos travados foram liberados. Escolha novos assentos para continuar.'
                    : 'Conclua o pagamento simulado antes do término da reserva.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`font-mono-tabular rounded-xl border px-3.5 py-1.5 text-lg font-extrabold ${
                  isHoldExpired || isCriticalTime
                    ? 'border-rose-400/50 bg-black/45 text-[#FCA5A5]'
                    : 'border-[var(--amber-progress)]/40 bg-black/45 text-[#FCD34D]'
                }`}
              >
                {formatTimer(secondsLeft)}
              </span>
              {isHoldExpired && (
                <button
                  type="button"
                  onClick={onBackToSeats}
                  className={`cine-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0D0E12] hover:bg-white/90 ${FOCUS_RING_CLASS}`}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Escolher Novos Assentos</span>
                </button>
              )}
            </div>
          </div>
        )}

        {isHoldExpired && (
          <div
            role="alert"
            className="mt-4 flex flex-col gap-3 rounded-2xl border border-rose-400/60 bg-rose-500/15 p-4 text-xs text-rose-100 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
              <div>
                <p className="font-bold uppercase tracking-wider">
                  Reserva de assentos expirada durante o checkout
                </p>
                <p className="mt-1 text-rose-200/90">
                  A aprovação de pagamento foi bloqueada para evitar venda duplicada. Retorne ao mapa para selecionar novas poltronas.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBackToSeats}
              className={`cine-press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0D0E12] ${FOCUS_RING_CLASS}`}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Escolher Novos Assentos</span>
            </button>
          </div>
        )}

        {/* Sandbox Mode Banner + Gateway Exception Simulator */}
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[var(--amber-progress)]/35 bg-[var(--amber-progress)]/10 p-4 text-xs text-[#FDE68A] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--amber-progress)]" aria-hidden="true" />
            <div>
              <p className="font-bold uppercase tracking-wider">Ambiente de Homologação / Sandbox</p>
              <p className="mt-0.5 text-[var(--text-secondary)]">
                Nenhuma cobrança real será efetuada. Você pode testar comportamentos de exceção antes de emitir o ingresso.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5" role="group" aria-label="Simular cenário do gateway">
            <button
              type="button"
              disabled={isHoldExpired || paymentPhase === 'pending'}
              onClick={() => {
                setSimOutcome('ok');
                setPaymentAlert(null);
              }}
              className={`cine-press min-h-[44px] rounded-full border px-3.5 py-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING_CLASS} ${
                simOutcome === 'ok'
                  ? 'border-white bg-white text-[#0D0E12]'
                  : 'border-white/20 text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Aprovar Normal
            </button>
            <button
              type="button"
              disabled={paymentPhase === 'pending'}
              onClick={() => {
                setSimOutcome('late-pix');
                setPaymentAlert(null);
              }}
              className={`cine-press min-h-[44px] rounded-full border px-3.5 py-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING_CLASS} ${
                simOutcome === 'late-pix'
                  ? 'border-[var(--amber-progress)] bg-[var(--amber-progress)] text-[#0D0E12]'
                  : 'border-white/20 text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Pix Tardio
            </button>
            <button
              type="button"
              disabled={paymentPhase === 'pending'}
              onClick={() => {
                setSimOutcome('gateway-error');
                setPaymentAlert(null);
              }}
              className={`cine-press min-h-[44px] rounded-full border px-3.5 py-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING_CLASS} ${
                simOutcome === 'gateway-error'
                  ? 'border-rose-400 bg-rose-500 text-white'
                  : 'border-white/20 text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Falha Gateway
            </button>
          </div>
        </div>

        {/* Intermediate PENDENTE state */}
        {paymentPhase === 'pending' && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--amber-progress)]/50 bg-[var(--amber-progress)]/15 p-4 text-xs text-[#FDE68A] backdrop-blur-md"
          >
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--amber-progress)]" aria-hidden="true" />
            <div>
              <p className="font-bold uppercase tracking-wider">
                Status: PENDENTE · Aguardando confirmação do provedor...
              </p>
              <p className="mt-0.5 text-[var(--text-secondary)]">
                Validando assinatura e consolidando pedido para emissão do ingresso.
              </p>
            </div>
          </div>
        )}

        {paymentAlert === 'late-pix' && (
          <div
            role="alert"
            className="mt-4 flex flex-col gap-3 rounded-2xl border border-rose-400/50 bg-rose-500/15 p-4 text-xs text-rose-100 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
              <div>
                <p className="font-bold uppercase tracking-wider">
                  Pagamento Pix recebido após expiração da trava
                </p>
                <p className="mt-1 text-rose-200/90">
                  Sua trava de 10 minutos expirou antes da compensação do Pix. Para proteger sua reserva contra duplicidade, o pedido foi cancelado e o <strong>estorno automático</strong> foi disparado e registrado nos seus avisos.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBackToSeats}
              className={`cine-press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0D0E12] ${FOCUS_RING_CLASS}`}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Escolher Novos Assentos</span>
            </button>
          </div>
        )}

        {paymentAlert === 'gateway-error' && (
          <div
            role="alert"
            className="mt-4 flex flex-col gap-3 rounded-2xl border border-rose-400/50 bg-rose-500/15 p-4 text-xs text-rose-100 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
              <div>
                <p className="font-bold uppercase tracking-wider">Falha temporária de comunicação (Sandbox)</p>
                <p className="mt-1 text-rose-200/90">
                  Seus assentos continuam travados com segurança. Selecione &ldquo;Aprovar Normal&rdquo; ou tente novamente em instantes.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isHoldExpired}
              onClick={() => {
                setSimOutcome('ok');
                setPaymentAlert(null);
              }}
              className={`cine-press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-white/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING_CLASS}`}
            >
              Redefinir &amp; Tentar
            </button>
          </div>
        )}

        {/* Split Checkout Layout (05_ref1 + 05_ref2 + 05_ref3) */}
        <div className="mt-7 grid grid-cols-1 gap-7 lg:grid-cols-[1.2fr_0.85fr] lg:items-start">
          {/* LEFT: Form + Payment Wallet + LGPD */}
          <form
            noValidate
            onSubmit={handleSubmit}
            className="min-w-0 space-y-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 p-5 backdrop-blur-md shadow-2xl sm:p-7"
          >
            <div className="border-b border-white/10 pb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--amber-progress)]">
                Etapa 3 · Fechamento Seguro
              </p>
              <h1 className="font-display mt-1 text-3xl font-extrabold uppercase text-white sm:text-4xl">
                {isCanteenOnly ? 'Finalizar Pedido da Cantina' : 'Finalizar Pedido'}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Confirme os dados do titular para emissão do ingresso e escolha o pagamento simulado.
              </p>
            </div>

            {/* Buyer Contact Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="buyer-name" className="block text-xs font-semibold text-white">
                  Nome do Titular
                </label>
                <span id="buyer-name-hint" className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                  Impresso no comprovante de portaria/balcão
                </span>
                <input
                  id="buyer-name"
                  name="buyerName"
                  type="text"
                  required
                  minLength={2}
                  autoComplete="name"
                  value={buyerName}
                  aria-invalid={nameInvalid}
                  aria-describedby={nameInvalid ? 'buyer-name-hint buyer-name-err' : 'buyer-name-hint'}
                  onChange={(e) => {
                    setBuyerName(e.target.value);
                    if (nameInvalid && e.currentTarget.validity.valid) setNameInvalid(false);
                  }}
                  onBlur={(e) => setNameInvalid(!e.currentTarget.validity.valid)}
                  className={`cine-input mt-1.5 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/45 px-3.5 py-2.5 text-base text-white placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)] sm:text-sm ${FOCUS_RING_CLASS}`}
                />
                <p
                  id="buyer-name-err"
                  className="cine-error-msg mt-1 items-center gap-1.5 text-xs text-[#FCA5A5]"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Informe o nome completo (mínimo 2 letras).</span>
                </p>
              </div>

              <div className="min-w-0">
                <label htmlFor="buyer-email" className="block text-xs font-semibold text-white">
                  E-mail para o QR Code
                </label>
                <span id="buyer-email-hint" className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                  Formato: voce@exemplo.com
                </span>
                <input
                  id="buyer-email"
                  name="buyerEmail"
                  type="email"
                  required
                  autoComplete="email"
                  value={buyerEmail}
                  aria-invalid={emailInvalid}
                  aria-describedby={emailInvalid ? 'buyer-email-hint buyer-email-err' : 'buyer-email-hint'}
                  onChange={(e) => {
                    setBuyerEmail(e.target.value);
                    if (emailInvalid && e.currentTarget.validity.valid) setEmailInvalid(false);
                  }}
                  onBlur={(e) => setEmailInvalid(!e.currentTarget.validity.valid)}
                  className={`cine-input mt-1.5 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/45 px-3.5 py-2.5 text-base text-white placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)] sm:text-sm ${FOCUS_RING_CLASS}`}
                />
                <p
                  id="buyer-email-err"
                  className="cine-error-msg mt-1 items-center gap-1.5 text-xs text-[#FCA5A5]"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Informe um endereço de e-mail válido no formato voce@exemplo.com.</span>
                </p>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Forma de Pagamento
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label="Meio de pagamento sandbox">
                <button
                  type="button"
                  aria-pressed={method === 'pix'}
                  onClick={() => setMethod('pix')}
                  className={`cine-press flex min-h-[44px] items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${FOCUS_RING_CLASS} ${
                    method === 'pix'
                      ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/15'
                      : 'border-white/15 bg-black/30 hover:border-white/30'
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/40 text-[var(--brand-red)]">
                    <QrCode className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">Pix Instantâneo (Sandbox)</p>
                    <p className="text-xs text-[var(--text-secondary)]">Confirmação em segundos</p>
                  </div>
                </button>

                <button
                  type="button"
                  aria-pressed={method === 'card'}
                  onClick={() => setMethod('card')}
                  className={`cine-press flex min-h-[44px] items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${FOCUS_RING_CLASS} ${
                    method === 'card'
                      ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/15'
                      : 'border-white/15 bg-black/30 hover:border-white/30'
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/40 text-[var(--brand-red)]">
                    <CreditCard className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">Cartão de Crédito (Sandbox)</p>
                    <p className="text-xs text-[var(--text-secondary)]">Tokenizado · zero dados salvos</p>
                  </div>
                </button>
              </div>

              {method === 'pix' ? (
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div
                      className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-white p-2 text-[#0D0E12] shadow-lg"
                      role="img"
                      aria-label="QR Code Pix Sandbox para pagamento simulado"
                    >
                      <QrCode className="h-16 w-16" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-white">
                        Pix Copia-e-Cola (Sandbox)
                      </p>
                      <code className="font-mono-tabular block w-full truncate rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-xs text-[var(--text-secondary)] select-all">
                        {pixCode}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(pixCode).catch(() => {});
                          }
                          setPixCopied(true);
                          window.setTimeout(() => setPixCopied(false), 1800);
                        }}
                        className={`cine-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 ${FOCUS_RING_CLASS}`}
                      >
                        {pixCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[var(--success-emerald)]" aria-hidden="true" />
                            <span>Código Pix Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Copiar código Pix Sandbox</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/35 p-4">
                  {/* Textured Dark Virtual Card Preview (05_ref4) */}
                  <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#232634] via-[#14161E] to-[#0B0C10] p-4 shadow-xl">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                      <span>CineFood Pass · Sandbox</span>
                      <span className="font-mono-tabular text-[#FCD34D]">VISA</span>
                    </div>
                    <p className="font-mono-tabular mt-5 text-lg font-bold tracking-[0.16em] text-white">
                      •••• •••• •••• 4242
                    </p>
                    <div className="mt-4 flex items-end justify-between text-[11px] text-[var(--text-secondary)]">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                          Titular
                        </span>
                        <span className="font-semibold uppercase text-white">
                          {cardHolder || buyerName || 'TITULAR SANDBOX'}
                        </span>
                      </div>
                      <span className="font-mono-tabular rounded bg-white/10 px-2 py-0.5 text-[10px] text-white">
                        tok_sandbox_4242
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="sandbox-card-holder" className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                        Nome impresso (simulado)
                      </label>
                      <input
                        id="sandbox-card-holder"
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className={`mt-1 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-base text-white sm:text-sm ${FOCUS_RING_CLASS}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="sandbox-card-last4" className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                        Cartão tokenizado (apenas final)
                      </label>
                      <input
                        id="sandbox-card-last4"
                        type="text"
                        readOnly
                        value="•••• •••• •••• 4242"
                        className={`font-mono-tabular mt-1 min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-base text-[var(--text-secondary)] sm:text-sm ${FOCUS_RING_CLASS}`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* LGPD Transparency Notice */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-white">
                Privacidade &amp; Emissão do Bilhete (LGPD)
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                Seus dados são tratados estritamente para emissão do bilhete digital, validação de portaria e entrega da cantina (execução contratual, Art. 7º, V da LGPD).
              </p>
              <label className="mt-3 flex min-h-[44px] cursor-pointer items-center gap-2.5 text-xs text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={lgpdConsent}
                  onChange={(e) => setLgpdConsent(e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-[var(--brand-red)]"
                />
                <span>
                  (Opcional) Desejo receber avisos promocionais e estreias do CineFood por e-mail.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isHoldExpired || paymentPhase === 'pending'}
              className={`cine-press inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_28px_rgba(0,0,0,0.45)] transition-colors hover:bg-[var(--brand-red-hover)] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING_CLASS}`}
            >
              {paymentPhase === 'pending' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Processando PENDENTE...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <span>Confirmar Pagamento Simulado · R$ {grandTotal}</span>
                </>
              )}
            </button>
          </form>

          {/* RIGHT: Consolidated Order Breakdown (05_ref1 + 05_ref3) */}
          <aside className="flex min-w-0 flex-col justify-between rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/85 p-5 backdrop-blur-md shadow-2xl sm:p-6 lg:sticky lg:top-24">
            <div className="min-w-0 space-y-5">
              {isCanteenOnly || !movie || !session ? (
                <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
                  <span className="flex h-16 w-14 shrink-0 items-center justify-center rounded-xl border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/15 text-[var(--amber-progress)]">
                    <Popcorn className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl font-bold uppercase leading-tight text-white">
                      Bomboniere Expressa
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      Pedido avulso de cantina
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Retirada no balcão</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
                  <img
                    src={movie.posterSrc}
                    alt={movie.title}
                    className="h-22 w-15 shrink-0 rounded-xl border border-white/15 object-cover"
                  />
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 rounded bg-[var(--brand-red)]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FCA5A5]">
                      <Ticket className="h-3 w-3" aria-hidden="true" />
                      {session.format}
                    </span>
                    <h2 className="font-display mt-1 line-clamp-2 break-words text-2xl font-bold uppercase leading-tight text-white">
                      {movie.title}
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      {session.dateLabel} · {session.time} · {session.room}
                    </p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{session.complex}</p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Comprador
                </p>
                <p className="mt-0.5 truncate font-semibold text-white">{buyerName || '—'}</p>
                <p className="break-all text-[var(--text-secondary)]">{buyerEmail || '—'}</p>
              </div>

              {!isCanteenOnly && ticketCount > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <span>Ingressos ({selectedSeats.length})</span>
                    <span className="font-mono-tabular text-white">R$ {ticketsTotal}</span>
                  </div>
                  <ul className="mt-2.5 space-y-2 text-sm">
                    {selectedSeats.map((s) => {
                      const unit = s.tier === 'meia' ? basePrice * 0.5 : basePrice;
                      const catLabel =
                        s.tier === 'meia'
                          ? MEIA_CATEGORIES.find((c) => c.id === (s.meiaCategory ?? 'estudante'))?.label.split(' ')[0]
                          : null;
                      return (
                        <li
                          key={s.seatId}
                          className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-[var(--text-secondary)]"
                        >
                          <span className="min-w-0 truncate">
                            Poltrona <strong className="font-mono-tabular text-white">{s.seatId}</strong> ({s.tier}
                            {catLabel ? ` · ${catLabel}` : ''})
                          </span>
                          <span className="font-mono-tabular shrink-0 font-bold text-white">R$ {unit}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Cantina ({isCanteenOnly || deliveryMode === 'counter' ? 'Retirada no balcão' : 'Entrega no assento'})
                  </p>
                  <button
                    type="button"
                    onClick={onOpenCanteen}
                    className={`inline-flex min-h-[44px] shrink-0 items-center text-xs font-semibold text-[var(--amber-progress)] hover:underline ${FOCUS_RING_CLASS}`}
                  >
                    Editar combos
                  </button>
                </div>

                {cart.length === 0 ? (
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    Nenhum item de bomboniere adicionado.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {cart.map((line) => {
                      const addonsSum = line.item.addons
                        .filter((a) => line.selectedAddonIds.includes(a.id))
                        .reduce((s, a) => s + a.price, 0);
                      const total = (line.item.price + addonsSum) * line.quantity;
                      return (
                        <li
                          key={line.item.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-[var(--text-secondary)]"
                        >
                          <span className="min-w-0 break-words">
                            {line.quantity}× {line.item.name}
                          </span>
                          <span className="font-mono-tabular shrink-0 font-bold text-white">R$ {total}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-2 border-t border-white/15 pt-4">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Taxa de conveniência</span>
                <span className="font-mono-tabular text-[var(--success-emerald)]">Isenta no MVP</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Total consolidado</span>
                <span className="font-mono-tabular text-3xl font-extrabold text-white">R$ {grandTotal}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
