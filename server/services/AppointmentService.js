const Appointment = require('../models/Appointment');
const { v4: uuidv4 } = require('uuid');

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

class AppointmentService {
  constructor(doctorRepository) {
    this.doctorRepository = doctorRepository;
    this.bookedAppointments = [];
  }

  getSlots(doctorId, dayFilter = null) {
    const doctor = this.doctorRepository.getById(doctorId);
    if (!doctor) {
      const err = new Error('Doctor not found');
      err.status = 404;
      throw err;
    }

    if (!dayFilter) return doctor.availability;

    const targetDay = dayFilter.toLowerCase();
    return doctor.availability.filter((slot) => {
      const dayIndex = new Date(slot.date + 'T00:00:00').getDay();
      return DAY_NAMES[dayIndex] === targetDay;
    });
  }

  bookSlot(doctorId, slotDate, slotTime, patient) {
    const doctor = this.doctorRepository.getById(doctorId);
    if (!doctor) {
      const err = new Error('Doctor not found');
      err.status = 404;
      throw err;
    }

    const slotIndex = doctor.availability.findIndex(
      (s) => s.date === slotDate && s.time === slotTime
    );

    if (slotIndex === -1) {
      const err = new Error('Slot not available');
      err.status = 409;
      throw err;
    }

    doctor.availability.splice(slotIndex, 1);

    const appointment = new Appointment({
      id: uuidv4(),
      patientId: patient?.email || null,
      doctorId,
      date: slotDate,
      time: slotTime,
    });

    this.bookedAppointments.push(appointment);
    return appointment;
  }

  getBookedAppointments() {
    return this.bookedAppointments;
  }
}

module.exports = AppointmentService;
