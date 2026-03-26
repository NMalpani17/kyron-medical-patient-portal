class VoiceController {
  initiate(req, res) {
    res.json({ message: 'Voice service coming in Phase 5' });
  }

  context(req, res) {
    res.json({ message: 'Voice service coming in Phase 5' });
  }
}

module.exports = new VoiceController();
