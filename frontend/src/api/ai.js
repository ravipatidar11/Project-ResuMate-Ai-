import api from './client';

export const aiAPI = {
  getStatus: () => api.get('/ai/status'),
  generateSummary: (data) => api.post('/ai/generate-summary', data),
  improveSummary: (data) => api.post('/ai/improve-summary', data),
  improveExperience: (data) => api.post('/ai/improve-experience', data),
  generateProjectDesc: (data) => api.post('/ai/generate-project-desc', data),
  generateBullets: (data) => api.post('/ai/generate-bullets', data),
  improveSkills: (data) => api.post('/ai/improve-skills', data),
  makeAtsFriendly: (data) => api.post('/ai/make-ats-friendly', data),
};
