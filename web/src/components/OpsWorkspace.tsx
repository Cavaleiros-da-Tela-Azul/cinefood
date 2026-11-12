import React from 'react';
import {
  ArrowLeft,
  BarChart3,
  ChefHat,
  Lock,
  Moon,
  QrCode,
  Shield,
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
  STAFF_PROFILES,
  StaffRoleGroup,
} from '../data/cinemaData';
import { GateScannerView } from './GateScannerView';
import { BoxOfficeView } from './BoxOfficeView';
import { KdsRunnerView } from './KdsRunnerView';
import { AdminOccupancyView } from './AdminOccupancyView';

export type OpsTab = OpsModuleTab;

interface OpsWorkspaceProps {
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
  onValidateQr: (token: string) => {
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
}

const OPS_MODULES: {
  id: OpsTab;
  label: string;
  ownerGroup: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'gate', label: 'Portaria QR', ownerGroup: 'Portaria', badge: '#15', icon: QrCode },
  { id: 'boxoffice', label: 'Bilheteria', ownerGroup: 'Bilheteria', badge: '#10', icon: Ticket },
  { id: 'kds', label: 'Cantina KDS & Runner', ownerGroup: 'Cantina', badge: '#17', icon: ChefHat },
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
  onValidateQr,
  onEmitBoxOfficeOrder,
  onAdvanceCanteenStatus,
  onRegisterIncident,
  onUpdateSessionPrice,
  onAddSession,
}) => {
  const activeProfile =
    STAFF_PROFILES.find((p) => p.role === activeRole) ?? STAFF_PROFILES[STAFF_PROFILES.length - 1];

  const resolvedTab: OpsTab = activeProfile.allowedTabs.includes(activeTab)
    ? activeTab
    : activeProfile.defaultTab;

  return (
    <div className="min-h-dvh bg-[#090A0E] text-[#F5F6FA] flex flex-col lg:flex-row">
      {/* Dedicated Backstage CRM Sidebar — completely isolated from Consumer Header */}
      <aside className="lg:w-72 shrink-0 bg-[#0F1117] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between p-4 sm:p-5 space-y-5">
        <div className="space-y-5">
          {/* Backstage Identity */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#C40A14] flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div className="leading-tight">
                <p className="font-display text-xl font-extrabold tracking-wide text-white uppercase">
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
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-xs font-semibold text-white/80 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Loja Web
            </button>
          </div>

          {/* Active User Group / RBAC Role Switcher */}
          <div className="space-y-2">
            <label
              htmlFor="staff-role-select"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/70"
            >
              <UserCog className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              Grupo de Usuário (RBAC)
            </label>
            <select
              id="staff-role-select"
              value={activeRole}
              onChange={(e) => onChangeRole(e.target.value as StaffRoleGroup)}
              className="w-full rounded-lg bg-[#090A0E] border border-amber-400/35 px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-400"
            >
              {STAFF_PROFILES.map((p) => (
                <option key={p.role} value={p.role}>
                  {p.groupLabel} — {p.operatorName}
                </option>
              ))}
            </select>

            <div className="rounded-lg bg-[#090A0E] border border-white/10 p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-amber-300 font-bold">
                  {activeProfile.stationCode}
                </span>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                  ATIVO
                </span>
              </div>
              <p className="text-xs font-semibold text-white">{activeProfile.operatorName}</p>
              <p className="text-xs leading-relaxed text-white/70">
                {activeProfile.description}
              </p>
            </div>
          </div>

          {/* Role-Scoped Operational Modules */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
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
                    className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg border text-left text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      !allowed
                        ? 'bg-[#090A0E]/50 border-white/6 text-white/30 cursor-not-allowed'
                        : isSelected
                          ? 'bg-[#C40A14] border-[#C40A14] text-white cursor-pointer'
                          : 'bg-[#090A0E] border-white/12 text-white/75 hover:border-white/25 hover:text-white cursor-pointer'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {allowed ? (
                        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 shrink-0 text-white/30" aria-hidden="true" />
                      )}
                      <span>{mod.label}</span>
                    </span>
                    <span className="font-mono text-xs text-white/90">
                      {allowed ? mod.badge : mod.ownerGroup}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Backstage Controls (Desktop) */}
        <div className="hidden lg:flex flex-col gap-2 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onToggleOled}
            aria-pressed={oledMode}
            className={`w-full inline-flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${
              oledMode
                ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                : 'border-white/12 bg-[#090A0E] text-white/70 hover:text-white'
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
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-[0.1em] text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para Loja Web
          </button>
        </div>
      </aside>

      {/* Main Backstage Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Backstage Telemetry Bar */}
        <div className="border-b border-white/10 bg-[#0D0F14] px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="font-mono text-xs font-bold uppercase px-2.5 py-1 rounded bg-amber-500/15 border border-amber-400/35 text-amber-200">
              {activeProfile.groupLabel}
            </span>
            <span className="text-white/70">
              Operador: <strong className="text-white">{activeProfile.operatorName}</strong>
            </span>
            <span className="hidden sm:inline text-white/30">·</span>
            <span className="hidden sm:inline text-white/70">
              Escopo isolado em módulos autorizados para este grupo
            </span>
          </div>

          <span className="font-mono text-xs text-white/65">
            CineFood Backstage · Sessão RBAC Local
          </span>
        </div>

        {/* Active Station View */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full">
          {resolvedTab === 'gate' && (
            <GateScannerView
              orders={orders}
              scanLog={scanLog}
              onValidateQr={onValidateQr}
            />
          )}

          {resolvedTab === 'boxoffice' && (
            <BoxOfficeView
              movies={movies}
              canteenItems={canteenItems}
              onEmitBoxOfficeOrder={onEmitBoxOfficeOrder}
            />
          )}

          {resolvedTab === 'kds' && (
            <KdsRunnerView
              orders={orders}
              incidents={incidents}
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
            />
          )}
        </div>
      </div>
    </div>
  );
};
