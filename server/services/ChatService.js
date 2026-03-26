const OpenAI = require('openai');
const Conversation = require('../models/Conversation');
const notificationService = require('./NotificationService');

const APPOINTMENT_CONFIRMED_PREFIX = 'APPOINTMENT_CONFIRMED|';

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

  async sendMessage(sessionId, userMessage) {
    const conversation = this.getOrCreateConversation(sessionId);

    // START_CONVERSATION is a frontend trigger for the opening greeting;
    // don't add it to history — just ask GPT to greet the patient.
    const isGreeting = userMessage === 'START_CONVERSATION';
    if (!isGreeting) {
      conversation.addMessage('user', userMessage);
    }

    const systemPrompt = this.buildSystemPrompt(conversation);

    const historyMessages = conversation.messages.map(({ role, content }) => ({ role, content }));

    // For the greeting, inject a user turn so GPT knows to open the conversation
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

    const rawResponse = completion.choices[0].message.content;
    console.log('[ChatService] GPT raw response:\n', rawResponse);

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

════════════════════════════════════════
CRITICAL — READ THIS FIRST:
When a patient confirms a specific appointment slot, your response MUST begin with this token on its own line, before anything else:
APPOINTMENT_CONFIRMED|{doctorId}|{YYYY-MM-DD}|{time}

Use the slot-ref values provided in the AVAILABLE SLOTS section below to build this token exactly. The slot-ref format is: date|time|doctorId.

Example output when patient confirms a slot:
APPOINTMENT_CONFIRMED|dr-anita-patel|2026-03-27|1:00 PM
Your appointment with Dr. Anita Patel is confirmed for Thursday, March 27 at 1:00 PM. We'll see you then!

NEVER skip this token when a patient confirms a slot. The system cannot book the appointment without it.
════════════════════════════════════════
${doctorContext}
APPOINTMENT BOOKING WORKFLOW:
1. On the opening message, greet the patient warmly and ask for their first name, last name, and date of birth in one message.
2. Once you have their name and DOB, ask for their phone number AND email address in ONE single message. You must ask for both in the same message. Never ask for phone in one message and email in a separate message.
3. Once you have phone and email, ask for their reason for visit AND their preferred day or time of week — in the same message.
4. Once you have the reason for visit, available slots are shown above. Present exactly 3–5 of those slots as a bulleted list, one per line, in this exact format:
   - Weekday, Month Day at H:MM AM/PM
   Example: - Wednesday, April 9 at 10:00 AM
   (Never show the slot-ref codes to the patient — those are for your internal use only.)
5. If the patient requests a specific day (e.g. "do you have a Tuesday?"), show only slots on that day in the same bullet format.
6. When the patient confirms a slot, output the APPOINTMENT_CONFIRMED token exactly as described in the CRITICAL section above, then follow with a warm confirmation message.

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
- Follow the batching rules in the workflow above — collect related fields together, but never ask more than the fields specified per step.
- Never reveal slot-ref codes or raw doctor IDs to the patient.
- Always format slot lists as bullet lines starting with "- " exactly as shown — never use numbered lists for slots.`;
  }

  async _handleAppointmentConfirmation(rawResponse, conversation) {
    const lines = rawResponse.split('\n');
    const confirmationLineIndex = lines.findIndex((l) =>
      l.trim().startsWith(APPOINTMENT_CONFIRMED_PREFIX)
    );

    if (confirmationLineIndex === -1) {
      console.log('[ChatService] No APPOINTMENT_CONFIRMED token found in GPT response.');
      console.log('[ChatService] Raw GPT response:\n', rawResponse);
      return { cleanedResponse: rawResponse, appointmentInfo: null };
    }

    const confirmationLine = lines[confirmationLineIndex].trim();
    console.log('[ChatService] APPOINTMENT_CONFIRMED token detected:', confirmationLine);

    const parts = confirmationLine.split('|');

    // parts: ['APPOINTMENT_CONFIRMED', doctorId, date, time]
    if (parts.length < 4) {
      console.error('[ChatService] Malformed token — expected 4 pipe-separated parts, got:', parts);
      lines.splice(confirmationLineIndex, 1);
      return { cleanedResponse: lines.join('\n').trim(), appointmentInfo: null };
    }

    const [, doctorId, date, ...timeParts] = parts;
    const time = timeParts.join('|');
    console.log(`[ChatService] Calling bookSlot — doctorId: "${doctorId}", date: "${date}", time: "${time}"`);

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
      console.log('[ChatService] bookSlot succeeded:', JSON.stringify(booked));

      // Send confirmation email — best-effort, never blocks the booking response
      try {
        const doctor = this.doctorRepository.getById(doctorId);
        console.log('[ChatService] patientInfo at email send:', JSON.stringify(conversation.patientInfo));
        await notificationService.sendConfirmationEmail(conversation.patientInfo, doctor, booked);
      } catch (emailErr) {
        console.error('[ChatService] Confirmation email failed (non-fatal):', emailErr.message);
      }
    } catch (err) {
      console.error('[ChatService] bookSlot failed:', err.message);
      console.error('[ChatService] Doctor availability sample:',
        this.appointmentService.doctorRepository.getById(doctorId)?.availability?.slice(0, 3)
      );
    }

    lines.splice(confirmationLineIndex, 1);
    const cleanedResponse = lines.join('\n').trim();

    return { cleanedResponse, appointmentInfo };
  }

  extractPatientInfo(conversation, userMessage, aiResponse) {
    const current = conversation.patientInfo || {};

    // Scan the full user message history on every turn so fields found in any
    // message are picked up, regardless of what order the patient provided them.
    const allUserText = conversation.messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' ');

    let updated = { ...current };

    // First name — scan all user messages
    if (!updated.firstName) {
      // Try "my name is Firstname" / "name: Firstname" patterns first
      const namePatternMatch = allUserText.match(
        /(?:my name is|i(?:'m| am)|name\s*[:\-])\s+([A-Z][a-z]+)/i
      );
      if (namePatternMatch) {
        updated.firstName = namePatternMatch[1];
      } else {
        // Fall back: first capitalised word in the earliest user message
        const firstUserMsg = conversation.messages.find((m) => m.role === 'user');
        if (firstUserMsg) {
          const capWord = firstUserMsg.content.match(/\b([A-Z][a-z]{1,})\b/);
          if (capWord) updated.firstName = capWord[1];
        }
      }
    }

    // Email — /[\w.-]+@[\w.-]+\.\w+/
    if (!updated.email) {
      const emailMatch = allUserText.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) {
        updated.email = emailMatch[0];
      }
    }

    // Phone — /[\d\s\-().+]{7,}/
    if (!updated.phone) {
      const phoneMatch = allUserText.match(/[\d\s\-().+]{7,}/);
      if (phoneMatch) {
        updated.phone = phoneMatch[0].trim();
      }
    }

    // Reason — keyword match against the doctor roster
    if (!updated.reason) {
      const doctor = this.doctorMatchService.matchDoctor(allUserText);
      if (doctor) {
        updated.reason = allUserText.slice(0, 200);
      }
    }

    conversation.patientInfo = updated;
  }

  extractAppointmentInfo(conversation, aiResponse) {
    // Handled directly in _handleAppointmentConfirmation
  }
}

module.exports = ChatService;
