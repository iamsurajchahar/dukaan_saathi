'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import VoiceButton from './voice-button';

interface HelpTooltipProps {
  text: string;
}

export default function HelpTooltip({ text }: HelpTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        onClick={() => setShow(!show)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        className="p-0.5 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4 text-gray-400" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-sm rounded-xl p-3 shadow-lg z-50">
          <div className="flex items-start gap-1">
            <span className="leading-relaxed">{text}</span>
            <VoiceButton text={text} size="sm" />
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      )}
    </span>
  );
}
