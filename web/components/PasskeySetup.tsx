'use client';

import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { authApi } from '@/lib/api';

// ── Passkey helpers ────────────────────────────────────────────────────────────

function base64urlToBuffer(base64url: string): ArrayBuffer {
	const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(base64);
	const buffer = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
	return buffer.buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	bytes.forEach((b) => (binary += String.fromCharCode(b)));
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── Props ──────────────────────────────────────────────────────────────────────

type PasskeySetupProps = {
	/** Called after the dropdown closes so the parent can close the menu */
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
			const options = optionsRes.data as PublicKeyCredentialCreationOptions & {
				challenge: string;
				user: { id: string; name: string; displayName: string };
				excludeCredentials?: { id: string; type: string; transports?: string[] }[];
			};

			// ── Step 2: Decode challenge & user.id from base64url ─────────────
			const publicKey: PublicKeyCredentialCreationOptions = {
				...options,
				challenge: base64urlToBuffer(options.challenge as unknown as string),
				user: {
					...options.user,
					id: base64urlToBuffer(options.user.id as unknown as string),
				},
				excludeCredentials: options.excludeCredentials?.map((c) => ({
					...c,
					id: base64urlToBuffer(c.id),
					type: 'public-key' as PublicKeyCredentialType,
				})),
			};

			// ── Step 3: Trigger the browser passkey creation prompt ────────────
			const credential = (await navigator.credentials.create({
				publicKey,
			})) as PublicKeyCredential | null;

			if (!credential) {
				enqueueSnackbar('Passkey setup was cancelled.', { variant: 'warning' });
				return;
			}

			const response = credential.response as AuthenticatorAttestationResponse;

			// ── Step 4: Send the credential back to backend ────────────────────
			await authApi.passkeyRegisterVerify({
				id: credential.id,
				rawId: bufferToBase64url(credential.rawId),
				type: credential.type,
				response: {
					clientDataJSON: bufferToBase64url(response.clientDataJSON),
					attestationObject: bufferToBase64url(response.attestationObject),
				},
			});

			enqueueSnackbar('Passkey registered successfully! You can now sign in with your passkey.', {
				variant: 'success',
			});
			onClose?.();
		} catch (error: unknown) {
			// User cancelled the native dialog
			if (error instanceof DOMException && error.name === 'NotAllowedError') {
				enqueueSnackbar('Passkey setup was cancelled or timed out.', { variant: 'info' });
			} else if (error instanceof Error) {
				enqueueSnackbar(error.message || 'Failed to register passkey. Please try again.', {
					variant: 'error',
				});
			} else {
				enqueueSnackbar('Failed to register passkey. Please try again.', { variant: 'error' });
			}
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
