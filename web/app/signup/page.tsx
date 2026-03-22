'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import GoogleLogin from '@/components/GoogleLogin';
import { authApi, ApiError, resumeApi } from '@/lib/api';

export default function SignUpPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        await resumeApi.fetchResumeForUser();
        router.push('/dashboard');
      } catch (_error) {
        return;
      }
    };

    void checkExistingSession();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      enqueueSnackbar('Please fill in all required fields', { variant: 'warning' });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      enqueueSnackbar('Passwords do not match', { variant: 'error' });
      return;
    }
    
    if (formData.password.length < 8) {
      enqueueSnackbar('Password must be at least 8 characters', { variant: 'warning' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await authApi.signUp({
        email: formData.email.trim().toLowerCase(),
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim() || undefined,
        hashedPassword: formData.password,
        provider: 'credentials',
      });

      const createdUser = response.data;
      
      enqueueSnackbar(response.message || `Account created successfully for ${createdUser.fullName ?? createdUser.email}!`, { variant: 'success' });
      
      // Redirect to dashboard or home after successful signup
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } catch (error) {
      if (error instanceof ApiError) {
        enqueueSnackbar(error.message, { variant: 'error' });
      } else {
        enqueueSnackbar('Failed to create account. Please try again.', { variant: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-20 pb-12 bg-linear-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
      {/* Geometric background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-56 h-56 bg-red-500/10 rounded-2xl rotate-45 blur-2xl"></div>
      <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-green-500/10 rounded-full blur-2xl"></div>

      <div className="max-w-md mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto shadow-xl">
              <span className="text-white font-bold text-2xl font-mono">S</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            <span className="font-mono text-blue-600">{'<'}</span>
            Create Account
            <span className="font-mono text-blue-600">{'/>'}</span>
          </h1>
          
          <p className="text-gray-600">
            Join <span className="font-mono font-semibold text-gray-900">Swiftly</span> and apply to jobs 10x faster
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-gray-200/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-mono font-medium text-gray-700 mb-2">
                <span className="text-blue-600">const</span> fullName <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-sans bg-white text-gray-900 placeholder:text-gray-500 caret-gray-900"
                placeholder="Naksh Joshi"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-mono font-medium text-gray-700 mb-2">
                <span className="text-blue-600">const</span> email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-sans bg-white text-gray-900 placeholder:text-gray-500 caret-gray-900"
                placeholder="user@swiftly.nakshjoshi.in"
              />
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-mono font-medium text-gray-700 mb-2">
                <span className="text-green-600">let</span> phone <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                maxLength={10}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-500/20 transition-all font-sans bg-white text-gray-900 placeholder:text-gray-500 caret-gray-900"
                placeholder="+91 12345 67890"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-mono font-medium text-gray-700 mb-2">
                <span className="text-blue-600">const</span> password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-sm bg-white text-gray-900 placeholder:text-gray-500 caret-gray-900"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500 font-mono">
                // Min 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-mono font-medium text-gray-700 mb-2">
                <span className="text-blue-600">const</span> confirmPassword <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-sm bg-white text-gray-900 placeholder:text-gray-500 caret-gray-900"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-4 bg-black text-white rounded-lg hover:bg-blue-600 transition-all font-mono text-sm shadow-lg hover:shadow-blue-500/50 border-2 border-black hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="text-green-400">$</span>
                  <span>createAccount()</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-mono">// or</span>
            </div>
          </div>

          <GoogleLogin mode="signup" />

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link 
                href="/signin" 
                className="font-mono font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                signIn()
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        {/* <p className="text-center text-xs text-gray-500 mt-6 font-mono">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-blue-600 hover:underline">Terms</Link>
          {' & '}
          <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
        </p> */}
      </div>
    </main>
  );
}
