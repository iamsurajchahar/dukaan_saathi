'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';
import PageHeader from '@/components/ui/page-header';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import toast from 'react-hot-toast';
import Script from 'next/script';
import { useState } from 'react';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function BillingPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showDowngrade, setShowDowngrade] = useState(false);

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await apiClient.get('/subscriptions/current');
      return data.data;
    },
  });

  const planFeatures = t.landing.plans;

  const plans = [
    { key: 'free', price: 0, period: 'forever', highlighted: false, ...planFeatures.free },
    { key: 'pro', price: 999, period: 'month', highlighted: true, ...planFeatures.pro },
    { key: 'enterprise', price: 2999, period: 'month', highlighted: false, ...planFeatures.enterprise },
  ];

  const handlePlanChange = async (plan: string) => {
    if (plan === 'free') {
      setShowDowngrade(true);
      return;
    }

    try {
      const { data } = await apiClient.post('/subscriptions/checkout', { plan });
      const order = data.data;

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'DukaanSathi',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        order_id: order.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await apiClient.post('/subscriptions/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              plan,
            });
            toast.success(t.success);
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
          } catch {
            toast.error(t.error);
          }
        },
        theme: { color: '#2563eb' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      toast.error(t.billing.upgradeFailed);
    }
  };

  const handleDowngrade = async () => {
    try {
      await apiClient.post('/subscriptions/downgrade');
      toast.success(t.billing.downgraded);
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    } catch {
      toast.error(t.billing.upgradeFailed);
    }
    setShowDowngrade(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <PageHeader title={t.billing.title} />

      {/* Current Plan */}
      {subscription && (
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4">{t.billing.currentPlan}</h2>
          <div className="flex items-center gap-4">
            <div className="bg-primary-50 p-3 rounded-xl">
              <CreditCard className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <p className="text-xl font-bold capitalize">{subscription.plan} {t.billing.plan}</p>
              <p className="text-sm text-gray-500">
                {t.billing.status}: <span className="capitalize font-semibold">{subscription.status}</span>
                {subscription.currentPeriodEnd && ` | ${t.billing.renews}: ${formatDate(subscription.currentPeriodEnd)}`}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium">{t.billing.maxStores}</p>
              <p className="text-lg font-bold">{subscription.limits?.maxStores === -1 ? t.billing.unlimited : subscription.limits?.maxStores}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium">{t.billing.maxProducts}</p>
              <p className="text-lg font-bold">{subscription.limits?.maxSkusPerStore === -1 ? t.billing.unlimited : subscription.limits?.maxSkusPerStore}</p>
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.key} className={`card p-6 ${plan.highlighted ? 'border-2 border-primary-500' : ''}`}>
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="text-2xl font-bold mt-2">
              {plan.price === 0 ? (t.landing.plans.free.name) : `${formatCurrency(plan.price)}/mo`}
            </p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePlanChange(plan.key)}
              className={`mt-4 w-full ${plan.highlighted ? 'btn-primary' : 'btn-secondary'} text-sm`}
              disabled={subscription?.plan === plan.key}
            >
              {subscription?.plan === plan.key
                ? t.billing.currentPlanBtn
                : plan.key === 'free' && subscription?.plan !== 'free'
                  ? t.billing.downgrade
                  : plan.cta}
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={showDowngrade}
        title={t.billing.downgrade}
        message={t.billing.downgradeConfirm}
        variant="warning"
        confirmLabel={t.yes}
        cancelLabel={t.no}
        onConfirm={handleDowngrade}
        onCancel={() => setShowDowngrade(false)}
      />
    </div>
  );
}
