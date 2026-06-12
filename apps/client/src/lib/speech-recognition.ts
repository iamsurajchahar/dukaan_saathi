type SpeechCallback = (transcript: string, isFinal: boolean) => void;
type ErrorCallback = (error: string) => void;

let recognition: any = null;

export function isRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function startListening(
  onResult: SpeechCallback,
  onError: ErrorCallback,
  onEnd: () => void
): void {
  if (!isRecognitionSupported()) {
    onError('Speech recognition is not supported in this browser');
    return;
  }

  stopListening();

  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  // Use hi-IN as primary — Chrome's hi-IN recognizer handles
  // Hinglish (mixed Hindi-English) and pure English well.
  // This lets users freely switch between languages mid-sentence.
  recognition.lang = 'hi-IN';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    let transcript = '';
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        isFinal = true;
      }
    }
    onResult(transcript.trim(), isFinal);
  };

  recognition.onerror = (event: any) => {
    if (event.error === 'no-speech') {
      onError('no-speech');
    } else if (event.error === 'not-allowed') {
      onError('not-allowed');
    } else {
      onError(event.error || 'unknown');
    }
  };

  recognition.onend = () => {
    onEnd();
  };

  recognition.start();
}

export function stopListening(): void {
  if (recognition) {
    try {
      recognition.abort();
    } catch { /* already stopped */ }
    recognition = null;
  }
}

/**
 * Detect whether a transcript is primarily Hindi or English
 * by checking for Devanagari Unicode characters.
 */
export function detectLanguage(text: string): 'hi' | 'en' {
  // Devanagari Unicode range: \u0900-\u097F
  const devanagariChars = (text.match(/[\u0900-\u097F]/g) || []).length;
  const totalAlpha = (text.match(/[a-zA-Z\u0900-\u097F]/g) || []).length;
  if (totalAlpha === 0) return 'en';
  return devanagariChars / totalAlpha > 0.3 ? 'hi' : 'en';
}

// Declare global types for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
