import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatWindow from './components/ChatWindow';
import { sendMessage } from './services/api';

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const BG_STYLE = {
  minHeight: '100dvh',
  background: 'linear-gradient(135deg, #0A1628 0%, #0D1F3C 50%, #0A1628 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
};

// Subtle animated orb behind the chat for visual depth
function BackgroundOrbs() {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: '-20%',
          left: '-10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-15%',
          right: '-8%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

export default function App() {
  const [sessionId] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : generateId()
  );
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appointmentBooked, setAppointmentBooked] = useState(false);
  const [appointmentInfo, setAppointmentInfo] = useState(null);
  const greetingSent = useRef(false);

  const handleSendMessage = useCallback(
    async (text) => {
      // Optimistically add user message (unless it's the hidden greeting trigger)
      const isGreeting = text === 'START_CONVERSATION';

      if (!isGreeting) {
        setMessages((prev) => [
          ...prev,
          { id: generateId(), role: 'user', content: text },
        ]);
      }

      setIsLoading(true);

      try {
        const data = await sendMessage(sessionId, text);

        setMessages((prev) => [
          ...prev,
          { id: generateId(), role: 'assistant', content: data.reply },
        ]);

        if (data.appointmentBooked === true) {
          setAppointmentBooked(true);
          setAppointmentInfo(data.appointmentInfo || null);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'assistant',
            content:
              "I'm sorry, I encountered an error. Please try again in a moment.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  // Send greeting on mount
  useEffect(() => {
    if (greetingSent.current) return;
    greetingSent.current = true;
    handleSendMessage('START_CONVERSATION');
  }, [handleSendMessage]);

  return (
    <div style={BG_STYLE}>
      <BackgroundOrbs />
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        appointmentBooked={appointmentBooked}
        appointmentInfo={appointmentInfo}
        sessionId={sessionId}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
