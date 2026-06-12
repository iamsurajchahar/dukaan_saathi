'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';
import { getApiErrorMessage } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success(t.success);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, t.error));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Invalid reset link</h1>
        <p className="mt-4 text-gray-600">This password reset link is missing or invalid. Please request a new one.</p>
        <Link href="/forgot-password" className="mt-6 inline-block text-primary-600 font-semibold hover:underline">
          {t.resetPassword}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Password reset successfully</h1>
        <p className="mt-4 text-gray-600">Redirecting you to sign in...</p>
        <Link href="/login" className="mt-6 inline-block text-primary-600 font-semibold hover:underline">
          {t.backToSignIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t.resetPassword}</h1>
        <p className="text-gray-500 mt-2">Choose a new password for your account.</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
            minLength={8}
            required
          />
          <p className="mt-1 text-xs text-gray-400">
            At least 8 characters, with an uppercase letter and a number.
          </p>
        </div>
        <div>
          <label className="form-label flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            Confirm password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
            minLength={8}
            required
          />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full text-lg gap-2">
          {isLoading ? t.sending : t.resetPassword}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="text-primary-600 font-semibold hover:underline">{t.backToSignIn}</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
