import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({ baseURL: '/api/v1' });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
          useAuthStore.getState().setTokens(res.data.data.accessToken, res.data.data.refreshToken);
          error.config.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
          return api(error.config);
        } catch {
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email: string, password: string) => api.post('/auth/login', { email, password });
export const register = (email: string, password: string, name: string) => api.post('/auth/register', { email, password, name });
export const getProfile = () => api.get('/auth/profile');
export const updateProfile = (data: any) => api.put('/auth/profile', data);

// Jobs
export const getJobs = (page = 1, limit = 20) => api.get(`/jobs?page=${page}&limit=${limit}`);
export const getMatchedJobs = (page = 1) => api.get(`/jobs/matched?page=${page}`);
export const getJobStats = () => api.get('/jobs/stats');
export const addJobFromUrl = (url: string) => api.post('/jobs/scrape', { url });
export const bulkScrape = (urls: string[]) => api.post('/jobs/bulk-scrape', { urls });
export const searchJobs = (q: string) => api.get(`/jobs/search?q=${q}`);
export const deleteJob = (id: string) => api.delete(`/jobs/${id}`);

// Applications
export const getApplications = (page = 1, status?: string) => api.get(`/applications?page=${page}${status ? `&status=${status}` : ''}`);
export const getApplicationById = (id: string) => api.get(`/applications/${id}`);
export const createApplication = (jobId: string) => api.post('/applications', { jobId });
export const approveApplication = (id: string) => api.patch(`/applications/${id}/approve`);
export const rejectApplication = (id: string) => api.patch(`/applications/${id}/reject`);
export const getApplicationStats = () => api.get('/applications/stats');

// Resumes
export const getResumes = () => api.get('/resumes');
export const uploadResume = (content: string, name: string) => api.post('/resumes', { content, name });
export const generateVariants = () => api.post('/resumes/generate-variants');
export const getATSScore = (id: string, jobDescription: string) => api.post(`/resumes/${id}/ats-score`, { jobDescription });
export const exportResumePDF = (id: string) => api.get(`/resumes/${id}/export/pdf`, { responseType: 'blob' });
export const exportResumeDOCX = (id: string) => api.get(`/resumes/${id}/export/docx`, { responseType: 'blob' });
export const deleteResume = (id: string) => api.delete(`/resumes/${id}`);

// Cover Letters
export const getCoverLetters = () => api.get('/cover-letters');
export const generateCoverLetter = (jobId: string) => api.post('/cover-letters', { jobId });
export const exportCoverLetterPDF = (id: string) => api.get(`/cover-letters/${id}/export/pdf`, { responseType: 'blob' });
export const deleteCoverLetter = (id: string) => api.delete(`/cover-letters/${id}`);

// Analytics
export const getDashboardStats = () => api.get('/analytics/dashboard');
export const getSalaryTrends = () => api.get('/analytics/salary-trends');
export const getTechDemand = () => api.get('/analytics/tech-demand');
export const generateReport = () => api.post('/analytics/report');
export const getNotifications = () => api.get('/notifications');

// AI
export const getAIStatus = () => api.get('/ai/status');
export const aiChat = (message: string) => api.post('/ai/chat', { message });

// Auto-Pilot
export const runAutoPilot = () => api.post('/autopilot/run');

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (data: any) => api.put('/settings', data);

export default api;
