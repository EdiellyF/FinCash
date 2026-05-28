import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTP(email, otp) {
  await resend.emails.send({
    from: 'FinCash <onboarding@resend.dev>',
    to: email,
    subject: 'Código de confirmação',
    html: `
      <div style="font-family: Arial">
        <h2>Seu código é:</h2>
        <h1>${otp}</h1>
        <p>Expira em 10 minutos.</p>
      </div>
    `
  });
}