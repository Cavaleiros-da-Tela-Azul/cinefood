import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  Ban,
  Bell,
  CheckCircle2,
  Clock,
  Edit3,
  FileDown,
  Lock,
  Popcorn,
  QrCode,
  ShieldCheck,
  Star,
  Ticket,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  CANTEEN_STATUS_LABEL,
  ClientTicketOrder,
  CustomerUser,
  InternalNoticeItem,
  isCdcCancelEligible,
  LGPD_REQUEST_LABELS,
  LgpdRequestItem,
  LgpdRequestType,
} from '../data/cinemaData';

export interface ClientOrdersViewProps {
  currentUser: CustomerUser | null;
  orders: ClientTicketOrder[];
  notices?: InternalNoticeItem[];
  lgpdRequests: LgpdRequestItem[];
  onGoToAuth: () => void;
  onGoToHome: () => void;
  onCancelOrder: (orderId: string) => void;
  onSaveReview: (orderId: string, rating: number, comment: string) => void;
  onDeleteReview?: (orderId: string) => void;
  onMarkNoticeRead?: (noticeId: string) => void;
  onSubmitLgpdRequest: (type: LgpdRequestType, details: string) => void;
}

type ClientTab = 'orders' | 'reviews' | 'lgpd';

export function ClientOrdersView({
  currentUser,
  orders,
  notices = [],
  lgpdRequests,
  onGoToAuth,
  onGoToHome,
  onCancelOrder,
  onSaveReview,
  onDeleteReview,
  onMarkNoticeRead,
  onSubmitLgpdRequest,
}: ClientOrdersViewProps) {
  const [activeTab, setActiveTab] = useState<ClientTab>('orders');
  const [cancelTarget, setCancelTarget] = useState<ClientTicketOrder | null>(null);
  const cancelDialogRef = useRef<HTMLDialogElement>(null);

  // Review draft & edit map per orderId
  const [editingReviewOrderId, setEditingReviewOrderId] = useState<string | null>(null);
  const [draftRatings, setDraftRatings] = useState<Record<string, number>>({});
  const [draftComments, setDraftComments] = useState<Record<string, string>>({});

  // LGPD request form state
  const [lgpdFormKey, setLgpdFormKey] = useState(0);
  const [lgpdType, setLgpdType] = useState<LgpdRequestType>('ACESSO');
  const [lgpdDetails, setLgpdDetails] = useState('');
  const [lgpdErr, setLgpdErr] = useState(false);
  const [lgpdSuccessProto, setLgpdSuccessProto] = useState<string | null>(null);

  const tablistId = useId();

  useEffect(() => {
    const dialog = cancelDialogRef.current;
    if (!dialog) return;
    if (cancelTarget && !dialog.open) {
      dialog.showModal();
    } else if (!cancelTarget && dialog.open) {
      dialog.close();
    }
  }, [cancelTarget]);

  const userOrders = currentUser ? orders.filter((o) => o.userId === currentUser.id) : [];
  const userNotices = currentUser ? notices.filter((n) => n.userId === currentUser.id) : [];
  const unreadNoticesCount = userNotices.filter((n) => !n.read).length;

  const handleLgpdSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      setLgpdErr(true);
      return;
    }
    const details = lgpdDetails.trim();
    onSubmitLgpdRequest(lgpdType, details);
    setLgpdDetails('');
    setLgpdErr(false);
    setLgpdFormKey((k) => k + 1);
    setLgpdSuccessProto(
      `Solicitação de ${LGPD_REQUEST_LABELS[lgpdType].title} registrada com protocolo rastreável.`,
    );
  };

  if (!currentUser) {
    return (
      <section className="mx-auto max-w-[820px] px-4 py-14 text-center sm:px-8" aria-label="Área Privada do Cliente">
        <div className="rounded-2xl border border-white/15 bg-[var(--bg-elevated)] p-8 shadow-2xl">
          <Lock className="mx-auto h-10 w-10 text-[var(--amber-progress)]" aria-hidden="true" />
          <h1 className="font-display mt-4 text-3xl font-extrabold uppercase text-white sm:text-4xl">
            Área Privada do Cliente (RF-11)
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
            Faça login para consultar seu histórico privado de ingressos QR, avisos internos, cancelamentos CDC e solicitações LGPD.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onGoToAuth}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)]"
            >
              <UserCheck className="h-4 w-4" aria-hidden="true" />
              <span>Entrar ou Criar Conta</span>
            </button>
            <button
              type="button"
              onClick={onGoToHome}
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10"
            >
              Explorar Cartaz
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1160px] px-4 py-10 sm:px-8" aria-label="Meus Ingressos e Privacidade">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--amber-progress)]">
            Histórico Privado · {currentUser.name}
          </p>
          <h1 className="font-display mt-1 text-4xl font-extrabold uppercase text-white sm:text-5xl">
            Meus Ingressos &amp; LGPD
          </h1>
          <p className="mt-1 break-all text-xs text-[var(--text-secondary)]">{currentUser.email}</p>
        </div>

        <button
          type="button"
          onClick={onGoToAuth}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:border-white/40"
        >
          <UserCheck className="h-4 w-4 text-[var(--success-emerald)]" aria-hidden="true" />
          <span>Gerenciar Conta</span>
        </button>
      </div>

      {/* Avisos Internos Section (estornos, RN-02, conversões RN-03, LGPD) */}
      <section
        aria-label="Avisos Internos"
        className="mt-6 rounded-2xl border border-white/15 bg-[var(--bg-elevated)] p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[var(--amber-progress)]" aria-hidden="true" />
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
              Avisos Internos
            </h2>
            {unreadNoticesCount > 0 && (
              <span className="rounded-full bg-[var(--brand-red)] px-2 py-0.5 text-[11px] font-bold text-white">
                {unreadNoticesCount} novo(s)
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            Notificações de portaria, cantina, estornos e LGPD
          </span>
        </div>

        {userNotices.length === 0 ? (
          <p className="mt-3 text-xs text-[var(--text-secondary)]">
            Nenhum aviso interno registrado para esta conta até o momento.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {userNotices.map((notice) => {
              const toneBorder =
                notice.type === 'refund'
                  ? 'border-rose-400/40 bg-rose-500/10'
                  : notice.type === 'warning'
                    ? 'border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/10'
                    : 'border-white/10 bg-black/30';

              return (
                <li
                  key={notice.id}
                  className={`flex flex-col gap-2 rounded-xl border p-3.5 text-xs sm:flex-row sm:items-center sm:justify-between ${toneBorder}`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white">{notice.title}</span>
                      {notice.orderId && (
                        <span className="font-mono-tabular rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {notice.orderId}
                        </span>
                      )}
                      {!notice.read && (
                        <span className="rounded bg-[var(--amber-progress)]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#FCD34D]">
                          Não lido
                        </span>
                      )}
                    </div>
                    <p className="text-[var(--text-secondary)]">{notice.message}</p>
                    <p className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                      {notice.createdAt}
                    </p>
                  </div>

                  {!notice.read && onMarkNoticeRead && (
                    <button
                      type="button"
                      onClick={() => onMarkNoticeRead(notice.id)}
                      className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border border-white/20 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-white/10"
                    >
                      Marcar como lido
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Scrollable Horizontal Tablist with edge spacing (modern-web-guidance: tabs) */}
      <div
        id={tablistId}
        role="tablist"
        aria-label="Seções do painel do cliente"
        className="mt-6 flex gap-2 overflow-x-auto pb-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'orders'}
          onClick={() => setActiveTab('orders')}
          className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'orders'
              ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
              : 'border-white/15 bg-white/5 text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Ticket className="h-4 w-4" aria-hidden="true" />
          <span>Pedidos &amp; Cancelamento CDC ({userOrders.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'reviews'}
          onClick={() => setActiveTab('reviews')}
          className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'reviews'
              ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
              : 'border-white/15 bg-white/5 text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Star className="h-4 w-4" aria-hidden="true" />
          <span>Avaliação Pós-Sessão</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'lgpd'}
          onClick={() => setActiveTab('lgpd')}
          className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'lgpd'
              ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
              : 'border-white/15 bg-white/5 text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>Direitos LGPD ({lgpdRequests.length})</span>
        </button>
      </div>

      {/* Tab Panel 1: Orders & CDC Cancellation */}
      {activeTab === 'orders' && (
        <div role="tabpanel" aria-label="Pedidos e Ingressos" className="mt-6 space-y-4">
          {userOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--bg-elevated)] p-8 text-center text-sm text-[var(--text-secondary)]">
              Nenhum pedido encontrado para a conta <strong className="text-white">{currentUser.email}</strong>.
            </div>
          ) : (
            userOrders.map((order) => {
              const cdcStatus = isCdcCancelEligible(order);
              const canCancelCdc = cdcStatus.eligible;
              const blockedActiveOrder = !cdcStatus.eligible && order.status === 'ATIVO';

              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-white/15 bg-[var(--bg-elevated)] p-5 shadow-xl sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <img
                        src={order.posterSrc}
                        alt={order.movieTitle}
                        className="h-24 w-16 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono-tabular text-xs font-bold text-[var(--text-muted)]">
                            {order.id}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                              order.status === 'ATIVO'
                                ? 'bg-[var(--success-emerald)]/20 text-[#6EE7B7]'
                                : order.status === 'CANCELADO'
                                  ? 'bg-rose-500/20 text-rose-200'
                                  : 'bg-white/10 text-[var(--text-secondary)]'
                            }`}
                          >
                            {order.status}
                          </span>
                          <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white">
                            {order.format}
                          </span>
                          {order.orderKind === 'canteen-only' && (
                            <span className="rounded bg-[var(--amber-progress)]/20 px-2 py-0.5 text-[11px] font-semibold text-[#FCD34D]">
                              Somente Cantina
                            </span>
                          )}
                        </div>

                        <h2 className="font-display line-clamp-2 break-words text-2xl font-extrabold uppercase text-white">
                          {order.movieTitle}
                        </h2>

                        <p className="text-xs text-[var(--text-secondary)]">
                          {order.complex} · {order.room} · {order.dateLabel} às{' '}
                          <strong className="font-mono-tabular text-white">{order.time}</strong>
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          {order.seatsLabel.length > 0 && (
                            <span className="font-mono-tabular rounded border border-white/15 bg-black/35 px-2.5 py-1 font-semibold text-white">
                              Assentos: {order.seatsLabel.join(', ')}
                            </span>
                          )}
                          <span className="font-mono-tabular rounded border border-white/15 bg-black/35 px-2.5 py-1 font-semibold text-white">
                            Total: R$ {order.totalAmount} ({order.paymentMethod.toUpperCase()})
                          </span>
                          {order.meiaCategory && (
                            <span className="font-mono-tabular rounded border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
                              Meia ({order.meiaCategory}
                              {order.meiaDoc ? ` · ${order.meiaDoc}` : ''})
                            </span>
                          )}
                        </div>

                        {/* Individual Seat QR tokens (or pickup QR) */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {order.seatQrTokens && order.seatQrTokens.length > 0 ? (
                            order.seatQrTokens.map((st) => (
                              <span
                                key={st.qrToken}
                                className="font-mono-tabular inline-flex items-center gap-1 rounded border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] text-[var(--text-secondary)]"
                              >
                                <QrCode className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
                                <span>
                                  {st.seatId}: {st.qrToken}
                                </span>
                              </span>
                            ))
                          ) : (
                            <span className="font-mono-tabular inline-flex items-center gap-1 rounded border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
                              <QrCode className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
                              {order.qrToken}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Action & Canteen Status Column (RN-02: sem bypass no cliente) */}
                    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 lg:w-[320px] lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                      {order.canteenSummary && (
                        <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 font-bold text-[var(--amber-progress)]">
                              <Popcorn className="h-3.5 w-3.5" aria-hidden="true" />
                              Cantina ({order.deliveryMode === 'seat' ? 'Assento' : 'Balcão'})
                            </span>
                            <span className="font-mono-tabular text-[10px] font-semibold text-[var(--text-muted)]">
                              {order.canteenStatus}
                            </span>
                          </div>
                          <p className="mt-1 text-white">{order.canteenSummary}</p>
                          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                            {CANTEEN_STATUS_LABEL[order.canteenStatus]}
                          </p>
                        </div>
                      )}

                      {/* CDC Cancellation (RF-12 / RN-04: 7 dias da compra + >= 2h da sessão) */}
                      {canCancelCdc && (
                        <button
                          type="button"
                          onClick={() => setCancelTarget(order)}
                          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-rose-400/50 bg-rose-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-200 transition-colors hover:bg-rose-500/20"
                        >
                          <Ban className="h-4 w-4" aria-hidden="true" />
                          <span>Cancelar Pedido (CDC · {order.hoursUntilSession}h)</span>
                        </button>
                      )}

                      {blockedActiveOrder && (
                        <div className="rounded-lg border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/10 p-2.5 text-[11px] text-[#FDE68A]">
                          <p className="flex items-center gap-1.5 font-bold uppercase">
                            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {cdcStatus.reason ?? 'Cancelamento online indisponível'}
                          </p>
                          <p className="mt-0.5 text-[var(--text-secondary)]">
                            {order.hoursUntilSession < 2
                              ? `Falta menos de 2h (${Math.round(order.hoursUntilSession * 60)} min). Cancelamento online indisponível.`
                              : 'Fora da janela elegível do CDC (Art. 49) para cancelamento digital.'}
                          </p>
                        </div>
                      )}

                      {order.status === 'CANCELADO' && order.refundIdempotencyKey && (
                        <p className="font-mono-tabular text-[11px] text-rose-200">
                          Estorno idempotente concluído · {order.refundIdempotencyKey}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* Tab Panel 2: Post-session Rating CRUD (RF-13) */}
      {activeTab === 'reviews' && (
        <div role="tabpanel" aria-label="Avaliação Pós-Sessão" className="mt-6 space-y-4">
          {userOrders.filter((o) => o.orderKind !== 'canteen-only').map((order) => {
            const eligible = order.checkedIn && order.sessionEnded && order.status !== 'CANCELADO';
            const isEditing = editingReviewOrderId === order.id;
            const hasSavedReview = typeof order.rating === 'number' && order.rating > 0;
            const currentDraftRating = draftRatings[order.id] ?? order.rating ?? 0;
            const currentDraftComment = draftComments[order.id] ?? order.reviewComment ?? '';

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-white/15 bg-[var(--bg-elevated)] p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
                      {order.id} · {order.dateLabel}
                    </span>
                    <h2 className="font-display text-2xl font-extrabold uppercase text-white">
                      {order.movieTitle}
                    </h2>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                      eligible
                        ? 'bg-[var(--success-emerald)]/20 text-[#6EE7B7]'
                        : 'bg-white/10 text-[var(--text-muted)]'
                    }`}
                  >
                    {eligible
                      ? 'Entrada Validada · Elegível'
                      : order.status === 'CANCELADO'
                        ? 'Pedido Cancelado'
                        : 'Aguardando Check-in & Fim da Sessão'}
                  </span>
                </div>

                {!eligible ? (
                  <p className="mt-3 text-xs text-[var(--text-secondary)]">
                    Pela regra <strong>RF-13</strong>, a avaliação de 1 a 5 estrelas só é liberada após a leitura do QR Code na portaria e encerramento da sessão (para pedidos não cancelados).
                  </p>
                ) : hasSavedReview && !isEditing ? (
                  <div className="mt-4 space-y-3 rounded-xl border border-[var(--success-emerald)]/40 bg-[var(--success-emerald)]/10 p-4 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 font-bold text-[#6EE7B7]">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Avaliação registrada: {order.rating}/5 estrelas
                      </p>
                      {order.reviewedAt && (
                        <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                          {order.reviewedAt}
                        </span>
                      )}
                    </div>
                    {order.reviewComment && (
                      <p className="text-white">&ldquo;{order.reviewComment}&rdquo;</p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDraftRatings((prev) => ({ ...prev, [order.id]: order.rating ?? 5 }));
                          setDraftComments((prev) => ({
                            ...prev,
                            [order.id]: order.reviewComment ?? '',
                          }));
                          setEditingReviewOrderId(order.id);
                        }}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-white/25 bg-black/30 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10"
                      >
                        <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Editar Avaliação</span>
                      </button>

                      {onDeleteReview && (
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteReview(order.id);
                            setDraftRatings((prev) => {
                              const next = { ...prev };
                              delete next[order.id];
                              return next;
                            });
                            setDraftComments((prev) => {
                              const next = { ...prev };
                              delete next[order.id];
                              return next;
                            });
                          }}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-rose-400/50 bg-rose-500/15 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-rose-200 hover:bg-rose-500/25"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Excluir Avaliação</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (currentDraftRating > 0) {
                        onSaveReview(order.id, currentDraftRating, currentDraftComment.trim());
                        setEditingReviewOrderId(null);
                      }
                    }}
                    className="mt-4 space-y-4 border-t border-white/10 pt-4"
                  >
                    <div>
                      <span className="block text-xs font-semibold text-white">
                        Sua nota para esta sessão (1 a 5 estrelas)
                      </span>
                      <div
                        role="radiogroup"
                        aria-label={`Nota para ${order.movieTitle}`}
                        className="mt-2 flex items-center gap-2"
                      >
                        {[1, 2, 3, 4, 5].map((starVal) => {
                          const selected = currentDraftRating >= starVal;
                          return (
                            <button
                              key={starVal}
                              type="button"
                              role="radio"
                              aria-checked={currentDraftRating === starVal}
                              aria-label={`${starVal} estrela${starVal > 1 ? 's' : ''}`}
                              onClick={() =>
                                setDraftRatings((prev) => ({ ...prev, [order.id]: starVal }))
                              }
                              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                                selected
                                  ? 'border-[var(--amber-progress)] bg-[var(--amber-progress)]/20 text-[var(--amber-progress)]'
                                  : 'border-white/15 bg-black/30 text-[var(--text-muted)] hover:text-white'
                              }`}
                            >
                              <Star
                                className={`h-5 w-5 ${selected ? 'fill-current' : ''}`}
                                aria-hidden="true"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`comment-${order.id}`} className="block text-xs font-semibold text-white">
                        Comentário opcional sobre som, projeção e entrega
                      </label>
                      <textarea
                        id={`comment-${order.id}`}
                        rows={2}
                        value={currentDraftComment}
                        onChange={(e) =>
                          setDraftComments((prev) => ({ ...prev, [order.id]: e.target.value }))
                        }
                        placeholder="Ex: Projeção IMAX impecável e entrega silenciosa pontual no assento."
                        className="mt-1.5 min-h-[44px] w-full rounded-lg border border-white/15 bg-black/45 px-3.5 py-2.5 text-base text-white placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)] sm:text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="submit"
                        disabled={currentDraftRating === 0}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--brand-red)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span>
                          {isEditing ? 'Salvar Alterações da Avaliação' : 'Enviar Avaliação Pós-Sessão'}
                        </span>
                      </button>

                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => setEditingReviewOrderId(null)}
                          className="inline-flex min-h-[44px] items-center rounded-lg border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-white"
                        >
                          Cancelar Edição
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab Panel 3: LGPD Data Subject Rights (RF-18 / #20) */}
      {activeTab === 'lgpd' && (
        <div
          role="tabpanel"
          aria-label="Gestão de Direitos LGPD"
          className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <form
            key={lgpdFormKey}
            noValidate
            onSubmit={handleLgpdSubmit}
            className="space-y-5 rounded-2xl border border-white/15 bg-[var(--bg-elevated)] p-6"
          >
            <div>
              <h2 className="font-display text-3xl font-extrabold uppercase text-white">
                Direitos do Titular (LGPD · Art. 18)
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                Registre solicitações de acesso, correção cadastral ou eliminação de dados dispensáveis com protocolo auditável (RF-18).
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {(['ACESSO', 'CORRECAO', 'ELIMINACAO'] as LgpdRequestType[]).map((type) => {
                const meta = LGPD_REQUEST_LABELS[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLgpdType(type)}
                    className={`min-h-[44px] rounded-xl border p-3 text-left transition-colors ${
                      lgpdType === type
                        ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/15'
                        : 'border-white/15 bg-black/30 hover:border-white/30'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">{meta.title}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{meta.desc}</p>
                  </button>
                );
              })}
            </div>

            <div>
              <label htmlFor="lgpd-details" className="block text-xs font-semibold text-white">
                Descrição da solicitação
              </label>
              <span id="lgpd-details-hint" className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                Mínimo 8 caracteres explicando o escopo da solicitação
              </span>
              <textarea
                id="lgpd-details"
                name="lgpdDetails"
                required
                minLength={8}
                rows={3}
                value={lgpdDetails}
                aria-invalid={lgpdErr}
                aria-describedby={lgpdErr ? 'lgpd-details-hint lgpd-details-err' : 'lgpd-details-hint'}
                onChange={(e) => {
                  setLgpdDetails(e.target.value);
                  if (lgpdErr && e.currentTarget.validity.valid) setLgpdErr(false);
                }}
                onBlur={(e) => setLgpdErr(!e.currentTarget.validity.valid)}
                placeholder="Ex: Solicito relatório completo ou eliminação dos dados dispensáveis."
                className="cine-input mt-1.5 min-h-[44px] w-full rounded-lg border border-white/15 bg-black/45 px-3.5 py-2.5 text-base text-white placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)] sm:text-sm"
              />
              <p id="lgpd-details-err" className="cine-error-msg mt-1 items-center gap-1.5 text-xs text-[#FCA5A5]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Descreva sua solicitação com pelo menos 8 caracteres.</span>
              </p>
            </div>

            <div className="rounded-xl border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/10 p-3.5 text-xs text-[#FDE68A]">
              <p className="font-bold uppercase tracking-wider">Regra de Conservação Legal Obrigatória</p>
              <p className="mt-1 text-[var(--text-secondary)]">
                Mesmo após pedidos de eliminação de dados dispensáveis, registros fiscais de ingressos pagos são conservados em formato segregado pelo prazo legal (CTN Art. 173).
              </p>
            </div>

            {lgpdSuccessProto && (
              <p role="status" className="flex items-center gap-2 text-xs font-semibold text-[#6EE7B7]">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{lgpdSuccessProto}</span>
              </p>
            )}

            <button
              type="submit"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)]"
            >
              <FileDown className="h-4 w-4" aria-hidden="true" />
              <span>Gerar Protocolo LGPD</span>
            </button>
          </form>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-[var(--bg-elevated)] p-6">
            <h3 className="font-display text-2xl font-bold uppercase text-white">
              Protocolos Registrados
            </h3>
            {lgpdRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-white/10 bg-black/35 p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono-tabular font-bold text-[var(--amber-progress)]">
                    {req.protocol}
                  </span>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {LGPD_REQUEST_LABELS[req.type]?.title ?? req.type} · {req.status}
                  </span>
                </div>
                <p className="mt-2 text-white">{req.details}</p>
                <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">{req.legalRetentionNote}</p>
                <p className="mt-2 text-[11px] text-[var(--text-secondary)]">Registrado em {req.createdAt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CDC Cancellation Confirmation Dialog (<dialog>) */}
      <dialog
        ref={cancelDialogRef}
        aria-label="Confirmar cancelamento CDC"
        onCancel={(e) => {
          e.preventDefault();
          setCancelTarget(null);
        }}
        className="m-auto w-[min(92vw,460px)] rounded-2xl border border-white/15 bg-[var(--bg-elevated)] p-6 text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        {cancelTarget && (
          <>
            <h2 className="font-display text-2xl font-extrabold uppercase text-white">
              Confirmar Cancelamento CDC
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              O pedido <strong className="text-white">{cancelTarget.id}</strong> ({cancelTarget.movieTitle}) está a{' '}
              <strong className="text-white">{cancelTarget.hoursUntilSession}h</strong> da sessão (dentro da janela ≥ 2h da RN-04 e 7 dias do CDC).
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/35 p-3.5 text-xs text-[var(--text-secondary)]">
              <p>
                Estorno integral simulado:{' '}
                <strong className="font-mono-tabular text-white">R$ {cancelTarget.totalAmount}</strong>
              </p>
              <p className="mt-1">
                {cancelTarget.seatsLabel.length > 0
                  ? `Os assentos ${cancelTarget.seatsLabel.join(', ')} e itens da cantina serão liberados.`
                  : 'Os itens reservados na cantina serão liberados.'}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="min-h-[44px] rounded-lg border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-white"
              >
                Manter Ingresso
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  onCancelOrder(cancelTarget.id);
                  setCancelTarget(null);
                }}
                className="min-h-[44px] rounded-lg bg-[var(--brand-red)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)]"
              >
                Confirmar Estorno Idempotente
              </button>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
