interface StepperBarProps {
  current: 1 | 2 | 3 | 4;
}

const STEPS = [
  { num: 1, label: 'Escolha o Assento' },
  { num: 2, label: 'Cantina' },
  { num: 3, label: 'Pagamento' },
  { num: 4, label: 'Ingresso' },
] as const;

export function StepperBar({ current }: StepperBarProps) {
  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Etapas da compra">
      {STEPS.map((step) => {
        const active = step.num === current;
        const done = step.num < current;
        return (
          <li
            key={step.num}
            className={`flex items-center gap-2.5 border-b-2 pb-2.5 transition-colors ${
              active
                ? 'border-[var(--brand-red)] text-white'
                : done
                  ? 'border-white/40 text-[var(--text-secondary)]'
                  : 'border-white/10 text-[var(--text-muted)]'
            }`}
          >
            <span
              className={`font-mono-tabular flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold ${
                active
                  ? 'bg-white text-[#0D0E12]'
                  : done
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-[var(--text-muted)]'
              }`}
            >
              {step.num}
            </span>
            <span className="truncate text-[11px] font-bold uppercase tracking-[0.12em]">
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
