import api from './client';

export const resumesAPI = {
  getAll: () => api.get('/resumes'),
  getById: (id) => api.get(`/resumes/${id}`),
  create: (data) => api.post('/resumes', data),
  update: (id, data) => api.put(`/resumes/${id}`, data),
  delete: (id) => api.delete(`/resumes/${id}`),
  duplicate: (id) => api.post(`/resumes/${id}/duplicate`),
  getVersions: (id) => api.get(`/resumes/${id}/versions`),
  createVersion: (id, data) => api.post(`/resumes/${id}/versions`, data),
  getOriginalFile: (id) => api.get(`/resumes/${id}/source`, { responseType: 'blob' }),
  reimportOriginal: (id) => api.post(`/resumes/${id}/reimport`),
};
