import twilio from 'twilio';

// Initialize the Twilio client using environment variables
// It's safe to run this on the server side (API routes)
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSOSAlert(
  to: string,
  userName: string,
  sessionId: string,
  mapsLink: string
): Promise<boolean> {
  try {
    await client.messages.create({
      body: `🚨 SAFETRACE EMERGENCY ALERT 🚨\n` +
            `${userName} may be in DANGER and needs immediate help.\n\n` +
            `📍 Track live location:\n` +
            `${process.env.NEXT_PUBLIC_APP_URL}/track/${sessionId}\n\n` +
            `🗺 Google Maps: ${mapsLink}\n` +
            `⏰ Alert time: ${new Date().toLocaleString('en-IN')}\n\n` +
            `Reply SAFE if you've confirmed they're okay.`,
      from: process.env.TWILIO_FROM_NUMBER!,
      to,
    });
    return true;
  } catch (error) {
    console.error('[Twilio] SMS failed:', error);
    return false;
  }
}

export async function sendWelcomeSMS(
  to: string,
  contactName: string,
  userName: string
): Promise<void> {
  try {
    await client.messages.create({
      body: `Hi ${contactName}! ${userName} has added you as a trusted ` +
            `emergency contact in SafeTrace, an AI women safety app. ` +
            `If you receive a SAFETRACE ALERT SMS, respond immediately — ` +
            `it means ${userName} may be in danger.`,
      from: process.env.TWILIO_FROM_NUMBER!,
      to,
    });
  } catch (error) {
    console.error('[Twilio] Welcome SMS failed:', error);
  }
}
