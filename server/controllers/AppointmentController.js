const notificationService = require('../services/NotificationService');

class AppointmentController {
  constructor(appointmentService, doctorRepository, chatService) {
    this.appointmentService = appointmentService;
    this.doctorRepository = doctorRepository;
    this.chatService = chatService;
    this.getSlots = this.getSlots.bind(this);
    this.bookAppointment = this.bookAppointment.bind(this);
  }

  getSlots(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { day } = req.query;
      const slots = this.appointmentService.getSlots(doctorId, day || null);
      res.json(slots);
    } catch (err) {
      next(err);
    }
  }

  async bookAppointment(req, res, next) {
    try {
      const { doctorId, date, time, sessionId } = req.body;
      let { patient } = req.body;

      if (!doctorId || !date || !time) {
        const err = new Error('doctorId, date, and time are required');
        err.status = 400;
        throw err;
      }

      // Fallback: if patient is missing, look it up from the chat session
      if (!patient && sessionId && this.chatService) {
        const context = this.chatService.getConversationContext(sessionId);
        patient = context.patientInfo || null;
        console.log('[AppointmentController] Patient resolved from session:', patient);
      }

      const appointment = this.appointmentService.bookSlot(doctorId, date, time, patient);

      // Send confirmation email — best-effort, never blocks the response
      try {
        const doctor = this.doctorRepository.getById(doctorId);
        await notificationService.sendConfirmationEmail(patient, doctor, appointment);
      } catch (emailErr) {
        console.error('[AppointmentController] Email failed (non-fatal):', emailErr.message);
      }

      res.status(201).json(appointment);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AppointmentController;
