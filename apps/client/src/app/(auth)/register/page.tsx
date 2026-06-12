'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import VoiceButton from '@/components/ui/voice-button';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(form);
      toast.success(t.registerSuccess);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t.registerFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <div className="card p-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <h1 className="text-2xl font-bold text-gray-900">{t.createAccount}</h1>
          <VoiceButton text={t.createAccount} />
        </div>
        <p className="text-gray-500 mt-2">{t.createAccountSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              {t.firstName}
            </label>
            <input type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} className="input-field" required autoComplete="given-name" />
          </div>
          <div>
            <label className="form-label flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              {t.lastName}
            </label>
            <input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} className="input-field" required autoComplete="family-name" />
          </div>
        </div>
        <div>
          <label className="form-label flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            {t.email}
          </label>
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input-field" placeholder={t.emailPlaceholder} required autoComplete="email" />
        </div>
        <div>
          <label className="form-label flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            {t.password}
          </label>
          <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} className="input-field" placeholder={t.passwordHint} required autoComplete="new-password" />
          <p className="text-xs text-gray-400 mt-1">{t.passwordHint}</p>
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full text-lg gap-2">
          <UserPlus className="w-5 h-5" />
          {isLoading ? t.creatingAccount : t.createAccountBtn}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        {t.hasAccount}{' '}
        <Link href="/login" className="text-primary-600 font-semibold hover:underline">{t.signInLink}</Link>
      </p>
    </div>
  );
}
