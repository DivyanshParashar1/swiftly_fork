'use client';

import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { startRegistration } from '@simplewebauthn/browser';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/browser';
import { authApi } from '@/lib/api';

// ── Props ──────────────────────────────────────────────────────────────────────

type PasskeySetupProps = {
	/** Called after successful registration so the parent can close the menu */
	onClose?: () => void;
	/** Extra class names for the button wrapper */
	className?: string;
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function PasskeySetup({ onClose, className = '' }: PasskeySetupProps) {
	const { enqueueSnackbar } = useSnackbar();
	const [isLoading, setIsLoading] = useState(false);

	const isSupported =
		typeof window !== 'undefined' &&
		!!window.PublicKeyCredential &&
		typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';

	const handleSetupPasskey = async () => {
		if (!isSupported) {
			enqueueSnackbar('Passkeys are not supported by your browser.', { variant: 'warning' });
			return;
		}

		setIsLoading(true);
		try {
			// ── Step 1: Request registration options from backend ──────────────
			const optionsRes = await authApi.passkeyRegisterOptions();
			if (!optionsRes.success) {
				throw new Error(optionsRes.message || 'Failed to get passkey options');
			}

			// ── Step 2: Trigger the browser passkey creation hardware prompt ───
			let credentialPayload;
			try {
				credentialPayload = await startRegistration({
					optionsJSON: optionsRes.data as unknown as PublicKeyCredentialCreationOptionsJSON,
				});
			} catch (error: unknown) {
				// Log the real error so it's visible in browser DevTools → Console
				console.error('[PasskeySetup] startRegistration failed:', {
					name: error instanceof Error ? error.name : 'unknown',
					message: error instanceof Error ? error.message : String(error),
				});

				if (error instanceof Error && error.name === 'NotAllowedError') {
					// User cancelled or hardware prompt timed out
					enqueueSnackbar('Passkey setup was cancelled or timed out.', { variant: 'info' });
				} else if (error instanceof Error && error.name === 'SecurityError') {
					// rpId doesn't match the page's domain — config issue
					enqueueSnackbar(`Security error: ${error.message}`, { variant: 'error' });
				} else if (error instanceof Error && error.name === 'InvalidStateError') {
					// A passkey already exists for this user on this device
					enqueueSnackbar('A passkey for this account already exists on this device.', { variant: 'warning' });
				} else {
					const msg = error instanceof Error ? error.message : 'Passkey setup failed.';
					enqueueSnackbar(msg, { variant: 'error' });
				}
				return;
			}

			// ── Step 3: Send the hardware signature back to backend ────────────
			const verifyRes = await authApi.passkeyRegisterVerify(
				credentialPayload as unknown as Record<string, unknown>
			);

			if (!verifyRes.success) {
				throw new Error(verifyRes.message || 'Passkey verification failed');
			}

			enqueueSnackbar('Passkey registered! You can now sign in with your passkey.', {
				variant: 'success',
			});
			onClose?.();
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : 'Failed to register passkey. Please try again.';
			enqueueSnackbar(message, { variant: 'error' });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<button
			id="passkey-setup-btn"
			type="button"
			disabled={isLoading || !isSupported}
			onClick={() => void handleSetupPasskey()}
			title={!isSupported ? 'Passkeys are not supported by your browser.' : 'Register a passkey for faster sign-in'}
			className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
				isLoading
					? 'text-violet-500 bg-violet-50 cursor-wait'
					: !isSupported
					? 'text-gray-400 cursor-not-allowed'
					: 'text-violet-600 hover:text-violet-700 hover:bg-violet-50'
			} ${className}`.trim()}
			aria-label="Set up a passkey for this account"
		>
			{/* Key icon */}
			<svg
				className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isLoading ? 'animate-pulse' : ''}`}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<circle cx="7.5" cy="15.5" r="3.5" stroke="currentColor" />
				<path d="M10.828 12.172L20 3" />
				<path d="M18 5l2 2" />
				<path d="M15 8l2 2" />
			</svg>
			<span>{isLoading ? 'settingUp...' : 'setupPasskey()'}</span>
		</button>
	);
}
