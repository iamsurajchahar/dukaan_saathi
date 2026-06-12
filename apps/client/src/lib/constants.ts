export const APP_NAME = 'DukaanSathi';
export const APP_DESCRIPTION = 'AI-powered inventory forecasting for kirana stores';

export const STORE_CATEGORIES = [
  { value: 'grocery', label: 'Grocery' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'general', label: 'General Store' },
  { value: 'other', label: 'Other' },
];

export const PRODUCT_UNITS = [
  { value: 'piece', label: 'Piece' },
  { value: 'kg', label: 'Kg' },
  { value: 'litre', label: 'Litre' },
  { value: 'pack', label: 'Pack' },
  { value: 'dozen', label: 'Dozen' },
];

export const PRICING_PLANS = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    features: ['1 store', 'Up to 50 products', 'Basic forecasting', '7-day history', 'Email support'],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 999,
    period: 'month',
    features: ['Up to 5 stores', 'Up to 500 products', 'Advanced forecasting', '90-day history', 'Priority support', 'CSV import/export', 'Team management'],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 2999,
    period: 'month',
    features: ['Unlimited stores', 'Unlimited products', 'Custom forecasting', 'Unlimited history', 'Dedicated support', 'API access', 'Custom reports'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];
