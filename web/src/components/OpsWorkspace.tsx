import React, { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  ChefHat,
  KeyRound,
  Lock,
  LogOut,
  Moon,
  QrCode,
  Shield,
  ShieldCheck,
  Sun,
  Ticket,
  UserCog,
} from 'lucide-react';
import {
  CanteenItem,
  CanteenOrderStatus,
  ClientTicketOrder,
  GateScanRecord,
  MovieItem,
  OpsModuleTab,
  RunnerIncident,
  SessionSlot,
  SessionStatus,
  STAFF_PROFILES,
  StaffRoleGroup,
} from '../data/cinemaData';
import { GateScannerView } from './GateScannerView';
import { BoxOfficeView } from './BoxOfficeView';
import { KdsRunnerView } from './KdsRunnerView';
import { AdminOccupancyView } from './AdminOccupancyView';

export type OpsTab = OpsModuleTab;

export interface OpsWorkspaceProps {
  activeRole: StaffRoleGroup;
  onChangeRole: (role: StaffRoleGroup) => void;
  activeTab: OpsTab;
  onTabChange: (tab: OpsTab) => void;
  oledMode: boolean;
  onToggleOled: () => void;
  onExitToStorefront: () => void;
  orders: ClientTicketOrder[];
  movies: MovieItem[];
  canteenItems: CanteenItem[];
  scanLog: GateScanRecord[];
  incidents: RunnerIncident[];
  occupiedBySession?: Record<string, string[]>;
  opsAuthenticated?: boolean;
  onAuthenticateOps?: (role: StaffRoleGroup, pin: string) => void;
  onLogoutOps?: () => void;
  onValidateQr: (
    token: string,
    expectedSessionId?: string,
  ) => {
    outcome: GateScanRecord['outcome'];
    title: string;
    detail: string;
    order?: ClientTicketOrder;
    triggeredKitchenPrep: boolean;
  };
  onEmitBoxOfficeOrder: (order: ClientTicketOrder) => void;
  onAdvanceCanteenStatus: (orderId: string, nextStatus: CanteenOrderStatus) => void;
  onRegisterIncident: (incident: Omit<RunnerIncident, 'id' | 'createdAt' | 'operator'>) => void;
  onUpdateSessionPrice: (movieId: string, sessionId: string, newPrice: number) => void;
  onAddSession: (movieId: string, slot: SessionSlot) => void;
  onToggleSessionStatus?: (movieId: string, sessionId: string, status: SessionStatus) => void;
  onUpdateCanteenStock?: (itemId: string, stock: number) => void;
}

const DEMO_OPS_PIN = '1234';

const OPS_MODULES: {
  id: OpsTab;
  label: string;
  ownerGroup: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'gate', label: 'Portaria QR', ownerGroup: 'Portaria', badge: '#15', icon: QrCode },
  { id: 'boxoffice', label: 'Bilheteria', ownerGroup: 'Gerência', badge: '#10', icon: Ticket },
  { id: 'kds', label: 'Cantina KDS & Runner', ownerGroup: 'Cantina / Runner', badge: '#17', icon: ChefHat },
  { id: 'admin', label: 'Painel Admin', ownerGroup: 'Gerência', badge: '#18', icon: BarChart3 },
];

