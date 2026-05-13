import axios from 'axios';
import { getToken } from './utils/tokenStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

const api = axios.create({
    baseURL: API_BASE
});

// Intercept requests to attach JWT automatically
api.interceptors.request.use(config => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Fetch my active evaluation
export const getMyEvaluation = async (cycleId) => {
    const response = await api.get(`/evaluations/cycle/${cycleId}`);
    return response.data;
};

// Save Self Evaluation via DTO
export const saveSelfEvaluation = async (cycleId, payload) => {
    const response = await api.post(`/evaluations/cycle/${cycleId}`, payload);
    return response.data;
};

// Fetch Team Evaluations for Coach
export const getTeamEvaluations = async (cycleId, params = {}) => {
    const res = await api.get(`/evaluations/team/${cycleId}`, { params });
    return res.data;
};

export const getAnalyticsHubData = async (cycleId) => {
    const res = await api.get(`/analytics/hub/${cycleId}`);
    return res.data;
};

// Save Coach Review via DTO
export const saveEvaluatorReview = async (evaluationId, payload) => {
    const response = await api.put(`/evaluations/${evaluationId}/evaluator`, payload);
    return response.data;
};

// Fetch single evaluation by ID
export const getEvaluationById = async (evaluationId) => {
    const response = await api.get(`/evaluations/${evaluationId}`);
    return response.data;
};

// Auth API mappings
export const getMyProfile = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

// Finalize Cycle
export const completeEvaluation = async (evaluationId) => {
    const response = await api.post(`/evaluations/${evaluationId}/complete`);
    return response.data;
};

// Form Submissions (JSON based)
export const submitForm = async (payload) => {
    const response = await api.post('/forms/submit', payload);
    return response.data;
};

export const getFormHistory = async (candidateId) => {
    const response = await api.get('/forms/history', { params: { candidateId } });
    return response.data;
};

export const getFormSubmissionById = async (id) => {
    const response = await api.get(`/forms/${id}`);
    return response.data;
};

export const getCandidates = async () => {
    const response = await api.get('/forms/candidates');
    return response.data;
};

// Notifications
export const getNotifications = async () => {
    const response = await api.get('/notifications');
    return response.data;
};

export const markNotificationAsRead = async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
};

export const markAllNotificationsAsRead = async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
};

// Password Recovery
export const requestPasswordReset = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const resetPassword = async (payload) => {
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
};



export default api;
