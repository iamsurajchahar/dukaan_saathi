import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUserDocument } from '../models/user.model';
import { config } from '../config';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/errors';
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail,
} from './email.service';
import { PLAN_LIMITS } from '@stocksense/shared-types';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const generateTokens = (userId: string): TokenPair => {
  const accessToken = jwt.sign({ userId }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

export const authService = {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      email: data.email,
      passwordHash: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      emailVerificationToken,
      emailVerificationExpires,
    });

    const tokens = generateTokens(String(user._id));
    user.refreshToken = tokens.refreshToken;
    await user.save();

    await sendVerificationEmail(data.email, emailVerificationToken);

    return { user: user.toJSON(), ...tokens };
  },

  async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isFirstLogin = !user.lastLoginAt;

    const tokens = generateTokens(String(user._id));
    user.refreshToken = tokens.refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    if (isFirstLogin) {
      // Fire-and-forget so the welcome email never slows down login
      void sendWelcomeEmail(user.email, user.firstName);
    }

    return { user: user.toJSON(), ...tokens };
  },

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
        userId: string;
      };

      const user = await User.findById(decoded.userId);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const tokens = generateTokens(String(user._id));
      user.refreshToken = tokens.refreshToken;
      await user.save();

      return tokens;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  },

  async verifyEmail(token: string) {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    // Create default free subscription
    const Subscription = (await import('../models/subscription.model')).Subscription;
    const subscription = await Subscription.create({
      userId: user._id,
      plan: 'free',
      status: 'active',
      limits: PLAN_LIMITS.free,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    user.subscriptionId = subscription._id as any;
    await user.save();

    return { message: 'Email verified successfully' };
  },

  async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await sendResetPasswordEmail(email, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  },

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    user.passwordHash = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: 'Password reset successfully' };
  },

  async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    return { message: 'Logged out successfully' };
  },
};
