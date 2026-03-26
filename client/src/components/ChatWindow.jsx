import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import VoiceCallButton from "./VoiceCallButton";
import ConfirmationScreen from "./ConfirmationScreen";
import AppointmentSlotCard from "./AppointmentSlotCard";

const glass = {
  background: "rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
};

const inputGlass = {
  background: "rgba(255, 255, 255, 0.06)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "14px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
};

function formatSlotLabel(slot) {
  const d = new Date(slot.date + 'T00:00:00');
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `${dayName}, ${monthDay} at ${slot.time}`;
}

export default function ChatWindow({
  messages,
  isLoading,
  appointmentBooked,
  appointmentInfo,
  sessionId,
  onSendMessage,
  onSlotBook,
  availableSlots,
  patientPhone,
  patientName,
}) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages or when slot cards appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, availableSlots]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e) {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue("");
    onSendMessage(text);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleSlotSelect(slotData) {
    if (isLoading || appointmentBooked) return;
    onSlotBook(slotData);
  }

  return (
    <div
      className="anim-fade-slide-up"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: 720,
        height: "100dvh",
        margin: "0 auto",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          ...glass,
          borderRadius: "0 0 0 0",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          background: "rgba(10, 22, 40, 0.7)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <div>
          <h1
            style={{
              color: "#F8FAFC",
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Kyron Medical
          </h1>
          <p style={{ color: "#94A3B8", fontSize: 13, margin: "2px 0 0" }}>
            Your Health, Simplified
          </p>
        </div>

        <VoiceCallButton
          sessionId={sessionId}
          patientPhone={patientPhone}
          patientName={patientName}
        />
      </div>

      {/* ── Message area / Confirmation ── */}
      <div
        className="chat-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: appointmentBooked ? 0 : "24px 20px 8px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {appointmentBooked ? (
          <ConfirmationScreen appointmentInfo={appointmentInfo} />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onSlotSelect={handleSlotSelect}
              />
            ))}

            {/* Slot cards — rendered from real server data, never from GPT text */}
            {availableSlots.length > 0 && !isLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "4px 0 8px 44px" }}>
                {availableSlots.map((slot, i) => (
                  <AppointmentSlotCard
                    key={`${slot.date}-${slot.time}`}
                    slot={{ date: slot.date, time: slot.time, label: formatSlotLabel(slot) }}
                    onSelect={handleSlotSelect}
                    index={i}
                  />
                ))}
              </div>
            )}

            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ── Input bar ── */}
      {!appointmentBooked && (
        <div
          style={{
            padding: "12px 16px 20px",
            flexShrink: 0,
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              ...inputGlass,
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              padding: "10px 12px",
            }}
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your symptoms or ask a question…"
              rows={1}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#F8FAFC",
                fontSize: 15,
                lineHeight: 1.5,
                resize: "none",
                maxHeight: 120,
                fontFamily: "inherit",
                overflowY: "auto",
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background:
                  inputValue.trim() && !isLoading
                    ? "#3B82F6"
                    : "rgba(255,255,255,0.1)",
                border: "none",
                cursor: inputValue.trim() && !isLoading ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s ease",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 8h12M8 2l6 6-6 6"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>

          <p
            style={{
              color: "#475569",
              fontSize: 11,
              textAlign: "center",
              margin: "8px 0 0",
            }}
          >
            Kyron Medical AI · Not a substitute for professional medical advice
          </p>
        </div>
      )}
    </div>
  );
}
