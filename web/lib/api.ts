import axios from 'axios';

// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

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
  linkedIn?: string | null;
  github?: string | null;
  personalPortfolio?: string | null;
  leetCode?: string | null;
  codingProfile2?: string | null;
  codingProfile3?: string | null;
  summary?: string | null;
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

function handleAxiosError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    const statusCode = error.response?.status || 500;
    throw new ApiError(message, statusCode);
  }

  throw new ApiError('Something went wrong', 500);
}





export const authApi = {

  googleAuth: async (code:string): Promise<any> => {

    try {
      const response = await apiClient.get(`/api/v1/auth/google/callback?code=${code}`);
      return response;
    } catch (error) {
      handleAxiosError(error)
    }
  },


  signUp: async (data: SignUpData): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/auth/signup', data);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  signIn: async (data: SignInData): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/auth/signin', data);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  logout: async (): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>('/api/v1/auth/logout');
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },
};

export const resumeApi = {
  fetchResumeForUser: async (): Promise<ApiResponse<ResumeRecord[]>> => {
    try {
      const response = await apiClient.get<ApiResponse<ResumeRecord[]>>('/api/v1/fetch/fetchResumeForUser');
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  fetchResumeById: async (resumeId: string): Promise<ApiResponse<ResumeDetailRecord>> => {
    try {
      const response = await apiClient.get<ApiResponse<ResumeDetailRecord>>(`/api/v1/fetch/fetchResumeById/${resumeId}`);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  deleteResumeById: async (resumeId: string): Promise<ApiResponse<ResumeRecord>> => {
    try {
      const response = await apiClient.delete<ApiResponse<ResumeRecord>>(`/api/v1/fetch/deleteResumeById/${resumeId}`);
      return response.data;
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
      const response = await apiClient.post<ApiResponse<ResumeRecord>>('/api/v1/update/updateResume', data);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  updateEducation: async (data: UpdateEducationPayload): Promise<ApiResponse<EducationRecord>> => {
    try {
      const response = await apiClient.post<ApiResponse<EducationRecord>>('/api/v1/update/updateEducation', data);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  updateExperience: async (data: UpdateExperiencePayload): Promise<ApiResponse<ExperienceRecord>> => {
    try {
      const response = await apiClient.post<ApiResponse<ExperienceRecord>>('/api/v1/update/updateExperience', data);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  updateProject: async (data: UpdateProjectPayload): Promise<ApiResponse<ProjectRecord>> => {
    try {
      const response = await apiClient.post<ApiResponse<ProjectRecord>>('/api/v1/update/updateProjects', data);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  updateSkill: async (data: UpdateSkillPayload): Promise<ApiResponse<SkillRecord>> => {
    try {
      const response = await apiClient.post<ApiResponse<SkillRecord>>('/api/v1/update/updateSkills', data);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  updateAchievement: async (data: UpdateAchievementPayload): Promise<ApiResponse<AchievementRecord>> => {
    try {
      const response = await apiClient.post<ApiResponse<AchievementRecord>>('/api/v1/update/updateAchievements', data);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  updatePor: async (data: UpdatePorPayload): Promise<ApiResponse<PorRecord>> => {
    try {
      const response = await apiClient.post<ApiResponse<PorRecord>>('/api/v1/update/updatePor', data);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  updatePublication: async (data: UpdatePublicationPayload): Promise<ApiResponse<PublicationRecord>> => {
    try {
      const response = await apiClient.post<ApiResponse<PublicationRecord>>('/api/v1/update/updatePublications', data);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },
};





export { ApiError };
