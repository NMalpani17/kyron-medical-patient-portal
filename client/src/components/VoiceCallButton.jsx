import React, { useState } from 'react';
import { initiateVoiceCall } from '../services/api';

const STATES = { idle: 'idle', calling: 'calling', done: 'done' };

export default function VoiceCallButton({ sessionId, patientPhone, patientName, conversationHistory }) {
  const [status, setStatus] = useState(STATES.idle);
  const [toast, setToast] = useState(null);

  async function handleClick() {
    if (status !== STATES.idle) return;
    setStatus(STATES.calling);
    try {
      await initiateVoiceCall({ sessionId, phone: patientPhone, patientName, conversationHistory });
      setStatus(STATES.done);
      showToast('📞 Our AI will call you shortly!', '#10B981');
    } catch {
      setStatus(STATES.idle);
      showToast('Could not initiate call. Please try again.', '#EF4444');
    }
  }

  function showToast(msg, color) {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 4000);
  }

  const btnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: '24px',
    border: '1px solid rgba(59,130,246,0.4)',
    background: status === STATES.done
      ? 'rgba(16,185,129,0.18)'
      : 'rgba(59,130,246,0.18)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    cursor: status === STATES.idle ? 'pointer' : 'default',
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        className={status === STATES.idle ? 'voice-btn-pulse' : ''}
        style={btnStyle}
        onClick={handleClick}
        disabled={status !== STATES.idle}
      >
        {status === STATES.calling ? (
          <>
            <span style={{ fontSize: 15 }}>⏳</span>
            <span>Calling…</span>
          </>
        ) : status === STATES.done ? (
          <>
            <span style={{ fontSize: 15 }}>✅</span>
            <span>Call Scheduled</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 15 }}>📞</span>
            <span>Switch to Phone Call</span>
          </>
        )}
      </button>

      {/* Toast */}
      {toast && (
        <div
          className="anim-fade-slide-up"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            background: toast.color,
            color: '#fff',
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            zIndex: 10,
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
