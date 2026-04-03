import { useEffect, useMemo, useState } from 'react';
import { resolveSessionState, type SessionState } from '@/lib/api';
import { ErrorView, LoadingView, SignedInView, SignedOutView } from '@/components/sidepanel/AuthViews';

type ScreenState =
  | { status: 'loading' }
  | { status: 'ready'; session: SessionState }
  | { status: 'error'; message: string; fallbackWebBaseUrl: string };

const LOCAL_WEB_BASE_URL = 'http://localhost:3000';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>({ status: 'loading' });

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
    />
  );
}