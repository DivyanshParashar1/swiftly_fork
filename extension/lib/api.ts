import type { HTMLObjectAttributes } from '@/types/htmlObjectAttributes.types';

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
	country?: string | null;
	resumeEmail?: string | null;
	phoneNumber?: string | null;
	linkedIn?: string | null;
	github?: string | null;
	personalPortfolio?: string | null;
	leetCode?: string | null;
	codingProfile2?: string | null;
	codingProfile3?: string | null;
	summary?: string | null;
}

export interface EducationRecord {
	id: string;
	resumeId: string;
	instituteName?: string | null;
	level?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	location?: string | null;
	degree?: string | null;
	branch?: string | null;
	grade?: string | null;
}

export interface ExperienceRecord {
	id: string;
	resumeId: string;
	companyName?: string | null;
	location?: string | null;
	type?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	position?: string | null;
	description?: string | null;
	proofLink?: string | null;
}

export interface ProjectRecord {
	id: string;
	resumeId: string;
	projectName?: string | null;
	techStack?: string[];
	description?: string | null;
	githubLink?: string | null;
	liveLink?: string | null;
	startDate?: string | null;
	endDate?: string | null;
}

export interface SkillRecord {
	id: string;
	resumeId: string;
	name?: string | null;
	category?: string | null;
}

export interface AchievementRecord {
	id: string;
	resumeId: string;
	title?: string | null;
	org?: string | null;
	date?: string | null;
	description?: string | null;
}

export interface PorRecord {
	id: string;
	resumeId: string;
	title?: string | null;
	org?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	description?: string | null;
}

export interface PublicationRecord {
	id: string;
	resumeId: string;
	authors?: string | null;
	title?: string | null;
	conference?: string | null;
	place?: string | null;
	publicationDate?: string | null;
	description?: string | null;
}

export interface ResumeDetailRecord extends ResumeRecord {
	education: EducationRecord[];
	experience: ExperienceRecord[];
	projects: ProjectRecord[];
	skills: SkillRecord[];
	achievements: AchievementRecord[];
	pors: PorRecord[];
	publications: PublicationRecord[];
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

export interface AutofillMappingPayload {
	resumeData: unknown;
	htmlObjectData: HTMLObjectAttributes[];
}

export interface AutofillMappingResponse {
	aiResult: Record<string, unknown>;
}

const PRODUCTION_WEB_BASE_URL = 'https://swiftly.nakshjoshi.in';

const PRODUCTION_API_BASE_URL = 'https://apiv2.nakshjoshi.in';
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

const postJson = async <T>(url: string, body: unknown): Promise<{ status: number; data: T | null }> => {
	const response = await fetch(url, {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
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

const normalizeResumeDetail = (payload: unknown): ResumeDetailRecord | null => {
	const raw = Array.isArray(payload) ? payload[0] : payload;
	if (!raw || typeof raw !== 'object') return null;

	const resume = raw as ResumeDetailRecord;
	return {
		...resume,
		education: resume.education ?? [],
		experience: resume.experience ?? [],
		projects: resume.projects ?? [],
		skills: resume.skills ?? [],
		achievements: resume.achievements ?? [],
		pors: resume.pors ?? [],
		publications: resume.publications ?? [],
	};
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

export const fetchResumeById = async (
	apiBaseUrl: string,
	resumeId: string,
): Promise<{ status: number; resume: ResumeDetailRecord | null; rawResumeJson: unknown }> => {
	const response = await fetchJson<ApiResponse<unknown>>(
		`${apiBaseUrl}/api/v1/fetch/fetchResumeById/${resumeId}`,
	);

	return {
		status: response.status,
		resume: normalizeResumeDetail(response.data?.data),
		rawResumeJson: response.data?.data ?? null,
	};
};

export const fetchAutofillMapping = async (
	apiBaseUrl: string,
	payload: AutofillMappingPayload,
): Promise<{ status: number; aiResult: Record<string, unknown> | null }> => {
	const response = await postJson<AutofillMappingResponse>(
		`${apiBaseUrl}/api/v1/extension/getAutofillData`,
		payload,
	);

	return {
		status: response.status,
		aiResult: response.data?.aiResult ?? null,
	};
};

export const resolveSessionState = async (): Promise<SessionState> => {
	const cookies = await getAuthCookies();
	const webBaseUrl = PRODUCTION_WEB_BASE_URL;

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

	const apiCandidates = [PRODUCTION_API_BASE_URL];
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
