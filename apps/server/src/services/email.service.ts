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
