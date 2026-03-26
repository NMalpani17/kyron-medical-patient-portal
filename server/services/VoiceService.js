class VoiceService {
  formatPhone(phone) {
    const digits = String(phone).replace(/\D/g, '');
    if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    return `+${digits}`;
  }

  buildVoiceSystemPrompt(patientInfo, doctor, messages) {
    const firstName = patientInfo?.firstName || '';
    const lastName = patientInfo?.lastName || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';

    // Summarise the conversation in plain text (last 8 turns)
    const recent = (messages || []).slice(-8);
    const summary = recent
      .map((m) => `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.content}`)
      .join('\n');

    let prompt =
      'You are a warm medical office assistant for Kyron Medical Practice ' +
      'continuing a conversation that started on the web chat portal.\n\n';

    prompt += 'PATIENT INFO:\n';
    prompt += `Name: ${fullName}\n`;
    if (patientInfo?.dob) prompt += `Date of birth: ${patientInfo.dob}\n`;
    if (patientInfo?.phone) prompt += `Phone: ${patientInfo.phone}\n`;
    if (patientInfo?.email) prompt += `Email: ${patientInfo.email}\n`;
    if (patientInfo?.reason) prompt += `Reason for visit: ${patientInfo.reason}\n`;

    if (doctor) {
      prompt += `\nMATCHED SPECIALIST: ${doctor.name} (${doctor.specialty})\n`;
    }

    if (summary) {
      prompt += `\nRECENT CONVERSATION:\n${summary}\n`;
    }

    prompt +=
      '\nYour job is to help the patient complete or confirm their appointment booking. ' +
      'NEVER provide medical advice or diagnoses. Keep responses short — this is a phone call.';

    return prompt;
  }

  async initiateCall({ phone, patientName, conversationHistory, patientInfo, doctor }) {
    if (!process.env.VAPI_API_KEY) {
      const err = new Error('VAPI_API_KEY is not configured');
      err.status = 503;
      throw err;
    }
    if (!process.env.VAPI_PHONE_NUMBER_ID) {
      const err = new Error('VAPI_PHONE_NUMBER_ID is not configured');
      err.status = 503;
      throw err;
    }

    const formattedPhone = this.formatPhone(phone);
    const firstName = patientName || patientInfo?.firstName || 'there';
    const systemContent = this.buildVoiceSystemPrompt(
      patientInfo,
      doctor,
      conversationHistory || []
    );

    const payload = {
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: { number: formattedPhone },
      assistant: {
        name: 'Kyron Medical Assistant',
        firstMessage: `Hi ${firstName}, this is the Kyron Medical assistant continuing from your web chat. How can I help you?`,
        voice: {
          provider: 'vapi',
          voiceId: 'Elliot',
        },
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemContent }],
          temperature: 0.7,
          maxTokens: 150,
        },
      },
    };

    console.log('[VoiceService] Initiating Vapi call to', formattedPhone);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log('[VoiceService] Vapi response status:', response.status);
    const responseBody = await response.json();
    console.log('[VoiceService] Vapi response body:', JSON.stringify(responseBody));

    if (!response.ok) {
      throw new Error(`Vapi API error: ${response.status} ${JSON.stringify(responseBody)}`);
    }

    return responseBody;
  }
}

module.exports = VoiceService;
