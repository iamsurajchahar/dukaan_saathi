'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Send, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';
import VoiceButton from '@/components/ui/voice-button';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success(t.success);
    } catch {
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="card p-8 text-center">
        <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <div className="flex items-center justify-center gap-1">
          <h1 className="text-2xl font-bold text-gray-900">{t.checkEmail}</h1>
          <VoiceButton text={t.checkEmail} />
        </div>
        <p className="mt-4 text-gray-600 text-base">{t.resetSent} <strong>{email}</strong></p>
        <Link href="/login" className="mt-6 inline-block text-primary-600 font-semibold hover:underline text-base">
          {t.backToSignIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <h1 className="text-2xl font-bold text-gray-900">{t.resetPassword}</h1>
          <VoiceButton text={t.resetPassword} />
        </div>
        <p className="text-gray-500 mt-2">{t.resetSubtitle}</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="form-label flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            {t.email}
          </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder={t.emailPlaceholder} required />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full text-lg gap-2">
          <Send className="w-5 h-5" />
          {isLoading ? t.sending : t.sendResetLink}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="text-primary-600 font-semibold hover:underline">{t.backToSignIn}</Link>
      </p>
    </div>
  );
}
