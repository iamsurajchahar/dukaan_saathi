let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speak(text: string, lang: 'en' | 'hi' = 'en') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Stop any current speech
  stop();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices();
  const langCode = lang === 'hi' ? 'hi' : 'en';
  const matchingVoice = voices.find((v) => v.lang.startsWith(langCode));
  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stop() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeaking() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  return window.speechSynthesis.speaking;
}

export function isSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
