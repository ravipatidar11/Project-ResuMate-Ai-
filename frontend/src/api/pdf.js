import api from './client';

export const pdfAPI = {
  downloadPdf: async (resumeId, template = 'ats_friendly', fileName = 'resume.pdf') => {
    const response = await api.get(`/pdf/export/${resumeId}?template=${template}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadCustomPdf: async (resumeData, template = 'ats_friendly', fileName = 'resume.pdf') => {
    const response = await api.post(`/pdf/export-custom?template=${template}`, resumeData, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
