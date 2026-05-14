import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendOTP(email, otp) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
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