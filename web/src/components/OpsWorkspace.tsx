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
      <div className="min-h-dvh bg-[var(--bg-base)] text-[var(--text-primary)] flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[var(--brand-red)] flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400">
                  Acesso Restrito · #/ops
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-[var(--text-primary)]">
                  CineFood Backstage · Login de Estação
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleOled}
                aria-pressed={oledMode}
                className="min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-[var(--focus-ring)] cursor-pointer"
              >
                {oledMode ? <Moon className="w-4 h-4 text-amber-300" /> : <Sun className="w-4 h-4" />}
                OLED {oledMode ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={onExitToStorefront}
                className="min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-[var(--focus-ring)] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Loja Web
              </button>
            </div>
          </div>

          <form onSubmit={handleConfirmStationLogin} className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)] flex items-center gap-2">
                <UserCog className="w-4 h-4 text-amber-400" aria-hidden="true" />
                1. Selecione a Estação / Papel RBAC
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className={`min-h-[44px] text-left rounded-xl border p-4 transition-colors focus-visible:outline-[var(--focus-ring)] cursor-pointer ${
                        selected
                          ? 'bg-[var(--brand-red)]/15 border-[var(--brand-red)] text-[var(--text-primary)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
                          {profile.stationCode}
                        </span>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                          {profile.role}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[var(--text-primary)] mt-1.5">
                        {profile.groupLabel}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Operador: <strong className="text-[var(--text-primary)]">{profile.operatorName}</strong>
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                        {profile.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-7 space-y-1.5">
                <label
                  htmlFor="ops-pin-input"
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
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
                  className="cine-input w-full min-h-[44px] rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] px-3.5 py-2.5 font-mono text-base sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                />
                <p className="text-xs text-[var(--text-muted)]">
                  Ambiente de demonstração: PIN pré-informado <span className="font-mono text-amber-300">{DEMO_OPS_PIN}</span>.
                </p>
              </div>

              <div className="md:col-span-5">
                <button
                  type="submit"
                  className="w-full min-h-[44px] px-5 py-3 rounded-lg bg-[var(--brand-red)] hover:bg-[var(--brand-red-hover)] text-white text-xs font-bold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Confirmar e Entrar na Estação
                </button>
              </div>
            </div>

            {gateError && (
              <div
                role="alert"
                className="rounded-lg bg-red-500/15 border border-red-400/45 px-4 py-3 text-xs text-red-200"
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
    <div className="min-h-dvh bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col lg:flex-row">
      {/* Dedicated Backstage CRM Sidebar — completely isolated from Consumer Header */}
      <aside className="lg:w-72 shrink-0 bg-[var(--bg-elevated)] border-b lg:border-b-0 lg:border-r border-[var(--border-subtle)] flex flex-col justify-between p-4 sm:p-5 space-y-5">
        <div className="space-y-5">
          {/* Backstage Identity */}
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[var(--brand-red)] flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div className="leading-tight">
                <p className="font-display text-xl font-extrabold tracking-wide text-[var(--text-primary)] uppercase">
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
              className="lg:hidden min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Loja Web
            </button>
          </div>

          {/* Active User Group / Station Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                <UserCog className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
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
                  className="w-full min-h-[44px] rounded-lg bg-[var(--bg-base)] border border-amber-400/35 px-3 py-2 text-base sm:text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                >
                  {STAFF_PROFILES.map((p) => (
                    <option key={p.role} value={p.role}>
                      {p.groupLabel} — {p.operatorName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-amber-300 font-bold">
                  {activeProfile.stationCode}
                </span>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
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
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-amber-400/35 bg-[var(--bg-surface)] hover:border-amber-300 text-xs font-bold uppercase tracking-[0.08em] text-amber-200 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
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
              className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 flex-nowrap"
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
                    className={`min-h-[44px] flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg border text-left text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      !allowed
                        ? 'bg-[var(--bg-base)]/50 border-[var(--border-subtle)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
                        : isSelected
                          ? 'bg-[var(--brand-red)] border-[var(--brand-red)] text-white cursor-pointer'
                          : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] cursor-pointer'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {allowed ? (
                        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
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
        <div className="hidden lg:flex flex-col gap-2 pt-4 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={onToggleOled}
            aria-pressed={oledMode}
            className={`w-full min-h-[44px] inline-flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${
              oledMode
                ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                : 'border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {oledMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              Sala Escura OLED
            </span>
            <span className="font-mono text-xs">{oledMode ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={onExitToStorefront}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-primary)] transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para Loja Web
          </button>
        </div>
      </aside>

      {/* Main Backstage Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Backstage Telemetry Bar */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="font-mono text-xs font-bold uppercase px-2.5 py-1 rounded bg-amber-500/15 border border-amber-400/35 text-amber-200">
              {activeProfile.groupLabel}
            </span>
            <span className="text-[var(--text-secondary)]">
              Operador: <strong className="text-[var(--text-primary)]">{activeProfile.operatorName}</strong>
            </span>
            <span className="hidden sm:inline text-[var(--text-muted)]">·</span>
            <span className="hidden sm:inline text-[var(--text-secondary)]">
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
