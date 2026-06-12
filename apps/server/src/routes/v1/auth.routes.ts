import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { authLimiter } from '../../middleware/rate-limit.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../../validators/auth.validator';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);
authRouter.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
authRouter.get('/verify-email/:token', authController.verifyEmail);
authRouter.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
authRouter.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
authRouter.post('/logout', authenticate, authController.logout);
authRouter.get('/me', authenticate, authController.me);
