'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { startAuthentication } from '@simplewebauthn/browser';
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';
import { setAuthUser } from '@/lib/authSession';
import { authApi } from '@/lib/api';

type PasskeyLoginProps = {
	mode?: 'signin' | 'signup';
	className?: string;
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function PasskeyLogin({ mode = 'signin', className = '' }: PasskeyLoginProps) {
	const router = useRouter();
	const { enqueueSnackbar } = useSnackbar();
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		router.prefetch('/dashboard');
	}, [router]);

	const isSupported = typeof window !== 'undefined' && !!window.PublicKeyCredential;

	const handlePasskey = async () => {
		if (!isSupported) {
			enqueueSnackbar('Passkeys are not supported by your browser.', { variant: 'warning' });
			return;
		}

		setIsLoading(true);
		try {
			// ── Step 1: Request login challenge from backend ───────────────────
			const optionsRes = await authApi.passkeyLoginOptions();
			if (!optionsRes.success) {
				throw new Error(optionsRes.message || 'Failed to get login options');
			}

			// ── Step 2: Trigger the browser passkey hardware prompt ────────────
			let credentialPayload;
			try {
				credentialPayload = await startAuthentication({
					optionsJSON: optionsRes.data as unknown as PublicKeyCredentialRequestOptionsJSON,
				});
			} catch (error: unknown) {
				// User clicked "Cancel" on the TouchID/Windows Hello prompt
				if (error instanceof Error && error.name === 'NotAllowedError') {
					enqueueSnackbar('Login cancelled or timed out.', { variant: 'info' });
				} else {
					enqueueSnackbar('Login was cancelled.', { variant: 'info' });
				}
				return;
			}

			// ── Step 3: Verify the hardware signature with the backend ─────────
			const verifyRes = await authApi.passkeyLoginVerify(
				credentialPayload as unknown as Record<string, unknown>
			);

			if (!verifyRes.success) {
				throw new Error(verifyRes.message || 'Passkey login failed');
			}

			// Backend set the JWT cookies — persist user in localStorage and redirect
			if (verifyRes.data) {
				setAuthUser(verifyRes.data);
			}
			enqueueSnackbar('Signed in successfully!', { variant: 'success' });
			router.push('/dashboard');
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : 'Failed to sign in. Please try again.';
			enqueueSnackbar(message, { variant: 'error' });
		} finally {
			setIsLoading(false);
		}
	};

	const label = mode === 'signup' ? 'signUpWithPasskey()' : 'signInWithPasskey()';

	return (
		<button
			type="button"
			disabled={isLoading || !isSupported}
			className={`group relative w-full overflow-hidden rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 active:translate-y-0 ${
				isLoading
					? 'border-yellow-600 bg-yellow-300 text-gray-950 shadow-[0_20px_40px_rgba(202,138,4,0.35)] cursor-not-allowed'
					: !isSupported
					? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
					: 'border-gray-400/80 bg-white text-gray-900 hover:-translate-y-0.5 hover:border-violet-500 hover:shadow-[0_18px_40px_rgba(139,92,246,0.18)]'
			} ${className}`.trim()}
			aria-label={label}
			onClick={() => void handlePasskey()}
			title={!isSupported ? 'Passkeys are not supported by your browser.' : undefined}
		>
			{/* Shimmer overlay on hover */}
			<span className="pointer-events-none absolute inset-0 bg-linear-to-r from-violet-50/0 via-violet-50/70 to-purple-50/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

			<span className="relative flex min-h-14 items-center gap-4 px-5 py-3">
				{/* Passkey icon badge */}
				<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-transform duration-300 group-hover:scale-105">
					{/* Passkey / FIDO2 key icon */}
					<svg
						viewBox="0 0 24 24"
						className="h-5 w-5"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.75"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						{/* key body */}
						<circle cx="7.5" cy="15.5" r="3.5" stroke="#7C3AED" />
						<path d="M10.828 12.172L20 3" stroke="#7C3AED" />
						<path d="M18 5l2 2" stroke="#7C3AED" />
						<path d="M15 8l2 2" stroke="#7C3AED" />
					</svg>
				</span>

				<span className="flex min-w-0 flex-1 items-center justify-between gap-4">
					<span className="truncate text-left font-mono text-base font-semibold tracking-tight text-gray-800">
						{isLoading ? 'redirectingToDashboard()' : label}
					</span>
					<span className="text-sm font-mono text-gray-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-violet-600">
						{isLoading ? '...' : '->'}
					</span>
				</span>
			</span>
		</button>
	);
}
