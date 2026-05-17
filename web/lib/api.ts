import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// API configuration
const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '').replace(/\/api(?:\/v1)?$/, '');

export interface ApiResponse<T = any> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

type RefreshableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _skipAuthRefresh?: boolean;
};

export interface SignUpData {
  email: string;
  fullName: string;
  phone?: string;
  hashedPassword: string;
  provider: 'credentials';
}

export interface SignInData {
  email: string;
  hashedPassword: string;
  provider: 'credentials';
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
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
  dateOfBirth?: string | null;
  linkedIn?: string | null;
  github?: string | null;
  personalPortfolio?: string | null;
  leetCode?: string | null;
  codingProfile2?: string | null;
  codingProfile3?: string | null;
  summary?: string | null;
  address?: string | null;
  yearOfGraduation?: number | null;
  createdAt?: string;
  updatedAt?: string;
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

export interface UpdateResumePayload {
  id: string;
  title?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  country?: string | null;
  phoneNumber?: string | null;
  resumeEmail?: string | null;
  dateOfBirth?: string | null;
  linkedIn?: string | null;
  github?: string | null;
  personalPortfolio?: string | null;
  leetCode?: string | null;
  codingProfile2?: string | null;
  codingProfile3?: string | null;
  summary?: string | null;
  address?: string | null;
  yearOfGraduation?: number | null;
}

export interface UpdateEducationPayload {
  resumeId: string;
  educationId: string;
  instituteName?: string | null;
  level?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  degree?: string | null;
  branch?: string | null;
  grade?: string | null;
}

export interface UpdateExperiencePayload {
  resumeId: string;
  experienceId: string;
  companyName?: string | null;
  location?: string | null;
  type?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  position?: string | null;
  description?: string | null;
  proofLink?: string | null;
}

export interface UpdateProjectPayload {
  resumeId: string;
  projectId: string;
  projectName?: string | null;
  techStack?: string[];
  description?: string | null;
  githubLink?: string | null;
  liveLink?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateSkillPayload {
  resumeId: string;
  skillId: string;
  name?: string | null;
  category?: string | null;
}

export interface UpdateAchievementPayload {
  resumeId: string;
  achievementId: string;
  title?: string | null;
  org?: string | null;
  date?: string | null;
  description?: string | null;
}

export interface UpdatePorPayload {
  resumeId: string;
  porId: string;
  title?: string | null;
  org?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}

export interface UpdatePublicationPayload {
  resumeId: string;
  publicationId: string;
  authors?: string | null;
  title?: string | null;
  conference?: string | null;
  place?: string | null;
  publicationDate?: string | null;
  description?: string | null;
}

class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function toApiResponse<T>(payload: unknown, fallbackMessage = 'Success'): ApiResponse<T> {
  if (
    payload &&
    typeof payload === 'object' &&
    'statusCode' in payload &&
    'data' in payload &&
    'message' in payload &&
    'success' in payload
  ) {
    return payload as ApiResponse<T>;
  }

  return {
    statusCode: 200,
    data: payload as T,
    message: fallbackMessage,
    success: true,
  };
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RefreshableRequestConfig | undefined;
    const statusCode = error.response?.status;

    if (!originalRequest || statusCode !== 401 || originalRequest._retry || originalRequest._skipAuthRefresh) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';
    const isAuthRoute =
      requestUrl.includes('/api/v1/auth/signin') ||
      requestUrl.includes('/api/v1/auth/signup') ||
      requestUrl.includes('/api/v1/auth/google/callback') ||
      requestUrl.includes('/api/v1/auth/refresh');

    if (isAuthRoute) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await apiClient.post('/api/v1/auth/refresh', undefined, { _skipAuthRefresh: true } as any);
      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

function handleAxiosError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    const statusCode = error.response?.status || 500;
    throw new ApiError(message, statusCode);
  }

  throw new ApiError('Something went wrong', 500);
}





export const authApi = {

  googleAuth: async (code:string): Promise<ApiResponse<AuthUser>> => {

    try {
      const response = await apiClient.get<ApiResponse<AuthUser>>(`/api/v1/auth/google/callback?code=${code}`);
      return toApiResponse<AuthUser>(response.data, 'Google login successful');
    } catch (error) {
      handleAxiosError(error)
    }
  },


  signUp: async (data: SignUpData): Promise<ApiResponse<AuthUser>> => {
    try {
      const response = await apiClient.post<ApiResponse<AuthUser>>('/api/v1/auth/signup', data);
      return toApiResponse<AuthUser>(response.data, 'User registered successfully');
    } catch (error) {
      handleAxiosError(error);
    }
  },

  signIn: async (data: SignInData): Promise<ApiResponse<AuthUser>> => {
    try {
      const response = await apiClient.post<ApiResponse<AuthUser>>('/api/v1/auth/signin', data);
      return toApiResponse<AuthUser>(response.data, 'Logged in');
    } catch (error) {
      handleAxiosError(error);
    }
  },

  refresh: async (): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.post<ApiResponse<null>>('/api/v1/auth/refresh', undefined, {
        _skipAuthRefresh: true,
      } as any);
      return toApiResponse<null>(response.data, 'Token refreshed successfully');
    } catch (error) {
      handleAxiosError(error);
    }
  },

  logout: async (): Promise<ApiResponse<string | null>> => {
    try {
      const response = await apiClient.post('/api/v1/auth/logout');
      return toApiResponse<string | null>(response.data, 'Logged out successfully');
    } catch (error) {
      handleAxiosError(error);
    }
  },
};

