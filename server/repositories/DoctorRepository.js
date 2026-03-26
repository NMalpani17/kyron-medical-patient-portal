const doctorsData = require('../data/doctors');
const Doctor = require('../models/Doctor');

class DoctorRepository {
  constructor() {
    this.doctors = doctorsData.map((d) => new Doctor(d));
  }

  getAll() {
    return this.doctors;
  }

  getById(id) {
    return this.doctors.find((d) => d.id === id) || null;
  }

  findByKeyword(keyword) {
    const lower = keyword.toLowerCase();
    return this.doctors.filter((d) =>
      d.keywords.some((k) => k.toLowerCase().includes(lower))
    );
  }
}

module.exports = new DoctorRepository();
