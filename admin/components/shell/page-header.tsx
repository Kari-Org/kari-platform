export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-subtle">{subtitle}</p> : null}
    </div>
  );
}

/** Placeholder for modules that arrive in a later admin phase. */
export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="rounded-card border border-dashed border-hairline p-10 text-center text-sm text-subtle">
        Arrives in {phase}.
      </div>
    </div>
  );
}
