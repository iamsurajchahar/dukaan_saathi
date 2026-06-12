'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';
import apiClient from '@/lib/api-client';

function VerifyEmailContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const requested = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    // Guard against double-fire in React strict mode — the token is single-use
    if (requested.current) return;
    requested.current = true;

    apiClient
      .get(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'verifying') {
    return (
      <div className="card p-8 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
        <p className="mt-4 text-gray-600">Verifying your email...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="card p-8 text-center">
        <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Email verified!</h1>
        <p className="mt-4 text-gray-600">Your email has been verified. You can now sign in to your account.</p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          {t.backToSignIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-8 text-center">
      <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <XCircle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Verification failed</h1>
      <p className="mt-4 text-gray-600">
        This verification link is invalid or has expired. Please sign in and request a new one.
      </p>
      <Link href="/login" className="mt-6 inline-block text-primary-600 font-semibold hover:underline">
        {t.backToSignIn}
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
