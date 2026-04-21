const BREVO_API_KEY = process.env.BREVO_API_KEY!;

export async function sendEmail({
  to,
  toName,
  subject,
  html,
}: {
  to: string;
  toName: string;
  subject: string;
  html: string;
}) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: "SGBI Asset Tracker", email: "chethananair100@gmail.com" },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    console.error("Brevo email error:", error);
    throw new Error("Failed to send email");
  }

  return res.json();
}
