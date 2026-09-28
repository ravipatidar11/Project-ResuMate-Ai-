import api from './client';

export const jobMatchAPI = {
  matchJob: (data) => api.post('/job-match', data),
  optimizeResume: (data) => api.post('/job-match/optimize', data),
  getHistory: () => api.get('/job-match/history'),
  deleteMatch: (matchId) => api.delete(`/job-match/history/${matchId}`),
};
