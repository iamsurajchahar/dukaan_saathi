'use client';

import { AlertTriangle, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';
import VoiceButton from './voice-button';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'warning',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useLanguage();

  if (!open) return null;

  const variantConfig = {
    danger: { bg: 'bg-red-50', icon: 'text-red-500', btn: 'btn-danger' },
    warning: { bg: 'bg-amber-50', icon: 'text-amber-500', btn: 'bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-6 rounded-xl transition-colors' },
    info: { bg: 'bg-blue-50', icon: 'text-blue-500', btn: 'btn-primary' },
  }[variant];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`${variantConfig.bg} p-4 rounded-full mb-4`}>
            {variant === 'info' ? (
              <HelpCircle className={`w-8 h-8 ${variantConfig.icon}`} />
            ) : (
              <AlertTriangle className={`w-8 h-8 ${variantConfig.icon}`} />
            )}
          </div>

          <div className="flex items-center gap-1 mb-2">
            <h3 className="text-lg font-bold text-gray-900">
              {title || t.confirmAction}
            </h3>
            <VoiceButton text={`${title || t.confirmAction}. ${message}`} />
          </div>

          <p className="text-gray-600 text-base leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 btn-secondary py-3 rounded-xl text-base"
          >
            {cancelLabel || t.no}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 ${variantConfig.btn} py-3 rounded-xl text-base`}
          >
            {confirmLabel || t.yes}
          </button>
        </div>
      </div>
    </div>
  );
}
