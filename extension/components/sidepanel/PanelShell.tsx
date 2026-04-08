import type { PropsWithChildren, ReactNode } from 'react';

interface PanelShellProps extends PropsWithChildren {
  outside?: ReactNode;
}

export function PanelShell({ children, outside }: PanelShellProps) {
  return (
    <main className="min-h-screen p-4 bg-[radial-gradient(circle_at_20%_15%,rgba(59,130,246,0.17),transparent_42%),radial-gradient(circle_at_85%_85%,rgba(16,185,129,0.18),transparent_45%),linear-gradient(135deg,#f8fafc_0%,#eff6ff_100%)] text-slate-900">
      {outside ? <div className="mb-3">{outside}</div> : null}
      <section className="w-full rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-xl backdrop-blur">
        {children}
      </section>
    </main>
  );
}
