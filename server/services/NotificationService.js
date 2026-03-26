const { Resend } = require('resend');

const FROM_ADDRESS = 'Kyron Medical <onboarding@resend.dev>';

class NotificationService {
  constructor() {
    this._resend = null;
  }

  get resend() {
    if (!this._resend) {
      if (!process.env.RESEND_API_KEY) {
        const err = new Error('RESEND_API_KEY is not configured');
        err.status = 503;
        throw err;
      }
      this._resend = new Resend(process.env.RESEND_API_KEY);
    }
    return this._resend;
  }

  async sendConfirmationEmail(patient, doctor, appointment) {
    const patientName = patient?.firstName
      ? `${patient.firstName} ${patient.lastName || ''}`.trim()
      : 'Patient';

    const formattedDate = new Date(appointment.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const firstName = patient?.firstName || 'Patient';
    const html = buildEmailHtml({ patientName, firstName, doctor, formattedDate, time: appointment.time });

    const { data, error } = await this.resend.emails.send({
      from: FROM_ADDRESS,
      to: patient.email,
      subject: `Appointment Confirmed — ${doctor.name} on ${formattedDate}`,
      html,
    });

    if (error) {
      throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }

    console.log(`[NotificationService] Confirmation email sent to ${patient.email}, id: ${data.id}`);
    return data;
  }
}

function buildEmailHtml({ patientName, firstName, doctor, formattedDate, time }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Appointment Confirmed — Kyron Medical</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#0A1628;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                Kyron Medical
              </h1>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:14px;">
                Your Health, Simplified
              </p>
            </td>
          </tr>

          <!-- Green confirmation bar -->
          <tr>
            <td style="background-color:#059669;padding:20px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="padding-right:10px;vertical-align:middle;">
                    <div style="width:28px;height:28px;background-color:#ffffff;border-radius:50%;display:inline-block;text-align:center;line-height:28px;">
                      <span style="color:#059669;font-size:16px;font-weight:700;">✓</span>
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;">
                      Your Appointment is Confirmed
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 40px;">

              <p style="margin:0 0 24px;color:#334155;font-size:16px;line-height:1.6;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 28px;color:#334155;font-size:16px;line-height:1.6;">
                Great news! Your appointment has been successfully booked. Here are your details:
              </p>

              <!-- Details card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <!-- Doctor -->
                      <tr>
                        <td style="padding-bottom:16px;">
                          <p style="margin:0 0 2px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">
                            Doctor
                          </p>
                          <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">
                            ${doctor.name}
                          </p>
                          <p style="margin:2px 0 0;color:#64748b;font-size:14px;">
                            ${doctor.specialty}
                          </p>
                        </td>
                      </tr>
                      <tr><td style="border-top:1px solid #e2e8f0;padding-bottom:16px;"></td></tr>

                      <!-- Date -->
                      <tr>
                        <td style="padding-bottom:16px;">
                          <p style="margin:0 0 2px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">
                            Date
                          </p>
                          <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">
                            ${formattedDate}
                          </p>
                        </td>
                      </tr>
                      <tr><td style="border-top:1px solid #e2e8f0;padding-bottom:16px;"></td></tr>

                      <!-- Time -->
                      <tr>
                        <td style="padding-bottom:16px;">
                          <p style="margin:0 0 2px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">
                            Time
                          </p>
                          <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">
                            ${time}
                          </p>
                        </td>
                      </tr>
                      <tr><td style="border-top:1px solid #e2e8f0;padding-bottom:16px;"></td></tr>

                      <!-- Location -->
                      <tr>
                        <td style="padding-bottom:16px;">
                          <p style="margin:0 0 2px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">
                            Location
                          </p>
                          <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">
                            123 Medical Plaza
                          </p>
                          <p style="margin:2px 0 0;color:#64748b;font-size:14px;">
                            Providence, RI 02903
                          </p>
                        </td>
                      </tr>
                      <tr><td style="border-top:1px solid #e2e8f0;padding-bottom:16px;"></td></tr>

                      <!-- Phone -->
                      <tr>
                        <td>
                          <p style="margin:0 0 2px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">
                            Phone
                          </p>
                          <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">
                            (401) 555-0100
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>

              <!-- Cancellation notice -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin-bottom:8px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#9a3412;font-size:14px;line-height:1.5;">
                      <strong>Need to cancel or reschedule?</strong><br />
                      Please call us at <strong>(401) 555-0100</strong> at least 24 hours before your appointment.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0A1628;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;color:#ffffff;font-size:15px;font-weight:600;">
                Kyron Medical Practice
              </p>
              <p style="margin:0;color:#64748b;font-size:13px;">
                123 Medical Plaza · Providence, RI 02903 · (401) 555-0100
              </p>
              <p style="margin:12px 0 0;color:#475569;font-size:12px;">
                This is an automated confirmation. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = new NotificationService();
