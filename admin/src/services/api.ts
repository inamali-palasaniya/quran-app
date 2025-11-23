import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Kitabs
export const kitabsApi = {
    getAll: () => api.get('/kitabs'),
    getById: (id: number) => api.get(`/kitabs/${id}`),
    create: (data: any) => api.post('/kitabs', data),
    update: (id: number, data: any) => api.put(`/kitabs/${id}`, data),
    delete: (id: number) => api.delete(`/kitabs/${id}`),
};

// Surahs
export const surahsApi = {
    getAll: (kitabId?: number) => api.get('/surahs', { params: { kitabId } }),
    getById: (id: number) => api.get(`/surahs/${id}`),
    create: (data: any) => api.post('/surahs', data),
    update: (id: number, data: any) => api.put(`/surahs/${id}`, data),
    delete: (id: number) => api.delete(`/surahs/${id}`),
};

// Ayahs
export const ayahsApi = {
    getAll: (surahId?: number) => api.get('/ayahs', { params: { surahId } }),
    getById: (id: number) => api.get(`/ayahs/${id}`),
    create: (data: any) => api.post('/ayahs', data),
    update: (id: number, data: any) => api.put(`/ayahs/${id}`, data),
    delete: (id: number) => api.delete(`/ayahs/${id}`),
};

// Tafseer
export const tafseerApi = {
    getByAyah: (ayahId: number) => api.get(`/ayahs/${ayahId}`), // Tafseer is included in Ayah response
    create: (ayahId: number, data: any) => api.post('/tafsir', { ...data, ayahId }),
    update: (id: number, data: any) => api.put(`/tafsir/${id}`, data),
    delete: (id: number) => api.delete(`/tafsir/${id}`),
};

// Reciters
export const recitersApi = {
    getAll: () => api.get('/reciters'),
    getById: (id: number) => api.get(`/reciters/${id}`),
    create: (data: any) => api.post('/reciters', data),
    update: (id: number, data: any) => api.put(`/reciters/${id}`, data),
    delete: (id: number) => api.delete(`/reciters/${id}`),
};

export default api;
