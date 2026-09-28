import api from './client';

export const uploadAPI = {
  importResume: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadAndParse: (formData) => api.post('/upload/parse', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};
