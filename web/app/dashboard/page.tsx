'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { ApiError, authApi, resumeApi, type ResumeRecord } from '@/lib/api';
import { clearAuthUser } from '@/lib/authSession';

export default function DashboardPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(null);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);

  const loadResumes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await resumeApi.fetchResumeForUser();
      setResumes(response.data || []);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        clearAuthUser();
        enqueueSnackbar('Please sign in to access dashboard', { variant: 'warning' });
        router.push('/signin');
        return;
      }

      if (error instanceof ApiError) {
        enqueueSnackbar(error.message, { variant: 'error' });
      } else {
        enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [enqueueSnackbar, router]);

  useEffect(() => {
    void loadResumes();
  }, [loadResumes]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
      clearAuthUser();
      window.postMessage({ type: 'USER_LOGGED_OUT' }, '*');
      enqueueSnackbar('Logged out successfully', { variant: 'success' });
      router.push('/signin');
    } catch (error) {
      if (error instanceof ApiError) {
        enqueueSnackbar(error.message, { variant: 'error' });
      } else {
        enqueueSnackbar('Logout failed. Try again.', { variant: 'error' });
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    const shouldDelete = window.confirm('Delete this resume permanently?');
    if (!shouldDelete) return;

    setDeletingResumeId(resumeId);
    try {
      await resumeApi.deleteResumeById(resumeId);
      setResumes((prev) => prev.filter((item) => item.id !== resumeId));
      enqueueSnackbar('Resume deleted successfully', { variant: 'success' });
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        clearAuthUser();
        enqueueSnackbar('Please sign in again', { variant: 'warning' });
        router.push('/signin');
        return;
      }

      if (error instanceof ApiError) {
        enqueueSnackbar(error.message, { variant: 'error' });
      } else {
        enqueueSnackbar('Failed to delete resume', { variant: 'error' });
      }
    } finally {
      setDeletingResumeId(null);
    }
  };

  const resumeCountLabel = useMemo(() => {
    if (resumes.length === 0) return '0 resumes';
    if (resumes.length === 1) return '1 resume';
    return `${resumes.length} resumes`;
  }, [resumes.length]);

  return (
    <main className="min-h-screen pt-24 pb-12 bg-linear-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
      <div className="absolute top-20 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-56 h-56 bg-red-500/10 rounded-2xl rotate-45 blur-2xl"></div>
      <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-green-500/10 rounded-full blur-2xl"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10 space-y-8">
        <section className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-gray-200/50 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                <span className="font-mono text-blue-600">{'<'}</span>
                Dashboard
                <span className="font-mono text-blue-600">{'/>'}</span>
              </h1>
              <p className="text-gray-600 mt-2">
                Session active. <span className="font-mono text-gray-900">{resumeCountLabel}</span> in your database.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/upload-resume"
                className="px-5 py-2 bg-black text-white rounded-lg hover:bg-blue-600 transition-all font-mono text-sm shadow-md hover:shadow-blue-500/50 border-2 border-black hover:border-blue-600"
              >
                <span className="text-green-400 mr-1">$</span>
                uploadResume()
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-5 py-2 bg-white text-gray-900 rounded-lg hover:text-red-600 hover:border-red-500 transition-all font-mono text-sm border-2 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? 'loggingOut...' : 'logout()'}
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-gray-200/50 p-6 md:p-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Resumes</h2>
            <button
              type="button"
              onClick={() => void loadResumes()}
              className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors font-mono text-sm border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50"
            >
              refresh()
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <div className="h-20 rounded-xl bg-gray-100 animate-pulse"></div>
              <div className="h-20 rounded-xl bg-gray-100 animate-pulse"></div>
            </div>
          ) : resumes.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <p className="text-gray-700 font-mono">No resume found for your account.</p>
              <p className="text-gray-500 mt-2">Upload one to start using Swiftly faster.</p>
              <Link
                href="/upload-resume"
                className="inline-block mt-4 px-5 py-2 bg-black text-white rounded-lg hover:bg-blue-600 transition-all font-mono text-sm border-2 border-black hover:border-blue-600"
              >
                uploadResume()
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumes.map((resume) => {
                const name = [resume.firstName, resume.middleName, resume.lastName].filter(Boolean).join(' ');
                const isDeletingThis = deletingResumeId === resume.id;
                return (
                  <article key={resume.id} className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group">
                    <Link href={`/dashboard/resume/${resume.id}`} className="block cursor-pointer">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {resume.title || name || 'Untitled Resume'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {resume.resumeEmail || 'No email available'}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        {resume.country ? (
                          <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{resume.country}</span>
                        ) : null}
                        {resume.phoneNumber ? (
                          <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">{resume.phoneNumber}</span>
                        ) : null}
                        <span className="ml-auto font-mono text-gray-400 group-hover:text-blue-500 transition-colors text-xs">view →</span>
                      </div>
                    </Link>

                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => void handleDeleteResume(resume.id)}
                        disabled={isDeletingThis}
                        className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:text-red-600 hover:border-red-500 transition-all font-mono text-sm border-2 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeletingThis ? 'deleting...' : 'delete()'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
