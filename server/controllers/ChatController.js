class ChatController {
  constructor(chatService) {
    this.chatService = chatService;
    this.chat = this.chat.bind(this);
  }

  async chat(req, res, next) {
    try {
      const { sessionId, message } = req.body;

      if (!sessionId || !message) {
        const err = new Error('sessionId and message are required');
        err.status = 400;
        throw err;
      }

      const { reply } = await this.chatService.sendMessage(sessionId, message);

      res.json({ reply, sessionId });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ChatController;