export const resumeApi = {
  fetchResumeForUser: async (): Promise<ApiResponse<ResumeRecord[]>> => {
    try {
      const response = await apiClient.get<ApiResponse<ResumeRecord[]>>('/api/v1/fetch/fetchResumeForUser');
      return toApiResponse<ResumeRecord[]>(response.data, 'Resume fetched successfully');
    } catch (error) {
      handleAxiosError(error);
    }
  },

  fetchResumeById: async (resumeId: string): Promise<ApiResponse<ResumeDetailRecord>> => {
    try {
      const response = await apiClient.get<ApiResponse<ResumeDetailRecord>>(`/api/v1/fetch/fetchResumeById/${resumeId}`);
      return toApiResponse<ResumeDetailRecord>(response.data, 'Resume fetched successfully');
    } catch (error) {
      handleAxiosError(error);
    }
  },

  deleteResumeById: async (resumeId: string): Promise<ApiResponse<ResumeRecord>> => {
    try {
      const response = await apiClient.delete<ApiResponse<ResumeRecord>>(`/api/v1/fetch/deleteResumeById/${resumeId}`);
      return toApiResponse<ResumeRecord>(response.data, 'Resume deleted successfully');
    } catch (error) {
      handleAxiosError(error);
    }
  },

  uploadAndParse: async (resumeFile: File): Promise<unknown> => {
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);

      const response = await apiClient.post('/api/v1/resume/uploadAndParse', formData,{
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },
};

export const updateApi = {
  updateResume: async (data: UpdateResumePayload): Promise<ApiResponse<ResumeRecord>> => {
    try {
      const response = await apiClient.post('/api/v1/update/updateResume', data);
      return toApiResponse<ResumeRecord>(response.data, 'Resume updated successfully');
    } catch (error) {
      handleAxiosError(error);
    }
  },

  updateEducation: async (data: UpdateEducationPayload): Promise<ApiResponse<EducationRecord>> => {
    try {
      const response = await apiClient.post('/api/v1/update/updateEducation', data);
      return toApiResponse<EducationRecord>(response.data, 'Education updated successfully');
    } catch (error) {
      handleAxiosError(error);
    }
  },

  updateExperience: async (data: UpdateExperiencePayload): Promise<ApiResponse<ExperienceRecord>> => {
    try {
      const response = await apiClient.post('/api/v1/update/updateExperience', data);
      return toApiResponse<ExperienceRecord>(response.data, 'Experience updated successfully');
    } catch (error) {
      handleAxiosError(error);
    }
  },

  updateProject: async (data: UpdateProjectPayload): Promise<ApiResponse<ProjectRecord>> => {
    try {
      const response = await apiClient.post('/api/v1/update/updateProjects', data);
      return toApiResponse<ProjectRecord>(response.data, 'Project updated successfully');
    } catch (error) {
      handleAxiosError(error);
    }
  },

  updateSkill: async (data: UpdateSkillPayload): Promise<ApiResponse<SkillRecord>> => {
    try {
      const response = await apiClient.post('/api/v1/update/updateSkills', data);
      return toApiResponse<SkillRecord>(response.data, 'Skill updated successfully');
    } catch (error) {
      handleAxiosError(error);
    }
  },

  updateAchievement: async (data: UpdateAchievementPayload): Promise<ApiResponse<AchievementRecord>> => {
    try {
      const response = await apiClient.post('/api/v1/update/updateAchievements', data);
      return toApiResponse<AchievementRecord>(response.data, 'Achievement updated successfully');
    } catch (error) {
      handleAxiosError(error);
    }
  },

  updatePor: async (data: UpdatePorPayload): Promise<ApiResponse<PorRecord>> => {
    try {
      const response = await apiClient.post('/api/v1/update/updatePor', data);
      return toApiResponse<PorRecord>(response.data, 'POR updated successfully');
    } catch (error) {
      handleAxiosError(error);
    }
  },

  updatePublication: async (data: UpdatePublicationPayload): Promise<ApiResponse<PublicationRecord>> => {
    try {
      const response = await apiClient.post('/api/v1/update/updatePublications', data);
      return toApiResponse<PublicationRecord>(response.data, 'Publication updated successfully');
    } catch (error) {
      handleAxiosError(error);
    }
  },
};



export interface LatexTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
}

export const migrateApi = {
  listTemplates: async (): Promise<ApiResponse<LatexTemplate[]>> => {
    try {
      const response = await apiClient.get<ApiResponse<LatexTemplate[]>>('/api/v1/migrate/templates');
      return toApiResponse<LatexTemplate[]>(response.data, 'Templates fetched');
    } catch (error) {
      handleAxiosError(error);
    }
  },

  /**
   * Compile a resume to PDF using a LaTeX template.
   * Returns a Blob URL that can be used to trigger a browser download.
   */
  compileToPdf: async (resumeId: string, templateId: string): Promise<Blob> => {
    try {
      const response = await apiClient.post(
        '/api/v1/migrate/compile',
        { resumeId, templateId },
        { responseType: 'blob' }
      );
      return response.data as Blob;
    } catch (error) {
      handleAxiosError(error);
    }
  },
};




export { ApiError };
