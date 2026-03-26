const doctorRepository = require('../repositories/DoctorRepository');

class DoctorMatchService {
  matchDoctor(reasonForVisit) {
    if (!reasonForVisit) return null;

    const words = reasonForVisit.toLowerCase().split(/\s+/);
    const doctors = doctorRepository.getAll();

    let bestMatch = null;
    let highScore = 0;

    for (const doctor of doctors) {
      let score = 0;

      for (const keyword of doctor.keywords) {
        const kLower = keyword.toLowerCase();

        if (reasonForVisit.toLowerCase().includes(kLower)) {
          score += kLower.split(' ').length;
        } else {
          for (const word of words) {
            if (kLower.includes(word) && word.length > 2) {
              score += 1;
            }
          }
        }
      }

      if (score > highScore) {
        highScore = score;
        bestMatch = doctor;
      }
    }

    return highScore > 0 ? bestMatch : null;
  }
}

module.exports = new DoctorMatchService();
