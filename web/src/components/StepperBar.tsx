import { Check } from 'lucide-react';

interface StepperBarProps {
  current: 1 | 2 | 3 | 4;
  onStepClick?: (step: 1 | 2 | 3 | 4) => void;
}

const STEPS = [
  { num: 1, label: 'Escolha o Assento' },
  { num: 2, label: 'Cantina' },
  { num: 3, label: 'Pagamento' },
  { num: 4, label: 'Ingresso' },
] as const;

export function StepperBar({ current, onStepClick }: StepperBarProps) {
  return (
    <ol
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3"
      aria-label="Etapas da compra"
    >
      {STEPS.map((step) => {
        const active = step.num === current;
        const done = step.num < current;

        const badgeClass = `font-mono-tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
          active
            ? 'bg-[var(--brand-red)] text-white shadow-[0_0_0_3px_rgba(196,10,20,0.28)]'
            : done
              ? 'bg-[var(--success-emerald)]/20 text-[#6EE7B7] border border-[var(--success-emerald)]/40'
              : 'bg-white/10 text-[var(--text-muted)]'
        }`;

        const cardClass = `rounded-xl border px-3 py-2.5 backdrop-blur-md transition-colors ${
          active
            ? 'border-[var(--brand-red)]/70 bg-[var(--bg-surface)]/85 text-white'
            : done
              ? 'border-white/15 bg-[var(--bg-elevated)]/70 text-[var(--text-secondary)]'
              : 'border-white/10 bg-[var(--bg-elevated)]/45 text-[var(--text-muted)]'
        }`;

        const barClass = `mt-2 h-[2px] w-full rounded-full ${
          active
            ? 'bg-[var(--brand-red)]'
            : done
              ? 'bg-[var(--success-emerald)]/60'
              : 'bg-white/10'
        }`;

        const inner = (
          <div className="w-full min-w-0">
            <div className="flex items-center gap-2.5">
              <span className={badgeClass}>
                {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : step.num}
              </span>
              <span className="truncate text-[11px] font-bold uppercase tracking-[0.11em]">
                {step.label}
              </span>
            </div>
            <div className={barClass} />
          </div>
        );

        return (
          <li key={step.num} aria-current={active ? 'step' : undefined} className="min-w-0">
            {onStepClick ? (
              <button
                type="button"
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
