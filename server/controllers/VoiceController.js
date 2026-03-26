const notificationService = require('../services/NotificationService');

class VoiceController {
  constructor(chatService, voiceService) {
    this.chatService = chatService;
    this.voiceService = voiceService;
    this.notificationService = notificationService;
    this.initiate = this.initiate.bind(this);
    this.context = this.context.bind(this);
    this.webhook = this.webhook.bind(this);
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

  async webhook(req, res, next) {
    try {
      const message = req.body?.message;
      if (message?.type !== 'end-of-call-report') {
        return res.json({ received: true });
      }

      const phone = message?.call?.customer?.number;
      if (!phone) return res.json({ received: true });

      const context = this.chatService.getConversationByPhone(phone);
      if (!context) return res.json({ received: true });

      const { patientInfo, doctor } = context;
      if (patientInfo) {
        try {
          await this.notificationService.sendConfirmationEmail(patientInfo, doctor, null);
        } catch (emailErr) {
          console.error('[VoiceController] Webhook email failed (non-fatal):', emailErr.message);
        }
      }

      res.json({ received: true });
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