export const OpsWorkspace: React.FC<OpsWorkspaceProps> = ({
  activeRole,
  onChangeRole,
  activeTab,
  onTabChange,
  oledMode,
  onToggleOled,
  onExitToStorefront,
  orders,
  movies,
  canteenItems,
  scanLog,
  incidents,
  occupiedBySession,
  opsAuthenticated,
  onAuthenticateOps,
  onLogoutOps,
  onValidateQr,
  onEmitBoxOfficeOrder,
  onAdvanceCanteenStatus,
  onRegisterIncident,
  onUpdateSessionPrice,
  onAddSession,
  onToggleSessionStatus,
  onUpdateCanteenStock,
}) => {
  const [unlockedRole, setUnlockedRole] = useState<StaffRoleGroup | null>(null);
  const [gateSelectedRole, setGateSelectedRole] = useState<StaffRoleGroup>(
    STAFF_PROFILES.some((p) => p.role === activeRole) ? activeRole : 'OPERADOR_PORTARIA',
  );
  const [pinInput, setPinInput] = useState(DEMO_OPS_PIN);
  const [gateError, setGateError] = useState<string | null>(null);

  const isAuthenticated =
    opsAuthenticated !== undefined ? opsAuthenticated : unlockedRole !== null;

  const effectiveRole: StaffRoleGroup =
    opsAuthenticated !== undefined
      ? activeRole
      : unlockedRole ?? activeRole;

  const activeProfile =
    STAFF_PROFILES.find((p) => p.role === effectiveRole) ?? STAFF_PROFILES[0];

  const resolvedTab: OpsTab = activeProfile.allowedTabs.includes(activeTab)
    ? activeTab
    : activeProfile.defaultTab;

  const handleConfirmStationLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPin = pinInput.trim();
    if (trimmedPin.length < 4 || trimmedPin !== DEMO_OPS_PIN) {
      setGateError(
        `Crachá ou PIN operacional inválido. Utilize o PIN de homologação ${DEMO_OPS_PIN}.`,
      );
      return;
    }

    const chosenProfile =
      STAFF_PROFILES.find((p) => p.role === gateSelectedRole) ?? STAFF_PROFILES[0];
    setGateError(null);
    setUnlockedRole(chosenProfile.role);
    onChangeRole(chosenProfile.role);
    onTabChange(chosenProfile.defaultTab);
    onAuthenticateOps?.(chosenProfile.role, trimmedPin);
  };

  const handleEndShift = () => {
    setUnlockedRole(null);
    setGateSelectedRole(effectiveRole);
    setPinInput(DEMO_OPS_PIN);
    setGateError(null);
    onLogoutOps?.();
  };

  if (!isAuthenticated) {
    const selectedGateProfile =
      STAFF_PROFILES.find((p) => p.role === gateSelectedRole) ?? STAFF_PROFILES[0];

    return (
      <div className="relative flex min-h-dvh items-center justify-center overflow-x-clip bg-[var(--bg-base)] p-4 text-[var(--text-primary)] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(196,10,20,0.16),transparent_48%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.10),transparent_48%)]" />
        </div>

        <div className="relative z-10 w-full max-w-4xl space-y-6 rounded-3xl border border-white/12 bg-[var(--bg-elevated)]/92 p-5 shadow-2xl backdrop-blur-md sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-red)] shadow-lg shadow-red-900/30">
                <Shield className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400">
                  Acesso Restrito · #/ops
                </p>
                <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-[var(--text-primary)] sm:text-3xl">
                  CineFood Backstage · Login de Estação
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleOled}
                aria-pressed={oledMode}
                className="cine-press inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-[var(--focus-ring)]"
              >
                {oledMode ? <Moon className="h-4 w-4 text-amber-300" /> : <Sun className="h-4 w-4" />}
                OLED {oledMode ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={onExitToStorefront}
                className="cine-press inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-[var(--focus-ring)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Loja Web
              </button>
            </div>
          </div>

          <form onSubmit={handleConfirmStationLogin} className="space-y-6">
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                <UserCog className="h-4 w-4 text-amber-400" aria-hidden="true" />
                1. Selecione a Estação / Papel RBAC
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {STAFF_PROFILES.map((profile) => {
                  const selected = gateSelectedRole === profile.role;
                  return (
                    <button
                      key={profile.role}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setGateSelectedRole(profile.role);
                        setGateError(null);
                      }}
                      className={`cine-press min-h-[44px] cursor-pointer rounded-2xl border p-4 text-left transition-colors focus-visible:outline-[var(--focus-ring)] ${
                        selected
                          ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/15 text-[var(--text-primary)] shadow-md'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
                          {profile.stationCode}
                        </span>
                        <span className="font-mono rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-0.5 text-[11px] text-[var(--text-secondary)]">
                          {profile.role}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-[var(--text-primary)]">
                        {profile.groupLabel}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                        Operador: <strong className="text-[var(--text-primary)]">{profile.operatorName}</strong>
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
                        {profile.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 items-end gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 md:grid-cols-12">
              <div className="space-y-1.5 md:col-span-7">
                <label
                  htmlFor="ops-pin-input"
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
                >
                  <KeyRound className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                  2. PIN / Crachá da Estação ({selectedGateProfile.operatorName})
                </label>
                <input
                  id="ops-pin-input"
                  type="password"
                  inputMode="numeric"
                  required
                  minLength={4}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (gateError) setGateError(null);
                  }}
                  placeholder={`Digite o PIN (demo: ${DEMO_OPS_PIN})`}
                  className="cine-input min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3.5 py-2.5 font-mono text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-sm"
                />
                <p className="text-xs text-[var(--text-muted)]">
                  Ambiente de demonstração: PIN pré-informado <span className="font-mono text-amber-300">{DEMO_OPS_PIN}</span>.
                </p>
              </div>

              <div className="md:col-span-5">
                <button
                  type="submit"
                  className="cine-press inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg transition hover:bg-[var(--brand-red-hover)]"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Confirmar e Entrar na Estação
                </button>
              </div>
            </div>

            {gateError && (
              <div
                role="alert"
                className="rounded-xl border border-red-400/45 bg-red-500/15 px-4 py-3 text-xs text-red-200"
              >
                {gateError}
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg-base)] text-[var(--text-primary)] lg:flex-row">
      {/* Dedicated Backstage CRM Sidebar — completely isolated from Consumer Header */}
      <aside className="flex shrink-0 flex-col justify-between space-y-5 border-b border-white/10 bg-[var(--bg-elevated)]/95 p-4 backdrop-blur-md sm:p-5 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="space-y-5">
          {/* Backstage Identity */}
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-red)] shadow-md">
                <Shield className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div className="leading-tight">
                <p className="font-display text-xl font-extrabold uppercase tracking-wide text-[var(--text-primary)]">
                  CINEFOOD
                </p>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber-400">
                  Backstage CRM · Ops
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onExitToStorefront}
              className="cine-press inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] lg:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Loja Web
            </button>
          </div>

          {/* Active User Group / Station Card */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                <UserCog className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                Estação Autenticada
              </span>
            </div>

            {effectiveRole === 'ADMIN_CINEMA' && (
              <div>
                <label htmlFor="staff-role-select" className="sr-only">
                  Grupo de Usuário (RBAC)
                </label>
                <select
                  id="staff-role-select"
                  value={effectiveRole}
                  onChange={(e) => {
                    const nextRole = e.target.value as StaffRoleGroup;
                    setUnlockedRole(nextRole);
                    onChangeRole(nextRole);
                    const nextProf = STAFF_PROFILES.find((p) => p.role === nextRole);
                    if (nextProf) onTabChange(nextProf.defaultTab);
                  }}
                  className="min-h-[44px] w-full rounded-xl border border-amber-400/35 bg-[var(--bg-base)] px-3 py-2 text-base font-semibold text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs"
                >
                  {STAFF_PROFILES.map((p) => (
                    <option key={p.role} value={p.role}>
                      {p.groupLabel} — {p.operatorName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/90 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
                  {activeProfile.stationCode}
                </span>
                <span className="font-mono rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  ATIVO
                </span>
              </div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                {activeProfile.operatorName}
              </p>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {activeProfile.description}
              </p>
            </div>

            <button
              type="button"
              onClick={handleEndShift}
              className="cine-press inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-400/35 bg-[var(--bg-surface)] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-amber-200 transition hover:border-amber-300"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Encerrar Turno / Trocar Estação
            </button>
          </div>

          {/* Role-Scoped Operational Modules */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Módulos por Permissão
            </p>
            <div
              role="tablist"
              aria-label="Módulos do CineFood Backstage"
              className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
            >
              {OPS_MODULES.map((mod) => {
                const Icon = mod.icon;
                const allowed = activeProfile.allowedTabs.includes(mod.id);
                const isSelected = resolvedTab === mod.id;

                return (
                  <button
                    key={mod.id}
                    type="button"
                    role="tab"
                    disabled={!allowed}
                    aria-selected={isSelected}
                    title={
                      allowed
                        ? `Abrir ${mod.label}`
                        : `Acesso restrito ao grupo ${mod.ownerGroup} ou Admin`
                    }
                    onClick={() => allowed && onTabChange(mod.id)}
                    className={`cine-press flex min-h-[44px] shrink-0 items-center justify-between gap-2.5 whitespace-nowrap rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                      !allowed
                        ? 'cursor-not-allowed border-[var(--border-subtle)] bg-[var(--bg-base)]/50 text-[var(--text-muted)] opacity-50'
                        : isSelected
                          ? 'cursor-pointer border-[var(--brand-red)] bg-[var(--brand-red)] text-white shadow-md'
                          : 'cursor-pointer border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {allowed ? (
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                      )}
                      <span>{mod.label}</span>
                    </span>
                    <span className="font-mono text-xs opacity-90">
                      {allowed ? mod.badge : mod.ownerGroup}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Backstage Controls (Desktop) */}
        <div className="hidden flex-col gap-2 border-t border-[var(--border-subtle)] pt-4 lg:flex">
          <button
            type="button"
            onClick={onToggleOled}
            aria-pressed={oledMode}
            className={`cine-press inline-flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold ${
              oledMode
                ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                : 'border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {oledMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              Sala Escura OLED
            </span>
            <span className="font-mono text-xs">{oledMode ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={onExitToStorefront}
            className="cine-press inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Voltar para Loja Web
          </button>
        </div>
      </aside>

      {/* Main Backstage Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Backstage Telemetry Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[var(--bg-elevated)]/90 px-4 py-3.5 backdrop-blur-md sm:px-8">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="font-mono rounded-full border border-amber-400/35 bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase text-amber-200">
              {activeProfile.groupLabel}
            </span>
            <span className="text-[var(--text-secondary)]">
              Operador:{' '}
              <strong className="text-[var(--text-primary)]">{activeProfile.operatorName}</strong>
            </span>
            <span className="hidden text-[var(--text-muted)] sm:inline">·</span>
            <span className="hidden text-[var(--text-secondary)] sm:inline">
              Escopo isolado em módulos autorizados para este grupo
            </span>
          </div>

          <span className="font-mono text-xs text-[var(--text-muted)]">
            CineFood Backstage · Sessão RBAC ({effectiveRole})
          </span>
        </div>

        {/* Active Station View */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full">
          {resolvedTab === 'gate' && (
            <GateScannerView
              orders={orders}
              movies={movies}
              scanLog={scanLog}
              onValidateQr={onValidateQr}
            />
          )}

          {resolvedTab === 'boxoffice' && (
            <BoxOfficeView
              movies={movies}
              canteenItems={canteenItems}
              orders={orders}
              occupiedBySession={occupiedBySession}
              operatorName={activeProfile.operatorName}
              onEmitBoxOfficeOrder={onEmitBoxOfficeOrder}
            />
          )}

          {resolvedTab === 'kds' && (
            <KdsRunnerView
              orders={orders}
              incidents={incidents}
              staffRole={effectiveRole}
              onAdvanceCanteenStatus={onAdvanceCanteenStatus}
              onRegisterIncident={onRegisterIncident}
            />
          )}

          {resolvedTab === 'admin' && (
            <AdminOccupancyView
              movies={movies}
              canteenItems={canteenItems}
              orders={orders}
              onUpdateSessionPrice={onUpdateSessionPrice}
              onAddSession={onAddSession}
              onToggleSessionStatus={onToggleSessionStatus}
              onUpdateCanteenStock={onUpdateCanteenStock}
            />
          )}
        </div>
      </div>
    </div>
  );
};
