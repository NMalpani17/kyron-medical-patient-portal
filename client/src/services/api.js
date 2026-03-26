import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const getDoctors = (keyword) =>
  api.get('/doctors', { params: keyword ? { keyword } : {} }).then((r) => r.data);

export const getDoctorById = (id) =>
  api.get(`/doctors/${id}`).then((r) => r.data);

export default api;
