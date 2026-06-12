'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import VoiceButton from '@/components/ui/voice-button';
import { getApiErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success(t.loginSuccess);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, t.loginFailed));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card p-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <h1 className="text-2xl font-bold text-gray-900">{t.welcomeBack}</h1>
          <VoiceButton text={t.welcomeBack} />
        </div>
        <p className="text-gray-500 mt-2">{t.signInSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="form-label flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            {t.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder={t.emailPlaceholder}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="form-label flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            {t.password}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder={t.passwordPlaceholder}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-primary-600 hover:underline font-medium">
            {t.forgotPassword}
          </Link>
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full text-lg gap-2">
          <LogIn className="w-5 h-5" />
          {isLoading ? t.signingIn : t.signIn}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        {t.noAccount}{' '}
        <Link href="/register" className="text-primary-600 font-semibold hover:underline">{t.signUp}</Link>
      </p>
    </div>
  );
}
