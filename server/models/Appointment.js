class Appointment {
  constructor({ id, patientId, doctorId, date, time, bookedAt }) {
    this.id = id;
    this.patientId = patientId;
    this.doctorId = doctorId;
    this.date = date;
    this.time = time;
    this.bookedAt = bookedAt || new Date().toISOString();
  }
}

module.exports = Appointment;
