'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, MapPin, Phone, ChevronRight, ChevronLeft, Sparkles, Package, TrendingUp, Bell, ShoppingCart } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import VoiceButton from '@/components/ui/voice-button';
import LanguageSwitcher from '@/components/ui/language-switcher';
import toast from 'react-hot-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { t, language, isHindi } = useLanguage();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', category: 'grocery',
    address: { line1: '', line2: '', city: '', state: '', pincode: '' },
    phone: '',
  });

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });
  const updateAddress = (field: string, value: string) =>
    setForm({ ...form, address: { ...form.address, [field]: value } });

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await apiClient.post('/stores', form);
      await refreshUser();
      toast.success(t.onboarding.storeCreated);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || t.onboarding.createFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryOptions = Object.entries(t.storeCategories).map(([value, label]) => ({ value, label }));

  // Welcome step (step 0) - Language selection + intro
  // Step 1 - Store details
  // Step 2 - Store address
  // Step 3 - Quick tutorial
  const totalSteps = 4;

  return (
    <div className={`max-w-2xl mx-auto mt-4 ${isHindi ? 'font-noto' : ''}`}>
      {/* Progress */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">{t.onboarding.title}</h1>
          <VoiceButton text={t.onboarding.title} size="md" />
        </div>
        <p className="text-gray-500">{t.onboarding.step} {step + 1} {t.onboarding.of} {totalSteps}</p>
        <div className="flex gap-2 justify-center mt-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 w-16 rounded-full transition-colors ${step >= i ? 'bg-primary-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </div>

      <div className="card p-8">
        {/* Step 0: Welcome & Language */}
        {step === 0 && (
          <div className="text-center space-y-6">
            <div className="bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <Store className="w-10 h-10 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {language === 'hi' ? 'स्वागत है! 🙏' : 'Welcome! 🙏'}
              </h2>
              <p className="text-gray-500 mt-2 text-base leading-relaxed">
                {language === 'hi'
                  ? 'दुकानसाथी आपकी दुकान को स्मार्ट बनाएगा। पहले अपनी भाषा चुनें।'
                  : 'DukaanSathi will make your store smart. First, choose your language.'}
              </p>
            </div>
            <div className="flex justify-center">
              <LanguageSwitcher />
            </div>
            <VoiceButton
              text={language === 'hi'
                ? 'दुकानसाथी में आपका स्वागत है। यह ऐप आपकी दुकान का सामान ट्रैक करेगा और बताएगा कि कब क्या मंगाना है। आगे बटन दबाएं।'
                : 'Welcome to DukaanSathi. This app will track your store products and tell you when to order what. Press the Next button.'}
              size="md"
            />
            <button onClick={() => setStep(1)} className="btn-primary w-full text-lg gap-2">
              {t.next} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 1: Store Details */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary-50 p-2 rounded-xl">
                <Store className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold">{t.onboarding.storeDetails}</h2>
              <VoiceButton text={language === 'hi' ? 'अपनी दुकान का नाम, प्रकार, और फ़ोन नंबर डालें।' : 'Enter your store name, type, and phone number.'} />
            </div>
            <div>
              <label className="form-label">{t.onboarding.storeName}</label>
              <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className="input-field" placeholder={t.onboarding.storeNamePlaceholder} required />
            </div>
            <div>
              <label className="form-label">{t.onboarding.category}</label>
              <select value={form.category} onChange={(e) => update('category', e.target.value)} className="input-field">
                {categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                {t.onboarding.phone}
              </label>
              <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" placeholder={t.onboarding.phonePlaceholder} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="btn-secondary flex-1 gap-2">
                <ChevronLeft className="w-5 h-5" /> {t.back}
              </button>
              <button onClick={() => setStep(2)} disabled={!form.name} className="btn-primary flex-1 gap-2">
                {t.next} <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Store Address */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary-50 p-2 rounded-xl">
                <MapPin className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold">{t.onboarding.storeAddress}</h2>
              <VoiceButton text={language === 'hi' ? 'अपनी दुकान का पता डालें।' : 'Enter your store address.'} />
            </div>
            <div>
              <label className="form-label">{t.onboarding.addressLine1}</label>
              <input type="text" value={form.address.line1} onChange={(e) => updateAddress('line1', e.target.value)} className="input-field" placeholder={t.onboarding.addressLine1Placeholder} required />
            </div>
            <div>
              <label className="form-label">{t.onboarding.addressLine2}</label>
              <input type="text" value={form.address.line2} onChange={(e) => updateAddress('line2', e.target.value)} className="input-field" placeholder={t.onboarding.addressLine2Placeholder} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">{t.onboarding.city}</label>
                <input type="text" value={form.address.city} onChange={(e) => updateAddress('city', e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="form-label">{t.onboarding.state}</label>
                <input type="text" value={form.address.state} onChange={(e) => updateAddress('state', e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="form-label">{t.onboarding.pincode}</label>
                <input type="text" value={form.address.pincode} onChange={(e) => updateAddress('pincode', e.target.value)} className="input-field" required />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1 gap-2">
                <ChevronLeft className="w-5 h-5" /> {t.back}
              </button>
              <button onClick={() => setStep(3)} disabled={!form.address.line1 || !form.address.city} className="btn-primary flex-1 gap-2">
                {t.next} <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Quick Tutorial + Create */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">
                {language === 'hi' ? 'आपकी दुकान तैयार है!' : 'Your store is ready!'}
              </h2>
              <p className="text-gray-500 mt-1">
                {language === 'hi' ? 'यहां देखें ऐप में क्या-क्या कर सकते हैं:' : 'Here is what you can do in the app:'}
              </p>
              <VoiceButton
                text={language === 'hi'
                  ? 'बधाई हो! आपकी दुकान तैयार है। इस ऐप में आप सामान जोड़ सकते हैं, बिक्री लिख सकते हैं, अनुमान देख सकते हैं कि आगे क्या बिकेगा, और कम स्टॉक की चेतावनी पा सकते हैं। नीचे बटन दबाकर शुरू करें।'
                  : 'Congratulations! Your store is ready. In this app you can add products, record sales, see predictions for future demand, and get low stock alerts. Press the button below to start.'}
                size="md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Package,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                  title: language === 'hi' ? 'सामान जोड़ें' : 'Add Products',
                  desc: language === 'hi' ? 'अपने सामान की लिस्ट बनाएं' : 'Create your product list',
                },
                {
                  icon: ShoppingCart,
                  color: 'text-green-600',
                  bg: 'bg-green-50',
                  title: language === 'hi' ? 'बिक्री लिखें' : 'Record Sales',
                  desc: language === 'hi' ? 'रोज़ाना बिक्री दर्ज करें' : 'Enter daily sales easily',
                },
                {
                  icon: TrendingUp,
                  color: 'text-purple-600',
                  bg: 'bg-purple-50',
                  title: language === 'hi' ? 'अनुमान देखें' : 'See Predictions',
                  desc: language === 'hi' ? 'आगे क्या बिकेगा जानें' : 'Know what will sell next',
                },
                {
                  icon: Bell,
                  color: 'text-red-600',
                  bg: 'bg-red-50',
                  title: language === 'hi' ? 'चेतावनी पाएं' : 'Get Alerts',
                  desc: language === 'hi' ? 'कम स्टॉक की सूचना' : 'Low stock notifications',
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className={`${item.bg} p-2 rounded-lg flex-shrink-0`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1 gap-2">
                <ChevronLeft className="w-5 h-5" /> {t.back}
              </button>
              <button onClick={handleSubmit} disabled={isLoading} className="btn-primary flex-1 text-lg gap-2">
                <Sparkles className="w-5 h-5" />
                {isLoading ? t.onboarding.creating : t.onboarding.createStore}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

