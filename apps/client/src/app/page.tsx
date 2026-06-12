'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Bell, Package, ShieldCheck, Smartphone } from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';
import { formatCurrency } from '@/lib/utils';
import LanguageSwitcher from '@/components/ui/language-switcher';
import VoiceButton from '@/components/ui/voice-button';

export default function LandingPage() {
  const { t, isHindi } = useLanguage();

  const features = [
    { icon: BarChart3, ...t.landing.featuresList.forecasting },
    { icon: TrendingUp, ...t.landing.featuresList.restock },
    { icon: Bell, ...t.landing.featuresList.alerts },
    { icon: Package, ...t.landing.featuresList.inventory },
    { icon: ShieldCheck, ...t.landing.featuresList.multiStore },
    { icon: Smartphone, ...t.landing.featuresList.mobile },
  ];

  const testimonials = [
    t.landing.testimonialsList.t1,
    t.landing.testimonialsList.t2,
    t.landing.testimonialsList.t3,
  ];

  const plans = [
    { ...t.landing.plans.free, price: 0, period: 'forever', highlighted: false },
    { ...t.landing.plans.pro, price: 999, period: 'month', highlighted: true },
    { ...t.landing.plans.enterprise, price: 2999, period: 'month', highlighted: false },
  ];

  return (
    <div className={`min-h-screen bg-white ${isHindi ? 'font-noto' : ''}`}>
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-primary-600">{t.appName}</Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">{t.landing.features}</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">{t.landing.pricing}</a>
            <a href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium">{t.landing.testimonials}</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="text-gray-700 hover:text-gray-900 font-semibold">{t.landing.login}</Link>
            <Link href="/register" className="btn-primary text-sm">{t.landing.startFree}</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              {t.landing.heroTitle1}
              <span className="text-primary-600"> {t.landing.heroTitle2}</span> {t.landing.heroTitle3}
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-2 mt-6"
          >
            <p className="text-xl text-gray-600 max-w-3xl">{t.landing.heroSubtitle}</p>
            <VoiceButton text={t.landing.heroSubtitle} size="md" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/register" className="btn-primary text-lg px-8 py-3">
              {t.landing.startTrial}
            </Link>
            <a href="#features" className="btn-secondary text-lg px-8 py-3">
              {t.landing.seeHow}
            </a>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-sm text-gray-500"
          >
            {t.landing.noCard}
          </motion.p>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <div className="bg-gray-900 rounded-2xl p-2 shadow-2xl">
              <div className="bg-gray-100 rounded-xl p-8 text-left">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: t.dashboard.todaySales, value: '12,450', color: 'text-primary-600' },
                    { label: t.dashboard.revenue30d, value: '34,890', color: 'text-green-600' },
                    { label: t.dashboard.lowStockItems, value: '7', color: 'text-red-600' },
                    { label: t.dashboard.totalProducts, value: '284', color: 'text-purple-600' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm h-40 flex items-center justify-center text-gray-400">
                  {t.dashboard.revenueChart}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900">{t.landing.featuresTitle}</h2>
          <p className="mt-4 text-center text-gray-600 max-w-2xl mx-auto">{t.landing.featuresSubtitle}</p>
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card p-6"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900">{t.landing.pricingTitle}</h2>
          <p className="mt-4 text-center text-gray-600">{t.landing.pricingSubtitle}</p>
          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card p-8 ${plan.highlighted ? 'border-primary-500 border-2 relative' : ''}`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {t.landing.mostPopular}
                  </span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? t.landing.plans.free.name : formatCurrency(plan.price)}
                  </span>
                  {plan.price > 0 && <span className="text-gray-500">/{plan.period}</span>}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block text-center py-3 rounded-xl font-semibold ${
                    plan.highlighted ? 'btn-primary w-full' : 'btn-secondary w-full'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900">{t.landing.testimonialsTitle}</h2>
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {testimonials.map((item) => (
              <div key={item.name} className="card p-6">
                <p className="text-gray-600 italic">"{item.quote}"</p>
                <div className="mt-4">
                  <p className="font-bold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.store}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white">{t.landing.ctaTitle}</h2>
          <p className="mt-4 text-primary-100 text-lg">{t.landing.ctaSubtitle}</p>
          <Link href="/register" className="mt-8 inline-block bg-white text-primary-600 font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transition-colors text-lg">
            {t.landing.ctaButton}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-lg font-bold text-white">{t.appName}</p>
          <p className="text-sm">&copy; {new Date().getFullYear()} {t.appName}. {t.landing.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
