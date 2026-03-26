import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatWindow from './components/ChatWindow';
import { sendMessage, bookAppointment, getSlotsForSession } from './services/api';

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
  const [availableSlots, setAvailableSlots] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [appointmentBooked, setAppointmentBooked] = useState(false);
  const [appointmentInfo, setAppointmentInfo] = useState(null);
  const greetingSent = useRef(false);

  const handleSendMessage = useCallback(
    async (text) => {
      if (appointmentBooked) return;

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

        try {
          const { slots, patientInfo: pi } = await getSlotsForSession(sessionId);
          if (slots.length > 0) setAvailableSlots(slots.slice(0, 5));
          if (pi) setPatientInfo((prev) => ({ ...prev, ...pi }));
        } catch {
          // non-fatal
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'assistant',
            content: "I'm sorry, I encountered an error. Please try again in a moment.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, appointmentBooked]
  );

  const handleSlotBook = useCallback(
    async ({ date, time }) => {
      if (appointmentBooked || isLoading) return;

      setIsLoading(true);
      try {
        const { doctor, patientInfo, slots } = await getSlotsForSession(sessionId);
        if (!doctor) {
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: 'assistant',
              content: 'Please share your reason for visiting before selecting a slot.',
            },
          ]);
          return;
        }

        const confirmed = slots.find((s) => s.date === date && s.time === time);
        if (!confirmed) {
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: 'assistant',
              content: 'That slot is no longer available. Please choose another time.',
            },
          ]);
          setAvailableSlots(slots);
          return;
        }

        const appointment = await bookAppointment({
          doctorId: doctor.id,
          date,
          time,
          patient: patientInfo,
          sessionId,
        });

        setAppointmentBooked(true);
        setAppointmentInfo(appointment);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'assistant',
            content: "I wasn't able to book that slot — it may no longer be available. Please choose another time.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, appointmentBooked, isLoading]
  );

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
        onSlotBook={handleSlotBook}
        availableSlots={availableSlots}
        patientPhone={patientInfo?.phone || null}
        patientName={patientInfo?.firstName || null}
      />
    </div>
  );
}
