const OpenAI = require('openai');
const Conversation = require('../models/Conversation');

class ChatService {
  constructor(appointmentService, doctorMatchService, doctorRepository) {
    this.appointmentService = appointmentService;
    this.doctorMatchService = doctorMatchService;
    this.doctorRepository = doctorRepository;
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

  getConversationByPhone(phone) {
    const digits = String(phone).replace(/\D/g, '');
    for (const conversation of this.conversations.values()) {
      const stored = String(conversation.patientInfo?.phone || '').replace(/\D/g, '');
      if (stored && stored === digits) {
        const patientInfo = conversation.patientInfo;
        let doctor = null;
        if (patientInfo?.reason) {
          doctor = this.doctorMatchService.matchDoctor(patientInfo.reason);
        }
        return { patientInfo, doctor };
      }
    }
    return null;
  }

  getConversationMessages(sessionId) {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) return [];
    return conversation.messages.map(({ role, content }) => ({ role, content }));
  }

  getConversationContext(sessionId) {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) return { patientInfo: null, doctor: null };

    const patientInfo = conversation.patientInfo || null;
    let doctor = null;
    if (patientInfo?.reason) {
      doctor = this.doctorMatchService.matchDoctor(patientInfo.reason);
    }
    return { patientInfo, doctor };
  }

  async sendMessage(sessionId, userMessage) {
    const conversation = this.getOrCreateConversation(sessionId);

    const isGreeting = userMessage === 'START_CONVERSATION';
    if (!isGreeting) {
      conversation.addMessage('user', userMessage);
    }

    const systemPrompt = this.buildSystemPrompt(conversation);
    const historyMessages = conversation.messages.map(({ role, content }) => ({ role, content }));

    if (isGreeting) {
      historyMessages.push({
        role: 'user',
        content: 'Hello, I need to schedule an appointment.',
      });
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
    ];

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.4,
    });

    const reply = completion.choices[0].message.content;

    conversation.addMessage('assistant', reply);
    this.extractPatientInfo(conversation, userMessage, reply);

    return { reply };
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
        doctorContext = `
MATCHED DOCTOR: ${doctor.name} (${doctor.specialty})
`;
      } else {
        doctorContext = `
NO DOCTOR MATCH: The patient's reason does not match any specialist on our roster. Politely let them know we don't currently treat that condition and suggest they contact their primary care physician.
`;
      }
    }

    return `You are a medical scheduling assistant ONLY. Your sole job is booking appointments. When a patient mentions ANY symptom or body part (chest pain, heart attack, headache, knee pain, rash, back pain, dizziness, migraines, skin issues, nerve pain), immediately show available appointment slots. NEVER say call 911. NEVER say go to emergency room. NEVER assess urgency. Just book the appointment.

You are a warm, concise scheduling assistant for Kyron Medical Practice. Today is ${today}.
${doctorContext}
APPOINTMENT BOOKING WORKFLOW:
1. On the opening message, greet the patient warmly and ask for their first name, last name, and date of birth in one message.
2. Once you have their name and DOB, ask for their phone number AND email address in ONE single message. You must ask for both in the same message. Never ask for phone in one message and email in a separate message.
3. Once you have phone and email, ask for their reason for visit AND their preferred day or time of week — in the same message.
4. Once you have the reason for visit, say exactly: "Here are some available appointment slots for you:" — nothing else on that turn. Do not list any dates or times. The system will display the slots automatically.

PRESCRIPTION REFILL WORKFLOW:
- If the patient mentions a prescription, refill, or medication: collect their name, DOB, medication name, pharmacy name and phone number.
- Then confirm: "Your refill request has been submitted. The doctor's office will follow up within 24–48 hours."

OFFICE INFO WORKFLOW:
- If the patient asks about hours, address, location, or phone, respond with:
  "We are located at 123 Medical Plaza, Providence, RI 02903. Our hours are Monday–Friday 8:00 AM – 6:00 PM and Saturday 9:00 AM – 1:00 PM. Our main line is (401) 555-0100."

STYLE:
- Keep responses concise and human. Never sound robotic.
- Follow the batching rules in the workflow above — collect related fields together, but never ask more than the fields specified per step.`;
  }

  extractPatientInfo(conversation, userMessage, aiResponse) {
    const current = conversation.patientInfo || {};

    const allUserText = conversation.messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' ');

    let updated = { ...current };

    if (!updated.firstName) {
      const namePatternMatch = allUserText.match(
        /(?:my name is|i(?:'m| am)|name\s*[:\-])\s+([A-Z][a-z]+)/i
      );
      if (namePatternMatch) {
        updated.firstName = namePatternMatch[1];
      } else {
        const firstUserMsg = conversation.messages.find((m) => m.role === 'user');
        if (firstUserMsg) {
          const capWord = firstUserMsg.content.match(/\b([A-Z][a-z]{1,})\b/);
          if (capWord) updated.firstName = capWord[1];
        }
      }
    }

    if (!updated.email) {
      const emailMatch = allUserText.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) updated.email = emailMatch[0];
    }

    if (!updated.phone) {
      const phoneMatch = allUserText.match(/\b(\+?1?\s?[-.]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/);
      if (phoneMatch) updated.phone = phoneMatch[1].trim();
    }

    if (!updated.reason) {
      const doctor = this.doctorMatchService.matchDoctor(allUserText);
      if (doctor) updated.reason = allUserText.slice(0, 200);
    }

    conversation.patientInfo = updated;
  }
}

module.exports = ChatService;
