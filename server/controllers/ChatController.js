class ChatController {
  chat(req, res) {
    res.json({ message: 'Chat service coming in Phase 3' });
  }
}

module.exports = new ChatController();
