const { addDays, format, isWeekend } = require('../utils/dateUtils');

function generateSlots(startDate, days = 45) {
  const morningTimes = ['9:00 AM', '10:00 AM', '11:00 AM'];
  const afternoonTimes = ['1:00 PM', '2:30 PM', '4:00 PM'];
  const slots = [];

  let slotsThisWeek = 0;
  let weekStart = null;

  for (let i = 1; i <= days; i++) {
    const date = addDays(startDate, i);
    const dateStr = format(date);
    const dayOfWeek = date.getDay();

    if (weekStart === null || dayOfWeek === 1) {
      weekStart = dateStr;
      slotsThisWeek = 0;
    }

    if (isWeekend(date)) continue;
    if (slotsThisWeek >= 3) continue;

    const allTimes = [...morningTimes, ...afternoonTimes];
    const time = allTimes[i % allTimes.length];
    slots.push({ date: dateStr, time });
    slotsThisWeek++;
  }

  return slots;
}

const today = new Date();
today.setHours(0, 0, 0, 0);

const doctors = [
  {
    id: 'dr-anita-patel',
    name: 'Dr. Anita Patel',
    specialty: 'Cardiologist',
    bodyPart: 'heart',
    keywords: ['heart', 'chest pain', 'palpitations', 'blood pressure', 'cardiac', 'cardiology', 'chest', 'heartbeat'],
    availability: generateSlots(today),
  },
  {
    id: 'dr-james-ortega',
    name: 'Dr. James Ortega',
    specialty: 'Orthopedic Surgeon',
    bodyPart: 'musculoskeletal',
    keywords: ['bones', 'joints', 'knee', 'back', 'shoulder', 'fractures', 'orthopedic', 'spine', 'hip', 'wrist', 'ankle'],
    availability: generateSlots(today),
  },
  {
    id: 'dr-sarah-kim',
    name: 'Dr. Sarah Kim',
    specialty: 'Dermatologist',
    bodyPart: 'skin',
    keywords: ['skin', 'rash', 'acne', 'moles', 'eczema', 'dermatology', 'itching', 'psoriasis', 'hives', 'dermatitis'],
    availability: generateSlots(today),
  },
  {
    id: 'dr-michael-chen',
    name: 'Dr. Michael Chen',
    specialty: 'Neurologist',
    bodyPart: 'brain',
    keywords: ['brain', 'headaches', 'migraines', 'dizziness', 'nerve pain', 'neurology', 'seizures', 'numbness', 'tingling', 'memory'],
    availability: generateSlots(today),
  },
];

module.exports = doctors;
