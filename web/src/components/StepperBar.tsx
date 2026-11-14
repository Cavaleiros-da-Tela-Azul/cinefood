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
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Etapas da compra">
      {STEPS.map((step) => {
        const active = step.num === current;
        const done = step.num < current;
        const badgeClass = `font-mono-tabular flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold ${
          active
            ? 'bg-white text-[#0D0E12]'
            : done
              ? 'bg-white/20 text-white'
              : 'bg-white/10 text-[var(--text-muted)]'
        }`;
        const borderClass = active
          ? 'border-[var(--brand-red)] text-white'
          : done
            ? 'border-white/40 text-[var(--text-secondary)]'
            : 'border-white/10 text-[var(--text-muted)]';

        return (
          <li
            key={step.num}
            aria-current={active ? 'step' : undefined}
            className={`flex items-center border-b-2 transition-colors ${borderClass} ${
              onStepClick ? '' : 'gap-2.5 pb-2.5'
            }`}
          >
            {onStepClick ? (
              <button
                type="button"
                onClick={() => onStepClick(step.num)}
                className="flex min-h-[44px] w-full items-center gap-2.5 rounded-md px-1 pb-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]"
              >
                <span className={badgeClass}>{step.num}</span>
                <span className="truncate text-[11px] font-bold uppercase tracking-[0.12em]">
                  {step.label}
                </span>
              </button>
            ) : (
              <>
                <span className={badgeClass}>{step.num}</span>
                <span className="truncate text-[11px] font-bold uppercase tracking-[0.12em]">
                  {step.label}
                </span>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
