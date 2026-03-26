const OpenAI = require('openai');
const Conversation = require('../models/Conversation');

const APPOINTMENT_CONFIRMED_PREFIX = 'APPOINTMENT_CONFIRMED|';

class ChatService {
  constructor(appointmentService, doctorMatchService) {
    this.appointmentService = appointmentService;
    this.doctorMatchService = doctorMatchService;
    this.conversations = new Map();
    this._openai = null;
  }

  get openai() {
    if (!this._openai) {
      if (!process.env.OPENAI_API_KEY) {
        const err = new Error('OPENAI_API_KEY is not configured');
        err.status = 503;
        throw err;
      }
      this._openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return this._openai;
  }

  getOrCreateConversation(sessionId) {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, new Conversation({ sessionId }));
    }
    return this.conversations.get(sessionId);
  }

  async sendMessage(sessionId, userMessage) {
    const conversation = this.getOrCreateConversation(sessionId);
    conversation.addMessage('user', userMessage);

    const systemPrompt = this.buildSystemPrompt(conversation);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation.messages.map(({ role, content }) => ({ role, content })),
    ];

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.4,
    });

    const rawResponse = completion.choices[0].message.content;

    const { cleanedResponse, appointmentInfo } = await this._handleAppointmentConfirmation(
      rawResponse,
      conversation
    );

    conversation.addMessage('assistant', cleanedResponse);

    this.extractPatientInfo(conversation, userMessage, cleanedResponse);

    return { reply: cleanedResponse, appointmentInfo };
  }

  buildSystemPrompt(conversation) {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let doctorContext = '';
    if (conversation.patientInfo?.reason) {
      const doctor = this.doctorMatchService.matchDoctor(conversation.patientInfo.reason);
      if (doctor) {
        const slots = this.appointmentService.getSlots(doctor.id).slice(0, 8);
        const formattedSlots = slots
          .map((s) => {
            const d = new Date(s.date + 'T00:00:00');
            const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
            const monthDay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            return `- ${dayName} ${monthDay} at ${s.time} (slot-ref: ${s.date}|${s.time}|${doctor.id})`;
          })
          .join('\n');

        doctorContext = `
MATCHED DOCTOR: ${doctor.name} (${doctor.specialty}), ID: ${doctor.id}
AVAILABLE SLOTS (show 3–5 in a readable format, omit the slot-ref from your message to the patient):
${formattedSlots}
`;
      } else {
        doctorContext = `
NO DOCTOR MATCH: The patient's reason does not match any specialist on our roster. Politely let them know we don't currently treat that condition and suggest they contact their primary care physician.
`;
      }
    }

    return `You are a warm, concise medical office assistant for Kyron Medical Practice. Today is ${today}. You help patients schedule appointments, request prescription refills, and answer basic office questions.

APPOINTMENT BOOKING WORKFLOW:
1. Collect conversationally (one or two questions at a time): first name, last name, date of birth, phone number, email, reason for visit.
2. Once you have the reason for visit, a doctor and available slots will be provided to you in this system prompt. Present 3–5 of those slots in a readable format (e.g. "Monday April 7 at 10:00 AM").
3. If the patient requests a specific day (e.g. "do you have a Tuesday?"), show only slots on that day.
4. When the patient confirms a specific slot, you MUST respond with the following token on its own line BEFORE your warm message:
   APPOINTMENT_CONFIRMED|<doctorId>|<date>|<time>
   Example: APPOINTMENT_CONFIRMED|dr-anita-patel|2026-04-07|10:00 AM
   Then follow with a warm confirmation message.
${doctorContext}
PRESCRIPTION REFILL WORKFLOW:
- If the patient mentions a prescription, refill, or medication: collect their name, DOB, medication name, pharmacy name and phone number.
- Then confirm: "Your refill request has been submitted. The doctor's office will follow up within 24–48 hours."

OFFICE INFO WORKFLOW:
- If the patient asks about hours, address, location, or phone, respond with:
  "We are located at 123 Medical Plaza, Providence, RI 02903. Our hours are Monday–Friday 8:00 AM – 6:00 PM and Saturday 9:00 AM – 1:00 PM. Our main line is (401) 555-0100."

SAFETY RULE:
- If the patient asks for medical advice, a diagnosis, or a treatment recommendation, always respond:
  "I'm not able to provide medical advice. Please speak with your doctor directly."

STYLE:
- Keep responses concise and human. Never sound robotic.
- Never ask more than two questions at once.
- Never reveal internal slot-ref codes or doctor IDs to the patient.`;
  }

  async _handleAppointmentConfirmation(rawResponse, conversation) {
    const lines = rawResponse.split('\n');
    const confirmationLineIndex = lines.findIndex((l) =>
      l.trim().startsWith(APPOINTMENT_CONFIRMED_PREFIX)
    );

    if (confirmationLineIndex === -1) {
      return { cleanedResponse: rawResponse, appointmentInfo: null };
    }

    const confirmationLine = lines[confirmationLineIndex].trim();
    const parts = confirmationLine.split('|');

    // parts: ['APPOINTMENT_CONFIRMED', doctorId, date, time]
    if (parts.length < 4) {
      lines.splice(confirmationLineIndex, 1);
      return { cleanedResponse: lines.join('\n').trim(), appointmentInfo: null };
    }

    const [, doctorId, date, ...timeParts] = parts;
    const time = timeParts.join('|'); // handles times with | in them (safety)

    let appointmentInfo = null;
    try {
      const booked = this.appointmentService.bookSlot(
        doctorId,
        date,
        time,
        conversation.patientInfo
      );
      appointmentInfo = booked;
      conversation.appointmentInfo = booked;
    } catch (err) {
      console.error('[ChatService] bookSlot failed:', err.message);
    }

    lines.splice(confirmationLineIndex, 1);
    const cleanedResponse = lines.join('\n').trim();

    return { cleanedResponse, appointmentInfo };
  }

  extractPatientInfo(conversation, userMessage, aiResponse) {
    if (conversation.patientInfo?.email) return; // already complete

    const combined = `${userMessage} ${aiResponse}`.toLowerCase();

    // Only attempt extraction if we haven't started yet OR we have a partial record
    const current = conversation.patientInfo || {};

    // Simple heuristic extraction — GPT handles collection; this gives us a structured snapshot
    if (!current.reason) {
      // Look for reason keywords across all user messages so far
      const allUserText = conversation.messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join(' ');

      const doctor = this.doctorMatchService.matchDoctor(allUserText);
      if (doctor) {
        conversation.patientInfo = { ...current, reason: allUserText.slice(0, 200) };
      }
    }
  }

  extractAppointmentInfo(conversation, aiResponse) {
    // Handled directly in _handleAppointmentConfirmation
  }
}

module.exports = ChatService;
