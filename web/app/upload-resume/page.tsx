'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { ApiError, resumeApi } from '@/lib/api';

const allowedExtensions = ['pdf', 'docx', 'tex'];

export default function UploadResumePage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      try {
        await resumeApi.fetchResumeForUser();
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 401) {
          enqueueSnackbar('Please sign in first', { variant: 'warning' });
          router.push('/signin');
          return;
        }

        if (error instanceof ApiError) {
          enqueueSnackbar(error.message, { variant: 'error' });
        } else {
          enqueueSnackbar('Unable to verify session', { variant: 'error' });
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    void verifySession();
  }, [enqueueSnackbar, router]);

  const fileMeta = useMemo(() => {
    if (!selectedFile) return 'No file selected';
    return `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`;
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      enqueueSnackbar('Unsupported file type. Use PDF, DOCX, or TEX.', { variant: 'error' });
      e.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      enqueueSnackbar('Please select a resume file', { variant: 'warning' });
      return;
    }

    setIsUploading(true);

    try {
      await resumeApi.uploadAndParse(selectedFile);
      enqueueSnackbar('Resume uploaded and parsed successfully', { variant: 'success' });
      setTimeout(() => {
        router.push('/dashboard');
      }, 900);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        enqueueSnackbar('Session expired. Please sign in again.', { variant: 'warning' });
        router.push('/signin');
        return;
      }

      if (error instanceof ApiError) {
        enqueueSnackbar(error.message, { variant: 'error' });
      } else {
        enqueueSnackbar('Resume upload failed. Try again.', { variant: 'error' });
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen pt-24 pb-12 bg-linear-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="font-mono text-gray-700">checkingSession()...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-12 bg-linear-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
      <div className="absolute top-20 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-56 h-56 bg-red-500/10 rounded-2xl rotate-45 blur-2xl"></div>
      <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-green-500/10 rounded-full blur-2xl"></div>

      <div className="max-w-3xl mx-auto px-6 relative z-10 space-y-6">
        <section className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-gray-200/50 p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            <span className="font-mono text-blue-600">{'<'}</span>
            Upload Resume
            <span className="font-mono text-blue-600">{'/>'}</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Supported formats: <span className="font-mono text-gray-900">PDF</span>, <span className="font-mono text-gray-900">DOCX</span>, <span className="font-mono text-gray-900">TEX</span>.
          </p>
          <p className="text-green-700 font-mono text-sm mt-1">
            Recommendation: Use TEX for clearer and more accurate data extraction.
          </p>

          <form onSubmit={handleUpload} className="mt-6 space-y-5">
            <div>
              <label htmlFor="resume" className="block text-sm font-mono font-medium text-gray-700 mb-2">
                <span className="text-blue-600">const</span> resumeFile <span className="text-red-500">*</span>
              </label>
              <input
                id="resume"
                name="resume"
                type="file"
                accept=".pdf,.docx,.tex,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/x-tex"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:font-mono file:text-sm file:bg-black file:text-white hover:file:bg-blue-600"
              />
              <p className="mt-2 text-sm text-gray-600">{fileMeta}</p>
            </div>

            {isUploading && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-blue-700 flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    extracting_data()...
                  </span>
                  <span className="text-xs font-mono text-blue-500 animate-pulse">please_wait()</span>
                </div>
                <div className="w-full bg-blue-200/50 h-2.5 rounded-full overflow-hidden relative">
                  <div className="h-full bg-blue-600 rounded-full absolute top-0 left-0 w-1/3 animate-pipe-slide"></div>
                  <style>{`
                    @keyframes pipe-slide {
                      0% { left: -35%; width: 25%; }
                      50% { left: 30%; width: 50%; }
                      100% { left: 100%; width: 25%; }
                    }
                    .animate-pipe-slide {
                      animation: pipe-slide 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    }
                  `}</style>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-blue-600 transition-all font-mono text-sm shadow-lg hover:shadow-blue-500/50 border-2 border-black hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'uploadingAndParsing()...' : 'uploadAndParse()'}
              </button>

              <Link
                href="/dashboard"
                className="px-6 py-3 bg-white text-gray-900 rounded-lg hover:text-blue-600 transition-all font-mono text-sm border-2 border-gray-300 hover:border-blue-600"
              >
                backToDashboard()
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
