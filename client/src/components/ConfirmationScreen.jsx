import React from 'react';

const DOCTOR_NAMES = {
  'dr-anita-patel': 'Dr. Anita Patel',
  'dr-james-ortega': 'Dr. James Ortega',
  'dr-sarah-kim': 'Dr. Sarah Kim',
  'dr-michael-chen': 'Dr. Michael Chen',
};

const DOCTOR_SPECIALTIES = {
  'dr-anita-patel': 'Cardiologist',
  'dr-james-ortega': 'Orthopedic Surgeon',
  'dr-sarah-kim': 'Dermatologist',
  'dr-michael-chen': 'Neurologist',
};

const glass = {
  background: 'rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ConfirmationScreen({ appointmentInfo }) {
  const doctorName = DOCTOR_NAMES[appointmentInfo?.doctorId] || 'Your Doctor';
  const specialty = DOCTOR_SPECIALTIES[appointmentInfo?.doctorId] || '';
  const date = appointmentInfo?.date ? formatDate(appointmentInfo.date) : '—';
  const time = appointmentInfo?.time || '—';

  return (
    <div
      className="anim-scale-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: '40px 24px',
        gap: 28,
      }}
    >
      {/* Checkmark circle */}
      <div className="check-circle" style={{ position: 'relative' }}>
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle
            cx="44"
            cy="44"
            r="40"
            fill="none"
            stroke="rgba(16,185,129,0.25)"
            strokeWidth="4"
          />
          <circle
            cx="44"
            cy="44"
            r="40"
            fill="none"
            stroke="#10B981"
            strokeWidth="4"
            strokeDasharray="251"
            strokeDashoffset="0"
            strokeLinecap="round"
            style={{
              animation: 'drawCheck 0.6s cubic-bezier(0.22,1,0.36,1) both',
              strokeDasharray: 251,
              strokeDashoffset: 251,
            }}
          />
          <polyline
            points="26,46 38,58 62,34"
            fill="none"
            stroke="#10B981"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="check-path"
          />
        </svg>
      </div>

      {/* Heading */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#F8FAFC', fontSize: 26, fontWeight: 700, margin: '0 0 6px' }}>
          Appointment Confirmed!
        </h2>
        <p style={{ color: '#94A3B8', fontSize: 15, margin: 0 }}>
          Your booking is all set. See you soon!
        </p>
      </div>

      {/* Details card */}
      <div style={{ ...glass, padding: '24px 28px', width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <DetailRow icon="👩‍⚕️" label="Doctor" value={`${doctorName} · ${specialty}`} />
          <Divider />
          <DetailRow icon="📅" label="Date" value={date} />
          <Divider />
          <DetailRow icon="🕐" label="Time" value={time} />
          {appointmentInfo?.patientId && (
            <>
              <Divider />
              <DetailRow icon="📧" label="Confirmation to" value={appointmentInfo.patientId} />
            </>
          )}
        </div>
      </div>

      {/* Email note */}
      <div style={{ ...glass, padding: '14px 20px', width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <p style={{ color: '#94A3B8', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
          📬 A confirmation email will be sent to your inbox.
          <br />
          <span style={{ color: '#64748B', fontSize: 13 }}>
            Questions? Call us at (401) 555-0100
          </span>
        </p>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      <div>
        <p style={{ color: '#64748B', fontSize: 12, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </p>
        <p style={{ color: '#F8FAFC', fontSize: 15, fontWeight: 500, margin: 0 }}>{value}</p>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />;
}
