'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speak, stop, isSpeaking } from '@/lib/voice';
import { useLanguage } from '@/providers/language-provider';

interface VoiceButtonProps {
  text: string;
  size?: 'sm' | 'md';
}

export default function VoiceButton({ text, size = 'sm' }: VoiceButtonProps) {
  const { language, t } = useLanguage();
  const [speaking, setSpeaking] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setSpeaking(isSpeaking());
    }, 200);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const handleClick = () => {
    if (speaking) {
      stop();
      setSpeaking(false);
    } else {
      speak(text, language);
      setSpeaking(true);
    }
  };

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const btnSize = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <button
      onClick={handleClick}
      className={`${btnSize} rounded-full hover:bg-primary-50 transition-colors group`}
      aria-label={speaking ? t.voiceStop : t.voiceHelp}
      title={speaking ? t.voiceStop : t.voiceHelp}
    >
      {speaking ? (
        <VolumeX className={`${iconSize} text-primary-600 animate-pulse`} />
      ) : (
        <Volume2 className={`${iconSize} text-gray-400 group-hover:text-primary-600`} />
      )}
    </button>
  );
}
