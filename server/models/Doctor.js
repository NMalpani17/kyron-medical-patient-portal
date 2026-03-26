class Doctor {
  constructor({ id, name, specialty, bodyPart, keywords, availability }) {
    this.id = id;
    this.name = name;
    this.specialty = specialty;
    this.bodyPart = bodyPart;
    this.keywords = keywords;
    this.availability = availability;
  }
}

module.exports = Doctor;
