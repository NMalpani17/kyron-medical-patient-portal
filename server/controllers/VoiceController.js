class VoiceController {
  constructor(chatService, voiceService) {
    this.chatService = chatService;
    this.voiceService = voiceService;
    this.initiate = this.initiate.bind(this);
    this.context = this.context.bind(this);
  }

  async initiate(req, res, next) {
    try {
      const { sessionId, phone, patientName } = req.body;

      if (!phone) {
        const err = new Error('phone is required');
        err.status = 400;
        throw err;
      }

      const { patientInfo, doctor } = this.chatService.getConversationContext(sessionId);
      const conversationHistory = this.chatService.getConversationMessages(sessionId);
      console.log('[VoiceController] received phone:', req.body.phone, 'patientInfo:', patientInfo);

      await this.voiceService.initiateCall({
        phone,
        patientName: patientName || patientInfo?.firstName || null,
        conversationHistory,
        patientInfo,
        doctor,
      });

      res.json({ success: true, message: 'Our AI will call you shortly' });
    } catch (err) {
      next(err);
    }
  }

  context(req, res, next) {
    try {
      const { sessionId } = req.body;
      const { patientInfo, doctor } = this.chatService.getConversationContext(sessionId);
      const messages = this.chatService.getConversationMessages(sessionId);
      res.json({ patientInfo, doctor, messages });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = VoiceController;
