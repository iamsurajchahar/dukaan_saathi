import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config';
import { Subscription } from '../models/subscription.model';
import { PLAN_LIMITS, PlanType } from '@stocksense/shared-types';
import { BadRequestError, NotFoundError } from '../utils/errors';

const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

const PLAN_PRICES: Record<string, number> = {
  pro: 99900, // ₹999 in paise
  enterprise: 299900, // ₹2999 in paise
};

export const subscriptionService = {
  async getCurrent(userId: string) {
    const subscription = await Subscription.findOne({ userId, status: { $ne: 'cancelled' } })
      .sort({ createdAt: -1 });

    if (!subscription) {
      throw new NotFoundError('No active subscription found');
    }

    return subscription;
  },

  async createOrder(userId: string, plan: string) {
    if (plan === 'free') {
      throw new BadRequestError('Cannot checkout for free plan');
    }

    const price = PLAN_PRICES[plan];
    if (!price) {
      throw new BadRequestError('Invalid plan');
    }

    const order = await razorpay.orders.create({
      amount: price,
      currency: 'INR',
      receipt: `sub_${Date.now()}`,
      notes: {
        userId,
        plan,
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.razorpay.keyId,
      plan,
    };
  },

  async verifyAndActivate(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    plan: string
  ) {
    // Verify payment signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestError('Invalid payment signature');
    }

    const planType = plan as PlanType;
    const limits = PLAN_LIMITS[planType];
    if (!limits) {
      throw new BadRequestError('Invalid plan');
    }

    // Update or create subscription
    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      {
        plan: planType,
        status: 'active',
        limits,
        paymentProvider: 'razorpay',
        providerSubscriptionId: razorpayPaymentId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      { new: true, upsert: true }
    );

    return subscription;
  },

  async downgradeToFree(userId: string) {
    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      {
        plan: 'free',
        status: 'active',
        limits: PLAN_LIMITS.free,
        paymentProvider: undefined,
        providerSubscriptionId: undefined,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      { new: true }
    );

    if (!subscription) {
      throw new NotFoundError('No subscription found');
    }

    return subscription;
  },
};
