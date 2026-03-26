class Patient {
  constructor({ firstName, lastName, dob, phone, email, reason }) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.dob = dob;
    this.phone = phone;
    this.email = email;
    this.reason = reason;
  }
}

module.exports = Patient;
