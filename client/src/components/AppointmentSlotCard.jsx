import React from 'react';

const cardBase = {
  background: 'rgba(59, 130, 246, 0.12)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(59, 130, 246, 0.3)',
  borderRadius: '12px',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
  padding: '10px 16px',
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  userSelect: 'none',
};

export default function AppointmentSlotCard({ slot, onSelect, index = 0 }) {
  return (
    <div
      className="slot-card anim-slot-fade-in"
      style={{ ...cardBase, animationDelay: `${index * 0.06}s` }}
      onClick={() => onSelect(slot)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(slot)}
    >
      <span style={{ fontSize: 16 }}>📅</span>
      <span style={{ color: '#F8FAFC', fontSize: 14, fontWeight: 500 }}>{slot}</span>
      <span style={{ marginLeft: 'auto', color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>
        Select →
      </span>
    </div>
  );
}
