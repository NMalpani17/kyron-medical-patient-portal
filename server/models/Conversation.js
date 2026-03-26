class Conversation {
  constructor({ sessionId, messages = [], patientInfo = null, appointmentInfo = null }) {
    this.sessionId = sessionId;
    this.messages = messages;
    this.patientInfo = patientInfo;
    this.appointmentInfo = appointmentInfo;
  }

  addMessage(role, content) {
    this.messages.push({ role, content, timestamp: new Date().toISOString() });
  }
}

module.exports = Conversation;
