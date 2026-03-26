class AppointmentController {
  constructor(appointmentService) {
    this.appointmentService = appointmentService;
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

  bookAppointment(req, res, next) {
    try {
      const { doctorId, date, time, patient } = req.body;

      if (!doctorId || !date || !time) {
        const err = new Error('doctorId, date, and time are required');
        err.status = 400;
        throw err;
      }

      const appointment = this.appointmentService.bookSlot(doctorId, date, time, patient);
      res.status(201).json(appointment);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AppointmentController;
