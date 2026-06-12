'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, X, Volume2, Loader2, MessageCircle, Send } from 'lucide-react';
import { startListening, stopListening, isRecognitionSupported, detectLanguage } from '@/lib/speech-recognition';
import { speak, stop as stopSpeaking, isSpeaking } from '@/lib/voice';
import { useLanguage } from '@/providers/language-provider';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api-client';

type State = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function VoiceAssistant() {
  const router = useRouter();
  const { isHindi } = useLanguage();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [liveText, setLiveText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const shouldRelisten = useRef(false);
  const chatHistory = useRef<Array<{ role: 'user' | 'assistant'; text: string }>>([]);

  useEffect(() => { setMounted(true); }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveText]);

  // Watch TTS end → auto-relisten
  useEffect(() => {
    if (state !== 'speaking') return;
    const id = setInterval(() => {
      if (!isSpeaking()) {
        setState('idle');
        if (shouldRelisten.current) {
          shouldRelisten.current = false;
          setTimeout(() => listen(), 500);
        }
      }
    }, 250);
    return () => clearInterval(id);
  }, [state]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (panelRef.current && !panelRef.current.contains(t) && !t.closest('[data-voice-fab]')) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const close = useCallback(() => {
    stopListening();
    stopSpeaking();
    shouldRelisten.current = false;
    setOpen(false);
    setState('idle');
    setLiveText('');
  }, []);

  const sendToServer = useCallback(async (text: string) => {
    const lang = detectLanguage(text);
    setState('thinking');

    // Add user message
    const userMsg: Message = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    chatHistory.current.push({ role: 'user', text });

    try {
      const { data } = await apiClient.post('/assistant/chat', {
        message: text,
        history: chatHistory.current.slice(-8),
      });

      const { reply, action } = data.data as {
        reply: string;
        lang: 'hi' | 'en';
        action?: { type: 'navigate'; page: string };
      };
      const responseLang = data.data.lang as 'hi' | 'en';

      // Add assistant message
      const assistantMsg: Message = { role: 'assistant', text: reply };
      setMessages((prev) => [...prev, assistantMsg]);
      chatHistory.current.push({ role: 'assistant', text: reply });

      // Speak the response
      setState('speaking');
      shouldRelisten.current = !action; // Don't relisten if navigating
      speak(reply, responseLang);

      // Navigate if needed
      if (action?.type === 'navigate') {
        setTimeout(() => router.push(action.page), 1500);
      }
    } catch {
      const errText = lang === 'hi'
        ? 'माफ़ कीजिए, कुछ गड़बड़ हो गई। दोबारा बोलिए।'
        : 'Sorry, something went wrong. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', text: errText }]);
      setState('idle');
    }
  }, [router]);

  const listen = useCallback(() => {
    stopSpeaking();
    setLiveText('');
    setState('listening');

    startListening(
      (transcript, isFinal) => {
        setLiveText(transcript);
        if (isFinal) {
          setLiveText('');
          sendToServer(transcript);
        }
      },
      (err) => {
        setState('idle');
        if (err === 'no-speech') {
          const t = isHindi
            ? 'कुछ सुनाई नहीं दिया। माइक दबाकर बोलिए।'
            : 'Didn\'t catch that. Tap the mic to try again.';
          setMessages((prev) => [...prev, { role: 'assistant', text: t }]);
        } else if (err === 'not-allowed') {
          const t = isHindi
            ? 'माइक की अनुमति दें। ब्राउज़र सेटिंग में माइक ऑन करें।'
            : 'Please allow microphone access in your browser.';
          setMessages((prev) => [...prev, { role: 'assistant', text: t }]);
        }
      },
      () => { /* recognition ended */ }
    );
  }, [sendToServer, isHindi]);

  const handleTextSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const t = textInput.trim();
    if (!t || state === 'thinking') return;
    setTextInput('');
    stopSpeaking();
    sendToServer(t);
  }, [textInput, state, sendToServer]);

  if (!mounted) return null;
  const micSupported = isRecognitionSupported();

  return (
    <>
      {/* FAB */}
      <button
        data-voice-fab
        onClick={() => {
          if (open) { close(); }
          else { setOpen(true); setMessages([]); chatHistory.current = []; }
        }}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
          'hover:scale-105 active:scale-95',
          open ? 'bg-gray-800 text-white' : 'bg-primary-600 text-white hover:bg-primary-700',
        )}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ animation: 'dsSlideUp .25s ease-out' }}
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] leading-tight">DukaanSathi</h3>
                  <p className="text-[11px] text-white/70 mt-0.5">
                    हिंदी / English — बोलें या टाइप करें
                  </p>
                </div>
              </div>
              {state === 'speaking' && (
                <button
                  onClick={() => { stopSpeaking(); setState('idle'); shouldRelisten.current = false; }}
                  className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full transition-colors"
                >
                  🔊 Stop
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-[180px]">
            {messages.length === 0 && !liveText && (
              <div className="text-center py-8 px-4">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-primary-400" />
                </div>
                <p className="text-[15px] text-gray-700 font-medium font-noto">
                  नमस्ते! मैं दुकानसाथी हूं 🙏
                </p>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  बोलिए या टाइप करें — Hindi या English
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['कितना फायदा हुआ?', 'Show sales', 'क्या मंगाना है?'].map((q) => (
                    <button
                      key={q}
                      onClick={() => sendToServer(q)}
                      className="text-xs bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm',
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Live transcript */}
            {liveText && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] bg-primary-50 text-primary-700 rounded-br-sm border border-primary-100">
                  {liveText}<span className="animate-pulse">...</span>
                </div>
              </div>
            )}

            {/* Thinking indicator */}
            {state === 'thinking' && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-100 flex-shrink-0 bg-white px-3 py-3">
            <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
              {/* Mic button */}
              {micSupported && (
                <button
                  type="button"
                  onClick={() => {
                    if (state === 'listening') {
                      stopListening();
                      setState('idle');
                      shouldRelisten.current = false;
                    } else {
                      listen();
                    }
                  }}
                  disabled={state === 'thinking'}
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    state === 'listening'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-500 hover:bg-primary-50 hover:text-primary-600',
                    state === 'thinking' && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {state === 'listening' ? (
                    <div className="relative">
                      <MicOff className="w-4 h-4 relative z-10" />
                      <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                    </div>
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Text input */}
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={state === 'listening' ? '🎙️ सुन रहा हूं...' : 'Type or speak...'}
                disabled={state === 'listening' || state === 'thinking'}
                className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-50 placeholder:text-gray-400"
              />

              {/* Send button */}
              <button
                type="submit"
                disabled={!textInput.trim() || state === 'thinking'}
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  textInput.trim() && state !== 'thinking'
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 text-gray-300',
                )}
              >
                {state === 'thinking' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            {/* State indicator */}
            {state !== 'idle' && (
              <p className="text-[11px] text-center mt-1.5 font-medium">
                {state === 'listening' && <span className="text-red-500">🎙️ Listening... बोलिए</span>}
                {state === 'thinking' && <span className="text-amber-600">🔍 Thinking...</span>}
                {state === 'speaking' && <span className="text-green-600">🔊 Speaking... tap header to stop</span>}
              </p>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes dsSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
