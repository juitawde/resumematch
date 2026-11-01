import axios from 'axios';

// Centralized API base URL configuration:
// 1. In production (Vercel), VITE_API_URL can be set to either:
//    - "https://your-backend.onrender.com" OR
//    - "https://your-backend.onrender.com/api"
// 2. In local development (Vite), if VITE_API_URL is omitted, it defaults to "/api"
//    which is proxied by Vite to http://127.0.0.1:4000/api.
const rawBaseUrl = import.meta.env.VITE_API_URL || '/api';
const baseURL = (() => {
  if (!rawBaseUrl || rawBaseUrl === '/api') return '/api';
  const trimmed = rawBaseUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
})();

const api = axios.create({
  baseURL,
  timeout: 120000,
  withCredentials: true,
});

export const getStatus = () => api.get('/config/status').then((r) => r.data);
export const getAnalyses = () => api.get('/analyses').then((r) => r.data);
export const getAnalysis = (id) => api.get(`/analyses/${id}`).then((r) => r.data);
export const createAnalysis = (data) =>
  api
    .post('/analyses', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
export const deleteAnalysis = (id) => api.delete(`/analyses/${id}`).then((r) => r.data);
export const tailorAnalysis = (id, focus = '', section = 'all') =>
  api.post(`/analyses/${id}/tailor`, { focus, section }).then((r) => r.data);
export const validateAnalysis = (id, tailoredData) =>
  api.post(`/analyses/${id}/validate`, { tailoredData }).then((r) => r.data);
export const getReport = (id) => api.get(`/analyses/${id}/report`).then((r) => r.data);

export const updateResume = (id, payload) =>
  api.put(`/analyses/${id}/resume`, payload).then((r) => r.data);

export const restoreResume = (id, { section = 'all', source = 'cleaned' } = {}) =>
  api.post(`/analyses/${id}/restore`, { section, source }).then((r) => r.data);

export const fetchResumePdfBlob = async (id, payload = {}) => {
  const response = await api.post(`/analyses/${id}/pdf`, payload, {
    responseType: 'blob',
  });
  return new Blob([response.data], { type: 'application/pdf' });
};

export const exportResumePdf = async (id, payload = {}) => {
  const response = await api.post(`/analyses/${id}/pdf`, payload, {
    responseType: 'blob',
  });

  let filename = 'Tailored_Resume.pdf';
  const disposition = response.headers['content-disposition'];
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) filename = match[1];
  }

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
  return filename;
};

export const getUserSettings = () => api.get('/settings').then((r) => r.data);
export const updateUserSettings = (settings) => api.put('/settings', { settings }).then((r) => r.data);
export const clearAnalysesHistory = () => api.post('/analyses/clear').then((r) => r.data);
