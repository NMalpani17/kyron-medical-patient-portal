# Kyron Medical — Patient Scheduling Portal

A production-ready, AI-powered patient-facing scheduling web application that allows patients to describe their symptoms, get matched to the right doctor, and book appointments — all through a conversational interface.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS        |
| Backend    | Node.js, Express                    |
| AI         | OpenAI GPT-4o (chat), VAPI (voice)  |
| Email      | Resend                              |
| SMS        | Twilio                              |
| Container  | Docker, Docker Compose              |

---

## Project Structure

```
kyron-medical-patient-portal/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── services/
│   │   │   └── api.js       # Axios API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                  # Express API backend
│   ├── controllers/         # Route handler logic
│   ├── services/            # Business logic layer
│   ├── repositories/
│   │   └── DoctorRepository.js
│   ├── models/              # ES6 data models
│   ├── data/
│   │   └── doctors.js       # Hardcoded doctor seed data
│   ├── routes/
│   │   └── index.js
│   ├── middleware/
│   │   └── errorHandler.js
│   └── server.js
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (optional)

### Local Development (without Docker)

**Server:**
```bash
cd server
cp ../.env.example ../.env   # fill in your keys
npm install
npm run dev
# Runs on http://localhost:3001
```

**Client:**
```bash
cd client
npm install
npm run dev
# Runs on http://localhost:5173
```

### Docker (recommended)

```bash
cp .env.example .env   # fill in your API keys
docker-compose up --build
```

- Client: http://localhost:5173
- Server: http://localhost:3001

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable               | Description                        |
|------------------------|------------------------------------|
| `OPENAI_API_KEY`       | OpenAI API key for GPT-4o chat     |
| `VAPI_API_KEY`         | VAPI key for voice AI              |
| `VAPI_PHONE_NUMBER_ID` | VAPI phone number resource ID      |
| `RESEND_API_KEY`       | Resend API key for email           |
| `TWILIO_ACCOUNT_SID`   | Twilio account SID for SMS         |
| `TWILIO_AUTH_TOKEN`    | Twilio auth token                  |
| `TWILIO_PHONE_NUMBER`  | Twilio outbound phone number       |
| `PORT`                 | Server port (default: 3001)        |
| `CLIENT_URL`           | Allowed CORS origin                |

---

## API Endpoints

| Method | Path                  | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | /api/health           | Health check                       |
| GET    | /api/doctors          | List all doctors                   |
| GET    | /api/doctors?keyword= | Find doctors by symptom/keyword    |
| GET    | /api/doctors/:id      | Get single doctor with availability|

---

## Feature List

### Phase 1 — Scaffold + Doctor Data
- [x] Project structure with SOLID/DRY/YAGNI principles
- [x] ES6 class models: Patient, Doctor, Appointment, Conversation
- [x] DoctorRepository with keyword-based search
- [x] Dynamic availability slots (3/week, 45-day window)
- [x] Express REST API with error handling middleware
- [x] Docker Compose setup for client + server
- [x] Tailwind CSS client scaffold

### Phase 2 — AI Chat Interface (coming)
- [ ] GPT-4o powered symptom intake chatbot
- [ ] Doctor recommendation from conversation
- [ ] Slot selection and patient info collection

### Phase 3 — Booking + Notifications (coming)
- [ ] Appointment booking flow
- [ ] Email confirmation via Resend
- [ ] SMS confirmation via Twilio

### Phase 4 — Voice AI (coming)
- [ ] VAPI voice agent for phone-based scheduling

---

## Doctors

| Doctor              | Specialty           | Keywords                                              |
|---------------------|---------------------|-------------------------------------------------------|
| Dr. Anita Patel     | Cardiologist        | heart, chest pain, palpitations, blood pressure       |
| Dr. James Ortega    | Orthopedic Surgeon  | bones, joints, knee, back, shoulder, fractures        |
| Dr. Sarah Kim       | Dermatologist       | skin, rash, acne, moles, eczema                       |
| Dr. Michael Chen    | Neurologist         | brain, headaches, migraines, dizziness, nerve pain    |
