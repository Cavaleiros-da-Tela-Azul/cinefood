import { Check } from 'lucide-react';

interface StepperBarProps {
  current: 1 | 2 | 3 | 4;
  mode?: 'ticket' | 'canteen';
  onStepClick?: (step: 1 | 2 | 3) => void;
}

const TICKET_STEPS = [
  { num: 1, label: 'Escolha o Assento' },
  { num: 2, label: 'Pagamento Ingresso' },
  { num: 3, label: 'Ingresso Digital' },
] as const;

const CANTEEN_STEPS = [
  { num: 1, label: 'Cardápio Cantina' },
  { num: 2, label: 'Pagamento Cantina' },
  { num: 3, label: 'Pedido Cantina' },
] as const;

export function StepperBar({ current, mode = 'ticket', onStepClick }: StepperBarProps) {
  const normalizedCurrent = current === 4 ? 3 : current;
  const steps = mode === 'canteen' ? CANTEEN_STEPS : TICKET_STEPS;

  return (
    <ol
      className="flex items-center gap-1.5 sm:grid sm:grid-cols-3 sm:gap-3"
      aria-label="Etapas da compra"
    >
      {steps.map((step) => {
        const active = step.num === normalizedCurrent;
        const done = step.num < normalizedCurrent;

        const badgeClass = `font-mono-tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
          active
            ? 'bg-[var(--brand-red)] text-white shadow-[0_0_0_3px_rgba(196,10,20,0.28)]'
            : done
              ? 'bg-[var(--success-emerald)]/20 text-[#6EE7B7] border border-[var(--success-emerald)]/40'
              : 'bg-white/10 text-[var(--text-muted)]'
        }`;

        const cardClass = `rounded-xl border py-2 backdrop-blur-md transition-colors sm:px-3 sm:py-2.5 ${
          active ? 'px-3' : 'px-2.5'
        } ${
          active
            ? 'border-[var(--brand-red)]/70 bg-[var(--bg-surface)]/85 text-white'
            : done
              ? 'border-white/15 bg-[var(--bg-elevated)]/70 text-[var(--text-secondary)]'
              : 'border-white/10 bg-[var(--bg-elevated)]/45 text-[var(--text-muted)]'
        }`;

        const barClass = `mt-1.5 h-[2px] w-full rounded-full sm:mt-2 ${
          active
            ? 'bg-[var(--brand-red)]'
            : done
              ? 'bg-[var(--success-emerald)]/60'
              : 'bg-white/10'
        }`;

        const inner = (
          <div className="w-full min-w-0">
            <div className={`flex items-center gap-2 sm:justify-start sm:gap-2.5 ${active ? 'justify-start' : 'justify-center'}`}>
              <span className={badgeClass}>
                {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : step.num}
              </span>
              <span
                className={`truncate text-[11px] font-bold uppercase tracking-[0.11em] ${
                  active ? 'inline' : 'hidden sm:inline'
                }`}
              >
                {step.label}
              </span>
            </div>
            <div className={barClass} />
          </div>
        );

        return (
          <li
            key={step.num}
            aria-current={active ? 'step' : undefined}
            className={active ? 'min-w-0 flex-1' : 'shrink-0 sm:min-w-0 sm:flex-1'}
          >
            {onStepClick ? (
              <button
                type="button"
                aria-label={step.label}
                onClick={() => onStepClick(step.num)}
                className={`cine-press flex min-h-[44px] w-full items-center text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA] ${cardClass}`}
              >
                {inner}
              </button>
            ) : (
              <div className={`flex min-h-[44px] items-center ${cardClass}`}>{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
