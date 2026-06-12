import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      ...options,
    });
    logger.info(`Email sent to ${options.to}`);
  } catch (error) {
    logger.error({ err: error }, 'Email send error');
    // Don't throw - email failures shouldn't break the flow
  }
};

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const verifyUrl = `${config.clientUrl}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your DukaanSathi email',
    html: `
      <h2>Welcome to DukaanSathi!</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;">Verify Email</a>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create this account, ignore this email.</p>
    `,
  });
};

export const sendWelcomeEmail = async (
  email: string,
  firstName: string
): Promise<void> => {
  const dashboardUrl = `${config.clientUrl}/dashboard`;
  await sendEmail({
    to: email,
    subject: `Welcome to DukaanSathi, ${firstName}! Let's grow your store 🚀`,
    html: `
    <div style="background:#f3f4f6;padding:32px 16px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
        <tr>
          <td style="background:#2563eb;border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;">🏪 DukaanSathi</h1>
            <p style="margin:8px 0 0;color:#bfdbfe;font-size:15px;">Aapki dukaan ka smart saathi</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:40px 32px;">
            <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Namaste ${firstName}! 👋</h2>
            <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
              Welcome aboard! Your store's smartest assistant is ready. Here's how to get
              the most out of DukaanSathi in your first week:
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:14px 16px;background:#f9fafb;border-radius:12px;">
                  <p style="margin:0;color:#111827;font-size:15px;"><strong>1. 📦 Add your products</strong></p>
                  <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Add items one by one, or import your whole inventory from a CSV in seconds.</p>
                </td>
              </tr>
              <tr><td style="height:10px;"></td></tr>
              <tr>
                <td style="padding:14px 16px;background:#f9fafb;border-radius:12px;">
                  <p style="margin:0;color:#111827;font-size:15px;"><strong>2. 🧾 Record your daily sales</strong></p>
                  <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Takes under a minute a day — this is the data that powers your forecasts.</p>
                </td>
              </tr>
              <tr><td style="height:10px;"></td></tr>
              <tr>
                <td style="padding:14px 16px;background:#f9fafb;border-radius:12px;">
                  <p style="margin:0;color:#111827;font-size:15px;"><strong>3. 🔮 Get demand forecasts</strong></p>
                  <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">After ~2 weeks of sales data, DukaanSathi predicts what you'll sell and tells you exactly what to reorder — before you run out.</p>
                </td>
              </tr>
              <tr><td style="height:10px;"></td></tr>
              <tr>
                <td style="padding:14px 16px;background:#f9fafb;border-radius:12px;">
                  <p style="margin:0;color:#111827;font-size:15px;"><strong>4. 🎙️ Talk to your store</strong></p>
                  <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Ask the voice assistant "kitna fayda hua?" or "what should I restock?" — in Hindi or English.</p>
                </td>
              </tr>
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px auto 0;">
              <tr>
                <td style="background:#2563eb;border-radius:10px;">
                  <a href="${dashboardUrl}" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;">Open My Dashboard →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
              You're receiving this because you signed up for DukaanSathi.<br/>
              Questions? Just reply to this email — we read everything.
            </p>
          </td>
        </tr>
      </table>
    </div>
    `,
  });
};

export const sendResetPasswordEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset your DukaanSathi password',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
};
