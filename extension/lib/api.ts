export interface ApiResponse<T = unknown> {
	statusCode: number;
	data: T;
	message: string;
	success: boolean;
}

export interface ResumeRecord {
	id: string;
	title?: string | null;
	firstName?: string | null;
	middleName?: string | null;
	lastName?: string | null;
	resumeEmail?: string | null;
	linkedIn?: string | null;
}

export interface AuthProfile {
	fullName?: string | null;
	email?: string | null;
	avatarUrl?: string | null;
}

export interface SessionState {
	isAuthenticated: boolean;
	resumeCount: number;
	resumes: ResumeRecord[];
	profile: AuthProfile | null;
	apiBaseUrl: string | null;
	webBaseUrl: string;
}

const LOCAL_WEB_BASE_URL = 'http://localhost:3000';
const PRODUCTION_WEB_BASE_URL = 'https://swiftly.nakshjoshi.in';

const LOCAL_API_BASE_URL = 'http://localhost:3001';
const PRODUCTION_API_BASE_URL = 'https://api.swiftly.nakshjoshi.in';

const API_BASE_CANDIDATES = [LOCAL_API_BASE_URL, PRODUCTION_API_BASE_URL];
const EXTENSION_PROFILE_STORAGE_KEY = 'swiftly.extension.profile';

const getCookiesByName = async (name: string): Promise<chrome.cookies.Cookie[]> => {
	if (typeof chrome === 'undefined' || !chrome.cookies) return [];
	return chrome.cookies.getAll({ name });
};

const getAuthCookies = async (): Promise<chrome.cookies.Cookie[]> => {
	const [accessTokens, refreshTokens] = await Promise.all([
		getCookiesByName('accessToken'),
		getCookiesByName('refreshToken'),
	]);

	return [...accessTokens, ...refreshTokens];
};

const detectPreferredEnv = (cookies: chrome.cookies.Cookie[]): 'local' | 'production' => {
	const domains = cookies.map((cookie) => cookie.domain || '').join(' ');
	if (domains.includes('swiftly.nakshjoshi.in')) return 'production';
	return 'local';
};

const getWebBaseUrl = (env: 'local' | 'production'): string => {
	return env === 'production' ? PRODUCTION_WEB_BASE_URL : LOCAL_WEB_BASE_URL;
};

const getApiCandidates = (env: 'local' | 'production'): string[] => {
	if (env === 'production') {
		return [PRODUCTION_API_BASE_URL, LOCAL_API_BASE_URL];
	}
	return [LOCAL_API_BASE_URL, PRODUCTION_API_BASE_URL];
};

const fetchJson = async <T>(url: string): Promise<{ status: number; data: T | null }> => {
	const response = await fetch(url, {
		method: 'GET',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	let parsedData: T | null = null;
	try {
		parsedData = (await response.json()) as T;
	} catch {
		parsedData = null;
	}

	return {
		status: response.status,
		data: parsedData,
	};
};

const normalizeAuthProfile = (input: unknown): AuthProfile | null => {
	if (!input || typeof input !== 'object') return null;

	const payload = input as Record<string, unknown>;
	const fullName = typeof payload.fullName === 'string' ? payload.fullName.trim() : '';
	const email = typeof payload.email === 'string' ? payload.email.trim() : '';
	const avatarUrl = typeof payload.avatarUrl === 'string' ? payload.avatarUrl.trim() : '';

	if (!fullName && !email && !avatarUrl) return null;

	return {
		fullName: fullName || undefined,
		email: email || undefined,
		avatarUrl: avatarUrl || undefined,
	};
};

const getStoredProfile = async (): Promise<AuthProfile | null> => {
	if (typeof chrome === 'undefined' || !chrome.storage?.local) return null;

	try {
		const result = await chrome.storage.local.get(EXTENSION_PROFILE_STORAGE_KEY);
		return normalizeAuthProfile(result?.[EXTENSION_PROFILE_STORAGE_KEY]);
	} catch {
		return null;
	}
};

const setStoredProfile = async (profile: AuthProfile): Promise<void> => {
	if (typeof chrome === 'undefined' || !chrome.storage?.local) return;

	try {
		await chrome.storage.local.set({ [EXTENSION_PROFILE_STORAGE_KEY]: profile });
	} catch {
		return;
	}
};

const clearStoredProfile = async (): Promise<void> => {
	if (typeof chrome === 'undefined' || !chrome.storage?.local) return;

	try {
		await chrome.storage.local.remove(EXTENSION_PROFILE_STORAGE_KEY);
	} catch {
		return;
	}
};

const fetchUserProfile = async (apiBaseUrl: string): Promise<{ status: number; profile: AuthProfile | null }> => {
	const response = await fetchJson<ApiResponse<unknown>>(`${apiBaseUrl}/api/v1/auth/userProfile`);

	return {
		status: response.status,
		profile: normalizeAuthProfile(response.data?.data),
	};
};

const inferProfileFromResumes = (resumes: ResumeRecord[]): AuthProfile | null => {
	if (resumes.length === 0) return null;

	const firstResume = resumes[0];
	const fullName = [firstResume.firstName, firstResume.middleName, firstResume.lastName]
		.filter(Boolean)
		.join(' ')
		.trim();
	const email = firstResume.resumeEmail?.trim() || null;

	if (!fullName && !email) return null;
	return { fullName: fullName || undefined, email: email || undefined };
};

export const fetchResumeForUser = async (apiBaseUrl: string): Promise<{ status: number; resumes: ResumeRecord[] }> => {
	const response = await fetchJson<ApiResponse<ResumeRecord[]>>(
		`${apiBaseUrl}/api/v1/fetch/fetchResumeForUser`,
	);

	return {
		status: response.status,
		resumes: response.data?.data ?? [],
	};
};

export const resolveSessionState = async (): Promise<SessionState> => {
	const cookies = await getAuthCookies();
	const env = detectPreferredEnv(cookies);
	const webBaseUrl = getWebBaseUrl(env);

	if (cookies.length === 0) {
		return {
			isAuthenticated: false,
			resumeCount: 0,
			resumes: [],
			profile: null,
			apiBaseUrl: null,
			webBaseUrl,
		};
	}

	const apiCandidates = getApiCandidates(env);
	let sawUnauthorized = false;
	const cachedProfile = await getStoredProfile();

	for (const apiBaseUrl of apiCandidates) {
		try {
			const resumeResult = await fetchResumeForUser(apiBaseUrl);

			if (resumeResult.status === 401 || resumeResult.status === 403) {
				sawUnauthorized = true;
				await clearStoredProfile();
				continue;
			}

			if (resumeResult.status >= 200 && resumeResult.status < 300) {
				let profile = cachedProfile || inferProfileFromResumes(resumeResult.resumes);

				const profileResult = await fetchUserProfile(apiBaseUrl);
				if (profileResult.profile) {
					profile = profileResult.profile;
					await setStoredProfile(profileResult.profile);
				} else if (profile) {
					await setStoredProfile(profile);
				}

				return {
					isAuthenticated: true,
					resumeCount: resumeResult.resumes.length,
					resumes: resumeResult.resumes,
					profile,
					apiBaseUrl,
					webBaseUrl,
				};
			}
		} catch {
			continue;
		}
	}

	if (sawUnauthorized) {
		return {
			isAuthenticated: false,
			resumeCount: 0,
			resumes: [],
			profile: null,
			apiBaseUrl: null,
			webBaseUrl,
		};
	}

	return {
		isAuthenticated: false,
		resumeCount: 0,
		resumes: [],
		profile: null,
		apiBaseUrl: null,
		webBaseUrl,
	};
};
