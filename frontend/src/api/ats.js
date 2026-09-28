import api from './client';

export const atsAPI = {
  analyzeText: (data) => api.post('/ats/analyze', data),
  analyzeResume: (resumeId, jobDescription = '') => api.post(`/ats/analyze-resume/${resumeId}`, null, {
    params: jobDescription ? { job_description: jobDescription } : {},
  }),
  getHistory: () => api.get('/ats/history'),
  getAnalysisDetail: (analysisId) => api.get(`/ats/history/${analysisId}`),
  deleteAnalysis: (analysisId) => api.delete(`/ats/history/${analysisId}`),
};
