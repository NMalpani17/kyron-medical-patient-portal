# Kyron Medical — Patient Scheduling Portal

An AI-powered patient scheduling web application. Patients describe their symptoms through a conversational chat interface, get matched to the right specialist, and book appointments — all without calling the front desk. A voice AI fallback lets patients complete the same flow over the phone.

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, Vite                          |
| Backend   | Node.js, Express                        |
| AI (chat) | OpenAI GPT-4o                           |
| AI (voice)| Vapi (outbound phone calls)             |
| Email     | Resend                                  |
| Container | Docker, Docker Compose                  |

---

## Features

- Conversational intake — patients describe symptoms in plain language
- Automatic doctor matching based on specialty and symptom keywords
- Real-time appointment slot display driven entirely by server data
- One-click slot booking with slot availability enforced server-side
- Confirmation email sent via Resend after booking
- Voice handoff — transfers the web chat context to an outbound Vapi phone call
- End-of-call webhook receives call completion and sends a confirmation email

---

## Doctors

| Doctor           | Specialty          | Conditions                                          |
|------------------|--------------------|-----------------------------------------------------|
| Dr. Anita Patel  | Cardiologist       | Heart, chest pain, palpitations, blood pressure     |
| Dr. James Ortega | Orthopedic Surgeon | Bones, joints, knee, back, shoulder, fractures      |
| Dr. Sarah Kim    | Dermatologist      | Skin, rash, acne, moles, eczema                     |
| Dr. Michael Chen | Neurologist        | Brain, headaches, migraines, dizziness, nerve pain  |

---

## Prerequisites

- Node.js 20+
- Docker and Docker Compose (optional)

---

## Environment Variables

Copy `.env.example` to `.env` in the project root and fill in:

| Variable               | Description                             |
|------------------------|-----------------------------------------|
| `OPENAI_API_KEY`       | OpenAI API key                          |
| `VAPI_API_KEY`         | Vapi API key for outbound voice calls   |
| `VAPI_PHONE_NUMBER_ID` | Vapi phone number resource ID           |
| `RESEND_API_KEY`       | Resend API key for confirmation emails  |
| `PORT`                 | Server port (default: `3001`)           |
| `CLIENT_URL`           | Allowed CORS origin (default: `http://localhost:5173`) |

---

## Running Locally

### Without Docker

**Server:**
```bash
cd server
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

### With Docker

```bash
cp .env.example .env
docker-compose up --build
```

- Client: http://localhost:5173
- Server: http://localhost:3001

---

## API Endpoints

| Method | Path                                          | Description                                      |
|--------|-----------------------------------------------|--------------------------------------------------|
| GET    | `/api/health`                                 | Health check                                     |
| GET    | `/api/doctors`                                | List all doctors                                 |
| GET    | `/api/doctors?keyword=`                       | Search doctors by symptom keyword                |
| GET    | `/api/doctors/:id`                            | Get a single doctor                              |
| GET    | `/api/appointment/slots/:doctorId`            | Get available slots for a doctor                 |
| GET    | `/api/appointment/slots-for-session/:sessionId` | Get matched doctor and slots for a chat session |
| POST   | `/api/appointment/book`                       | Book an appointment slot                         |
| POST   | `/api/chat`                                   | Send a chat message and receive an AI reply      |
| POST   | `/api/voice/initiate`                         | Initiate an outbound Vapi phone call             |
| POST   | `/api/voice/webhook`                          | Receive Vapi end-of-call webhook                 |
