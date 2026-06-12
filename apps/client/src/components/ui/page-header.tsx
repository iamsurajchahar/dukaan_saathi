'use client';

import VoiceButton from './voice-button';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  voiceText?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, voiceText, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <VoiceButton text={voiceText || title} size="md" />
      </div>
      {actions && <div className="flex gap-3 flex-shrink-0">{actions}</div>}
    </div>
  );
}
