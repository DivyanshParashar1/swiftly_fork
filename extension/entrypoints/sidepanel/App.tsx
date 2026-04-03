import { useEffect, useMemo, useState } from 'react';
import {
  fetchResumeById,
  resolveSessionState,
  type ResumeDetailRecord,
  type SessionState,
} from '@/lib/api';
import { ErrorView, LoadingView, SignedInView, SignedOutView } from '@/components/sidepanel/AuthViews';
import {
  clearSelectedResumeSnapshot,
  getSelectedResumeRawJson,
  getSelectedResumeSnapshot,
  setSelectedResumeSnapshot,
} from '@/lib/selectedResumeStore';

type ScreenState =
  | { status: 'loading' }
  | { status: 'ready'; session: SessionState }
  | { status: 'error'; message: string; fallbackWebBaseUrl: string };

const LOCAL_WEB_BASE_URL = 'http://localhost:3000';

export default function App() {
  const initialSelectedResume = getSelectedResumeSnapshot();

  const [screen, setScreen] = useState<ScreenState>({ status: 'loading' });
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(initialSelectedResume?.id || null);
  const [selectedResumeTitle, setSelectedResumeTitle] = useState<string>(initialSelectedResume?.title || '');
  const [selectedResumeDetail, setSelectedResumeDetail] = useState<ResumeDetailRecord | null>(initialSelectedResume?.detail || null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadSession = async () => {
    setScreen({ status: 'loading' });
    try {
      const session = await resolveSessionState();
      setScreen({ status: 'ready', session });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load session.';
      setScreen({ status: 'error', message, fallbackWebBaseUrl: LOCAL_WEB_BASE_URL });
    }
  };

  useEffect(() => {
    void loadSession();
  }, []);

  const webBaseUrl = useMemo(() => {
    if (screen.status === 'ready') return screen.session.webBaseUrl;
    if (screen.status === 'error') return screen.fallbackWebBaseUrl;
    return LOCAL_WEB_BASE_URL;
  }, [screen]);

  const openWebsite = async (path: '/signin' | '/signup' | '/dashboard') => {
    await chrome.tabs.create({ url: `${webBaseUrl}${path}` });
  };

  const loadResumeDetail = async (session: SessionState, resumeId: string, resumeTitle?: string) => {
    if (!session.apiBaseUrl) {
      setDetailError('Unable to resolve API base URL for resume details.');
      return;
    }

    setSelectedResumeId(resumeId);
    setSelectedResumeTitle((resumeTitle || '').trim() || 'Untitled resume');
    setSelectedResumeSnapshot({
      id: resumeId,
      title: (resumeTitle || '').trim() || 'Untitled resume',
      detail: null,
      rawResumeJson: null,
    });
    setDetailError(null);
    setIsDetailLoading(true);

    try {
      const result = await fetchResumeById(session.apiBaseUrl, resumeId);

      if (result.status === 401 || result.status === 403) {
        setDetailError('Session expired. Please sign in again.');
        setSelectedResumeDetail(null);
        clearSelectedResumeSnapshot();
        return;
      }

      if (!result.resume) {
        setDetailError('Could not load this resume.');
        setSelectedResumeDetail(null);
        return;
      }

      setSelectedResumeDetail(result.resume);
      const resolvedTitle = result.resume.title?.trim() || resumeTitle?.trim() || 'Untitled resume';
      setSelectedResumeTitle(resolvedTitle);
      setSelectedResumeSnapshot({
        id: resumeId,
        title: resolvedTitle,
        detail: result.resume,
        rawResumeJson: result.rawResumeJson,
      });
      console.log('Selected resume raw JSON:', getSelectedResumeRawJson());
    } catch {
      setDetailError('Failed to fetch resume details.');
      setSelectedResumeDetail(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  if (screen.status === 'loading') {
    return (
      <LoadingView
        title="Checking session..."
        subtitle="Looking for access and refresh token cookies."
      />
    );
  }

  if (screen.status === 'error') {
    return (
      <ErrorView
        message={screen.message}
        onRetry={() => void loadSession()}
        onSignIn={() => void openWebsite('/signin')}
      />
    );
  }

  const { session } = screen;

  if (!session.isAuthenticated) {
    return (
      <SignedOutView
        onSignIn={() => void openWebsite('/signin')}
        onSignUp={() => void openWebsite('/signup')}
      />
    );
  }

  return (
    <SignedInView
      session={session}
      onRefresh={() => void loadSession()}
      onOpenDashboard={() => void openWebsite('/dashboard')}
      onResumeSelect={(resumeId, resumeTitle) => void loadResumeDetail(session, resumeId, resumeTitle)}
      selectedResumeId={selectedResumeId}
      selectedResumeTitle={selectedResumeTitle}
      selectedResumeDetail={selectedResumeDetail}
      isDetailLoading={isDetailLoading}
      detailError={detailError}
      onRetryDetail={() => {
        if (selectedResumeId) {
          void loadResumeDetail(session, selectedResumeId, selectedResumeTitle);
        }
      }}
    />
  );
}