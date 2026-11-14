import { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Loader2,
  Lock,
  Popcorn,
  QrCode,
  RotateCcw,
  ShieldAlert,
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
  const [lgpdConsent, setLgpdConsent] = useState(false);

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
    <section className="mx-auto max-w-[1160px] px-4 py-10 sm:px-8" aria-label="Pagamento Sandbox">
      <button
        type="button"
        onClick={onBackToSeats}
        className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>{isCanteenOnly ? 'Voltar à Cantina' : 'Voltar aos Assentos'}</span>
      </button>

      <div className="mt-6">
        <StepperBar current={3} />
      </div>

      {/* Live 10-Min Hold Countdown (when ticketCount > 0) */}
      {hasHoldTimer && (
        <div
          className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-xs ${
            isHoldExpired
              ? 'border-rose-400/60 bg-rose-500/15 text-rose-100'
              : isCriticalTime
                ? 'border-[var(--brand-red)]/60 bg-[var(--brand-red)]/15 text-rose-100'
                : 'border-white/15 bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Timer
              className={`h-4 w-4 shrink-0 ${
                isHoldExpired || isCriticalTime ? 'text-[#FCA5A5]' : 'text-[var(--amber-progress)]'
              }`}
              aria-hidden="true"
            />
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
              className={`font-mono-tabular rounded-lg border px-3 py-1.5 text-base font-extrabold ${
                isHoldExpired || isCriticalTime
                  ? 'border-rose-400/50 bg-black/40 text-[#FCA5A5]'
                  : 'border-[var(--amber-progress)]/40 bg-black/40 text-[#FCD34D]'
              }`}
            >
              {formatTimer(secondsLeft)}
            </span>
            {isHoldExpired && (
              <button
                type="button"
                onClick={onBackToSeats}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0D0E12] hover:bg-white/90"
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
          className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-400/60 bg-rose-500/15 p-4 text-xs text-rose-100 sm:flex-row sm:items-center sm:justify-between"
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
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0D0E12]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Escolher Novos Assentos</span>
          </button>
        </div>
      )}

      {/* Mandatory Sandbox Banner + Error Simulation Controls (RST-03 / RN-01) */}
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/10 p-4 text-xs text-[#FDE68A] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--amber-progress)]" aria-hidden="true" />
          <div>
            <p className="font-bold uppercase tracking-wider">Ambiente de Homologação / Sandbox (RST-03)</p>
            <p className="mt-0.5 text-[var(--text-secondary)]">
              Nenhuma cobrança real será efetuada. Teste também comportamentos de exceção antes de emitir o pedido.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0" role="group" aria-label="Simular cenário do gateway">
          <button
            type="button"
            disabled={isHoldExpired || paymentPhase === 'pending'}
            onClick={() => {
              setSimOutcome('ok');
              setPaymentAlert(null);
            }}
            className={`min-h-[44px] rounded-full border px-3.5 py-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
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
            className={`min-h-[44px] rounded-full border px-3.5 py-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              simOutcome === 'late-pix'
                ? 'border-[var(--amber-progress)] bg-[var(--amber-progress)] text-[#0D0E12]'
                : 'border-white/20 text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            Pix Tardio (RN-01)
          </button>
          <button
            type="button"
            disabled={paymentPhase === 'pending'}
            onClick={() => {
              setSimOutcome('gateway-error');
              setPaymentAlert(null);
            }}
            className={`min-h-[44px] rounded-full border px-3.5 py-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              simOutcome === 'gateway-error'
                ? 'border-rose-400 bg-rose-500 text-white'
                : 'border-white/20 text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            Falha Gateway
          </button>
        </div>
      </div>

      {/* Intermediate PENDENTE state (Webhook HMAC) */}
      {paymentPhase === 'pending' && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--amber-progress)]/50 bg-[var(--amber-progress)]/15 p-4 text-xs text-[#FDE68A]"
        >
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--amber-progress)]" aria-hidden="true" />
          <div>
            <p className="font-bold uppercase tracking-wider">
              Status: PENDENTE · Aguardando confirmação do gateway (Webhook HMAC)...
            </p>
            <p className="mt-0.5 text-[var(--text-secondary)]">
              Validando assinatura do provedor e consolidando estado para ATIVO.
            </p>
          </div>
        </div>
      )}

      {paymentAlert === 'late-pix' && (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-400/50 bg-rose-500/15 p-4 text-xs text-rose-100 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
            <div>
              <p className="font-bold uppercase tracking-wider">
                Pagamento Pix Tardio após expiração da trava (RN-01)
              </p>
              <p className="mt-1 text-rose-200/90">
                Sua trava de 10 minutos expirou antes da compensação do Pix. Para proteger sua reserva contra duplicidade, o pedido foi cancelado e o <strong>estorno automático</strong> foi disparado e registrado nos seus avisos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBackToSeats}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0D0E12]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Escolher Novos Assentos</span>
          </button>
        </div>
      )}

      {paymentAlert === 'gateway-error' && (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-400/50 bg-rose-500/15 p-4 text-xs text-rose-100 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
            <div>
              <p className="font-bold uppercase tracking-wider">Falha temporária de comunicação (503 Sandbox)</p>
              <p className="mt-1 text-rose-200/90">
                Seus assentos continuam travados na chave de idempotência. Selecione &ldquo;Aprovar Normal&rdquo; ou tente novamente em instantes.
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
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg border border-white/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Redefinir &amp; Tentar
          </button>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left: Form + Payment Method + LGPD */}
        <form
          noValidate
          onSubmit={handleSubmit}
          className="min-w-0 space-y-6 rounded-2xl border border-white/10 bg-[var(--bg-elevated)] p-6"
        >
          <div>
            <h1 className="font-display text-3xl font-extrabold uppercase text-white">
              {isCanteenOnly ? 'Finalizar Pedido da Cantina' : 'Finalizar Pedido'}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Confirme seus dados de envio e escolha o meio de pagamento simulado.
            </p>
          </div>

          {/* Buyer Contact Fields (validate-input-after-interaction + accessible-error-announcement) */}
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
                className="cine-input mt-1.5 min-h-[44px] w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2.5 text-base text-white placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)] sm:text-sm"
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
                className="cine-input mt-1.5 min-h-[44px] w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2.5 text-base text-white placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)] sm:text-sm"
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMethod('pix')}
              className={`flex min-h-[44px] items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                method === 'pix'
                  ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/15'
                  : 'border-white/15 bg-black/25 hover:border-white/30'
              }`}
            >
              <QrCode className="h-6 w-6 shrink-0 text-[var(--brand-red)]" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-white">Pix Instantâneo (Sandbox)</p>
                <p className="text-xs text-[var(--text-secondary)]">Confirmação via Webhook HMAC</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMethod('card')}
              className={`flex min-h-[44px] items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                method === 'card'
                  ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/15'
                  : 'border-white/15 bg-black/25 hover:border-white/30'
              }`}
            >
              <CreditCard className="h-6 w-6 shrink-0 text-[var(--brand-red)]" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-white">Cartão de Crédito (Sandbox)</p>
                <p className="text-xs text-[var(--text-secondary)]">Zero armazenamento de cartão</p>
              </div>
            </button>
          </div>

          {/* LGPD Transparency Notice (RF-17) */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-white">
              Transparência e Privacidade (LGPD)
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
              Seus dados são tratados estritamente para emissão do bilhete/QR e operação da entrega (execução contratual, Art. 7º, V da LGPD).
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
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-red)] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_28px_rgba(0,0,0,0.45)] transition-colors hover:bg-[var(--brand-red-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {paymentPhase === 'pending' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Processando PENDENTE (HMAC)...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" aria-hidden="true" />
                <span>Confirmar Pagamento Simulado · R$ {grandTotal}</span>
              </>
            )}
          </button>
        </form>

        {/* Right: Order Breakdown */}
        <aside className="flex min-w-0 flex-col justify-between rounded-2xl border border-white/10 bg-[var(--bg-elevated)] p-6">
          <div className="space-y-5 min-w-0">
            {isCanteenOnly || !movie || !session ? (
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <span className="flex h-16 w-14 shrink-0 items-center justify-center rounded-md border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/15 text-[var(--amber-progress)]">
                  <Popcorn className="h-7 w-7" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-bold uppercase leading-tight text-white">
                    Bomboniere Expressa
                  </h2>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    Pedido avulso de cantina (ADR-005)
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Retirada no balcão</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <img
                  src={movie.posterSrc}
                  alt={movie.title}
                  className="h-20 w-14 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0">
                  <h2 className="font-display line-clamp-2 break-words text-2xl font-bold uppercase leading-tight text-white">
                    {movie.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {session.dateLabel} · {session.time} · {session.format}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">{session.complex}</p>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs">
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Comprador</p>
              <p className="mt-0.5 truncate font-semibold text-white">{buyerName || '—'}</p>
              <p className="break-all text-[var(--text-secondary)]">{buyerEmail || '—'}</p>
            </div>

            {!isCanteenOnly && ticketCount > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Ingressos ({selectedSeats.length})
                </p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {selectedSeats.map((s) => {
                    const unit = s.tier === 'meia' ? basePrice * 0.5 : basePrice;
                    const catLabel =
                      s.tier === 'meia'
                        ? MEIA_CATEGORIES.find((c) => c.id === (s.meiaCategory ?? 'estudante'))?.label.split(' ')[0]
                        : null;
                    return (
                      <li key={s.seatId} className="flex justify-between gap-2 text-[var(--text-secondary)]">
                        <span className="min-w-0 truncate">
                          Poltrona <strong className="text-white">{s.seatId}</strong> ({s.tier}
                          {catLabel ? ` · ${catLabel}` : ''})
                        </span>
                        <span className="font-mono-tabular shrink-0 text-white">R$ {unit}</span>
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
                  className="inline-flex min-h-[44px] shrink-0 items-center text-xs font-semibold text-[var(--amber-progress)] hover:underline"
                >
                  Editar combos
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  Nenhum item de bomboniere adicionado.
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5 text-sm">
                  {cart.map((line) => {
                    const addonsSum = line.item.addons
                      .filter((a) => line.selectedAddonIds.includes(a.id))
                      .reduce((s, a) => s + a.price, 0);
                    const total = (line.item.price + addonsSum) * line.quantity;
                    return (
                      <li key={line.item.id} className="flex justify-between gap-3 text-[var(--text-secondary)]">
                        <span className="min-w-0 break-words">
                          {line.quantity}× {line.item.name}
                        </span>
                        <span className="font-mono-tabular shrink-0 text-white">R$ {total}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-baseline justify-between border-t border-white/15 pt-4">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Total consolidado</span>
            <span className="font-mono-tabular text-3xl font-extrabold text-white">R$ {grandTotal}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
