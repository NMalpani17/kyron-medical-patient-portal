import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const getDoctors = (keyword) =>
  api.get('/doctors', { params: keyword ? { keyword } : {} }).then((r) => r.data);

export const getDoctorById = (id) =>
  api.get(`/doctors/${id}`).then((r) => r.data);

export const sendMessage = (sessionId, message) =>
  api.post('/chat', { sessionId, message }).then((r) => r.data);

export const initiateVoiceCall = (data) =>
  api.post('/voice/initiate', data).then((r) => r.data);

export const getSlots = (doctorId) =>
  api.get(`/appointment/slots/${doctorId}`).then((r) => r.data);

export const getSlotsForSession = (sessionId) =>
  api.get(`/appointment/slots-for-session/${sessionId}`).then((r) => r.data);

export const getPatientContext = (sessionId) =>
  api.get(`/appointment/patient-context/${sessionId}`).then((r) => r.data);

export const bookAppointment = (data) =>
  api.post('/appointment/book', data).then((r) => r.data);

export default api;
