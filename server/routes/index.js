const express = require('express');
const router = express.Router();

const doctorRepository = require('../repositories/DoctorRepository');
const doctorMatchService = require('../services/DoctorMatchService');
const AppointmentService = require('../services/AppointmentService');
const ChatService = require('../services/ChatService');
const AppointmentController = require('../controllers/AppointmentController');
const ChatController = require('../controllers/ChatController');
const voiceController = require('../controllers/VoiceController');

// Dependency injection chain
const appointmentService = new AppointmentService(doctorRepository);
const chatService = new ChatService(appointmentService, doctorMatchService, doctorRepository);
const appointmentController = new AppointmentController(appointmentService);
const chatController = new ChatController(chatService);

// Health
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Doctors
router.get('/doctors', (req, res) => {
  const { keyword } = req.query;
  const doctors = keyword
    ? doctorRepository.findByKeyword(keyword)
    : doctorRepository.getAll();
  res.json(doctors);
});

router.get('/doctors/:id', (req, res, next) => {
  const doctor = doctorRepository.getById(req.params.id);
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.status = 404;
    return next(err);
  }
  res.json(doctor);
});

// Appointments
router.get('/appointment/slots/:doctorId', appointmentController.getSlots);
router.post('/appointment/book', appointmentController.bookAppointment);

// Chat
router.post('/chat', chatController.chat);

// Voice (placeholder)
router.post('/voice/initiate', (req, res) => voiceController.initiate(req, res));
router.post('/voice/context', (req, res) => voiceController.context(req, res));

module.exports = router;
