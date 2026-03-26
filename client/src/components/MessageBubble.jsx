import React, { useState, useEffect } from 'react';
import AppointmentSlotCard from './AppointmentSlotCard';

const SLOT_LINE_RE =
  /^(?:[\-•*]|\d+\.)\s*((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+\w+\s+\d+(?:,?\s*\d{4})?,?\s+at\s+\d{1,2}:\d{2}\s*(?:AM|PM))/im;

function parseSlotLine(m) {
  return { label: m[1].trim() };
}

function parseMessageParts(content) {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const parts = [];
  let textBuffer = [];

  for (const line of lines) {
    const m = line.match(SLOT_LINE_RE);
    if (m) {
      if (textBuffer.length) {
        parts.push({ type: 'text', value: textBuffer.join('\n') });
        textBuffer = [];
      }
      parts.push({ type: 'slot', ...parseSlotLine(m) });
    } else {
      textBuffer.push(line.trimEnd());
    }
  }

  if (textBuffer.length) {
    parts.push({ type: 'text', value: textBuffer.join('\n') });
  }

  return parts;
}

const aiGlass = {
  background: 'rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  padding: '12px 16px',
  maxWidth: '80%',
};

const userBubble = {
  background: '#3B82F6',
  borderRadius: '16px',
  padding: '12px 16px',
  maxWidth: '80%',
};

export default function MessageBubble({ message, onSlotSelect }) {
  const isAI = message.role === 'assistant';

  const [parts, setParts] = useState(() =>
    isAI ? parseMessageParts(message.content) : null
  );

  useEffect(() => {
    setParts(isAI ? parseMessageParts(message.content) : null);
  }, [isAI, message.content]);

  return (
    <div
      className={`flex items-end gap-2 mb-4 ${isAI ? 'justify-start' : 'justify-end anim-slide-in-right'}`}
    >
      {isAI && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14 }}>✦</span>
        </div>
      )}

      {isAI ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: '82%' }}>
          {parts.map((part, i) =>
            part.type === 'text' ? (
              part.value.trim() ? (
                <div key={i} className="anim-slide-in-left" style={aiGlass}>
                  <p style={{ color: '#F8FAFC', fontSize: 15, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {part.value.trim()}
                  </p>
                </div>
              ) : null
            ) : (
              <AppointmentSlotCard
                key={i}
                slot={part}
                onSelect={onSlotSelect}
                index={i}
              />
            )
          )}
        </div>
      ) : (
        <div style={userBubble}>
          <p style={{ color: '#ffffff', fontSize: 15, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
            {message.content}
          </p>
        </div>
      )}
    </div>
  );
}
