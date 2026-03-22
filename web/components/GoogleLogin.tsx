'use client';

import { authApi } from "@/lib/api";
import { useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSnackbar } from "notistack";

type GoogleLoginProps = {
	mode?: 'signin' | 'signup';
	className?: string;
};

export default function GoogleLogin({ mode = 'signin', className = '' }: GoogleLoginProps) {
    const router = useRouter();
	const { enqueueSnackbar } = useSnackbar();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        router.prefetch('/dashboard');
    }, [router]);


	const responseGoogle = async (result:any) =>{
		if(!result?.code){
			return
		}

		try {
			setIsLoading(true)
			const response = await authApi.googleAuth(result.code)
			const signedInUser = response.data
			enqueueSnackbar(`Google login successful${signedInUser.fullName ? `, ${signedInUser.fullName}` : ''}. Redirecting to dashboard...`, { variant: 'success' })
			router.replace('/dashboard')
		} catch (error) {
			enqueueSnackbar('Google login failed. Please try again.', { variant: 'error' })
			console.error("Google auth failed", error)
		} finally {
			setIsLoading(false)
		}
    }

    const googleLogin = useGoogleLogin({
        onSuccess: responseGoogle,
		onError: (error) => {
			enqueueSnackbar('Google popup failed. Please retry.', { variant: 'error' })
			console.error("Google login popup error", error)
		},
        flow: 'auth-code'
    })


	const label = mode === 'signup' ? 'signUpWithGoogle()' : 'signInWithGoogle()';

	return (
		<button
			type="button"
			disabled={isLoading}
			className={`group relative w-full overflow-hidden rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:translate-y-0 ${isLoading ? 'border-yellow-600 bg-yellow-300 text-gray-950 shadow-[0_20px_40px_rgba(202,138,4,0.35)] cursor-not-allowed' : 'border-gray-400/80 bg-white text-gray-900 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-[0_18px_40px_rgba(37,99,235,0.18)]'} ${className}`.trim()}
			aria-label={label}
            onClick={googleLogin}
		>
			<span className="pointer-events-none absolute inset-0 bg-linear-to-r from-blue-50/0 via-blue-50/70 to-green-50/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
			<span className="relative flex min-h-14 items-center gap-4 px-5 py-3">
				<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-transform duration-300 group-hover:scale-105">
					<svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
						<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
						<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
						<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
						<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
						<path fill="none" d="M0 0h48v48H0z"></path>
					</svg>
				</span>

				<span className="flex min-w-0 flex-1 items-center justify-between gap-4">
					<span className="truncate text-left font-mono text-base font-semibold tracking-tight text-gray-800">
						{isLoading ? 'redirectingToDashboard()' : label}
					</span>
					<span className="text-sm font-mono text-gray-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-blue-600">
						{isLoading ? '...' : '->'}
					</span>
				</span>
			</span>
		</button>
	);
}
