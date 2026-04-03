import type { SessionState } from '@/lib/api';
import { PanelShell } from './PanelShell';

interface LoadingViewProps {
  title: string;
  subtitle: string;
}

export function LoadingView({ title, subtitle }: LoadingViewProps) {
  return (
    <PanelShell>
      <p className="m-0 text-[11px] uppercase tracking-[0.09em] text-slate-500">swiftly.extension</p>
      <h1 className="mt-2 mb-2 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="m-0 text-sm text-slate-600">{subtitle}</p>
      <div className="mt-4 h-9 w-9 rounded-full border-[3px] border-green-300/30 border-t-green-600 animate-spin" aria-hidden="true" />
    </PanelShell>
  );
}

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
  onSignIn: () => void;
}

export function ErrorView({ message, onRetry, onSignIn }: ErrorViewProps) {
  return (
    <PanelShell>
      <p className="m-0 text-[11px] uppercase tracking-[0.09em] text-slate-500">swiftly.extension</p>
      <h1 className="mt-2 mb-2 text-2xl font-bold tracking-tight">Could not verify session</h1>
      <p className="m-0 text-sm text-slate-600">{message}</p>
      <div className="mt-4 flex gap-2">
        <button
          className="cursor-pointer rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-50"
          onClick={onRetry}
        >
          Retry
        </button>
        <button
          className="cursor-pointer rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-3 py-2 text-sm font-semibold text-white shadow-md"
          onClick={onSignIn}
        >
          Open Sign In
        </button>
      </div>
    </PanelShell>
  );
}

interface SignedOutViewProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export function SignedOutView({ onSignIn, onSignUp }: SignedOutViewProps) {
  return (
    <PanelShell>
      <p className="m-0 text-[11px] uppercase tracking-[0.09em] text-slate-500">swiftly.extension</p>
      <h1 className="mt-2 mb-2 text-2xl font-bold tracking-tight">Welcome to Swiftly</h1>
      <p className="m-0 text-sm text-slate-600">You are not signed in. Please continue in the website.</p>

      <div className="mt-4 grid gap-2">
        <button
          className="cursor-pointer rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-600"
          onClick={onSignIn}
        >
          Sign In
        </button>
        <button
          className="cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-green-500 hover:text-green-700"
          onClick={onSignUp}
        >
          Sign Up
        </button>
      </div>
    </PanelShell>
  );
}

interface SignedInViewProps {
  session: SessionState;
  onRefresh: () => void;
  onOpenDashboard: () => void;
}

export function SignedInView({ session, onRefresh, onOpenDashboard }: SignedInViewProps) {
  const displayName = session.profile?.fullName?.trim() || session.profile?.email || 'Swiftly user';
  const avatarChar = displayName.charAt(0).toUpperCase();

  const getResumeLabel = (resume: SessionState['resumes'][number]) => {
    const fullName = [resume.firstName, resume.middleName, resume.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (resume.title?.trim()) return resume.title.trim();
    if (fullName) return fullName;
    if (resume.resumeEmail?.trim()) return resume.resumeEmail.trim();
    return 'Untitled resume';
  };

  return (
    <PanelShell>
      <p className="m-0 text-[11px] uppercase tracking-[0.09em] text-slate-500">swiftly.extension</p>
      <h1 className="mt-2 mb-2 text-2xl font-bold tracking-tight">Welcome back</h1>

      <div className="mt-3 flex items-center gap-3 rounded-xl bg-green-100/70 p-2.5">
        {session.profile?.avatarUrl ? (
          <img
            className="h-11 w-11 rounded-full border-2 border-slate-200 object-cover"
            src={session.profile.avatarUrl}
            alt={displayName}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-900 text-lg font-bold text-white">{avatarChar}</div>
        )}

        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-bold text-slate-800">{displayName}</p>
          <p className="m-0 text-xs text-slate-600">{session.resumeCount} resume{session.resumeCount === 1 ? '' : 's'} linked</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="cursor-pointer rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-50"
          onClick={onRefresh}
        >
          Refresh
        </button>
        <button
          className="cursor-pointer rounded-xl bg-linear-to-r from-green-700 to-green-500 px-3 py-2 text-sm font-semibold text-white shadow-md"
          onClick={onOpenDashboard}
        >
          Open Dashboard
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Your resumes</p>
        {session.resumes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white/80 p-2.5 text-xs text-slate-600">
            No resumes found in this account.
          </div>
        ) : (
          session.resumes.slice(0, 6).map((resume) => (
            <article key={resume.id} className="rounded-lg border border-slate-200 bg-white/90 p-2.5">
              <p className="m-0 truncate text-sm font-semibold text-slate-800">{getResumeLabel(resume)}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                {resume.resumeEmail ? <span className="truncate">{resume.resumeEmail}</span> : null}
                {resume.linkedIn ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">has LinkedIn</span> : null}
              </div>
            </article>
          ))
        )}
      </div>
    </PanelShell>
  );
}
