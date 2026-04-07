import { useMemo, useState } from 'react';
import type { ResumeDetailRecord, SessionState } from '@/lib/api';
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
  onResumeSelect: (resumeId: string, resumeTitle: string) => void;
  selectedResumeId: string | null;
  selectedResumeTitle: string;
  selectedResumeDetail: ResumeDetailRecord | null;
  isDetailLoading: boolean;
  detailError: string | null;
  onAutofillSelectedResume: () => void;
  onRetryDetail: () => void;
}

type DetailSectionKey =
  | 'overview'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'achievements'
  | 'pors'
  | 'publications';

export function SignedInView({
  session,
  onRefresh,
  onOpenDashboard,
  onResumeSelect,
  selectedResumeId,
  selectedResumeTitle,
  selectedResumeDetail,
  isDetailLoading,
  detailError,
  onAutofillSelectedResume,
  onRetryDetail,
}: SignedInViewProps) {
  const displayName = session.profile?.fullName?.trim() || session.profile?.email || 'Swiftly user';
  const avatarChar = displayName.charAt(0).toUpperCase();
  const [activeSection, setActiveSection] = useState<DetailSectionKey>('overview');

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

  const sectionItems = useMemo(
    () => [
      { key: 'overview' as const, label: 'overview()' },
      { key: 'education' as const, label: 'education[]' },
      { key: 'experience' as const, label: 'experience[]' },
      { key: 'projects' as const, label: 'projects[]' },
      { key: 'skills' as const, label: 'skills[]' },
      { key: 'achievements' as const, label: 'achievements[]' },
      { key: 'pors' as const, label: 'pors[]' },
      { key: 'publications' as const, label: 'publications[]' },
    ],
    [],
  );

  const renderDetailSection = () => {
    if (!selectedResumeDetail) return null;

    if (activeSection === 'overview') {
      return (
        <div className="space-y-1 text-xs text-slate-700">
          <p><span className="font-semibold text-slate-900">Title:</span> {selectedResumeDetail.title || '-'}</p>
          <p><span className="font-semibold text-slate-900">Name:</span> {[selectedResumeDetail.firstName, selectedResumeDetail.middleName, selectedResumeDetail.lastName].filter(Boolean).join(' ') || '-'}</p>
          <p><span className="font-semibold text-slate-900">Email:</span> {selectedResumeDetail.resumeEmail || '-'}</p>
          <p><span className="font-semibold text-slate-900">Phone:</span> {selectedResumeDetail.phoneNumber || '-'}</p>
          <p><span className="font-semibold text-slate-900">Country:</span> {selectedResumeDetail.country || '-'}</p>
          <p><span className="font-semibold text-slate-900">Summary:</span> {selectedResumeDetail.summary || '-'}</p>
        </div>
      );
    }

    const mapToLines = (lines: string[]) => (
      <ul className="space-y-1 text-xs text-slate-700">
        {lines.map((line, index) => (
          <li key={`${line}-${index}`} className="rounded-md border border-slate-200 bg-white p-2">{line}</li>
        ))}
      </ul>
    );

    if (activeSection === 'education') {
      if (selectedResumeDetail.education.length === 0) return <p className="text-xs text-slate-500">No education entries.</p>;
      return mapToLines(
        selectedResumeDetail.education.map((i) => `${i.instituteName || '-'} | ${i.degree || '-'} | ${i.startDate || '-'} to ${i.endDate || '-'}`),
      );
    }

    if (activeSection === 'experience') {
      if (selectedResumeDetail.experience.length === 0) return <p className="text-xs text-slate-500">No experience entries.</p>;
      return mapToLines(
        selectedResumeDetail.experience.map((i) => `${i.companyName || '-'} | ${i.position || '-'} | ${i.startDate || '-'} to ${i.endDate || '-'}`),
      );
    }

    if (activeSection === 'projects') {
      if (selectedResumeDetail.projects.length === 0) return <p className="text-xs text-slate-500">No project entries.</p>;
      return mapToLines(
        selectedResumeDetail.projects.map((i) => `${i.projectName || '-'} | ${(i.techStack || []).join(', ') || '-'}${i.githubLink ? ` | ${i.githubLink}` : ''}`),
      );
    }

    if (activeSection === 'skills') {
      if (selectedResumeDetail.skills.length === 0) return <p className="text-xs text-slate-500">No skill entries.</p>;
      return mapToLines(selectedResumeDetail.skills.map((i) => `${i.name || '-'}${i.category ? ` | ${i.category}` : ''}`));
    }

    if (activeSection === 'achievements') {
      if (selectedResumeDetail.achievements.length === 0) return <p className="text-xs text-slate-500">No achievement entries.</p>;
      return mapToLines(
        selectedResumeDetail.achievements.map((i) => `${i.title || '-'}${i.org ? ` | ${i.org}` : ''}${i.date ? ` | ${i.date}` : ''}`),
      );
    }

    if (activeSection === 'pors') {
      if (selectedResumeDetail.pors.length === 0) return <p className="text-xs text-slate-500">No position of responsibility entries.</p>;
      return mapToLines(
        selectedResumeDetail.pors.map((i) => `${i.title || '-'}${i.org ? ` | ${i.org}` : ''} | ${i.startDate || '-'} to ${i.endDate || '-'}`),
      );
    }

    if (selectedResumeDetail.publications.length === 0) return <p className="text-xs text-slate-500">No publication entries.</p>;
    return mapToLines(
      selectedResumeDetail.publications.map((i) => `${i.title || '-'}${i.conference ? ` | ${i.conference}` : ''}${i.publicationDate ? ` | ${i.publicationDate}` : ''}`),
    );
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
            <button
              key={resume.id}
              type="button"
              onClick={() => {
                setActiveSection('overview');
                onResumeSelect(resume.id, getResumeLabel(resume));
              }}
              className={`w-full cursor-pointer rounded-lg border bg-white/90 p-2.5 text-left transition ${selectedResumeId === resume.id ? 'border-blue-500 ring-1 ring-blue-200' : 'border-slate-200 hover:border-blue-300'}`}
            >
              <p className="m-0 truncate text-sm font-semibold text-slate-800">{getResumeLabel(resume)}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                {resume.resumeEmail ? <span className="truncate">{resume.resumeEmail}</span> : null}
                {resume.linkedIn ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">has LinkedIn</span> : null}
              </div>
            </button>
          ))
        )}
      </div>

      {selectedResumeId ? (
        <div className="mt-4 space-y-2">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Resume details</p>
          <div className="rounded-lg border border-slate-200 bg-white/95 p-2.5">
            <div className="mb-2 rounded-md border border-blue-100 bg-blue-50 px-2 py-1.5">
              <p className="m-0 text-[11px] font-semibold text-blue-700">selectedResume()</p>
              <p className="m-0 mt-0.5 truncate text-xs text-slate-700">
                <span className="font-semibold">title:</span> {selectedResumeTitle || '-'}
              </p>
              <p className="m-0 truncate text-xs text-slate-600">
                <span className="font-semibold">id:</span> {selectedResumeId}
              </p>
              <button
                type="button"
                onClick={onAutofillSelectedResume}
                className="mt-2 cursor-pointer rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                autofill()
              </button>
            </div>
            {isDetailLoading ? (
              <p className="text-xs text-slate-500">Fetching selected resume details...</p>
            ) : detailError ? (
              <div className="space-y-2">
                <p className="text-xs text-red-600">{detailError}</p>
                <button
                  type="button"
                  onClick={onRetryDetail}
                  className="cursor-pointer rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-700"
                >
                  retryFetch()
                </button>
              </div>
            ) : selectedResumeDetail ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {sectionItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveSection(item.key)}
                      className={`cursor-pointer rounded-full border px-2 py-1 text-[11px] font-semibold ${activeSection === item.key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {renderDetailSection()}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Select a resume to view details.</p>
            )}
          </div>
        </div>
      ) : null}
    </PanelShell>
  );
}
