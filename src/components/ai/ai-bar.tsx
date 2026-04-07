'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Send, Sparkles, Square } from 'lucide-react';

export function AiBar() {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      setValue(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setValue('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    window.dispatchEvent(new CustomEvent('ai-query', { detail: { query: value } }));
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-2xl">
      <div className="relative flex items-center gap-2 bg-white/60 backdrop-blur-xl backdrop-saturate-150 border border-white/70 rounded-full shadow-[0_2px_8px_rgba(28,25,22,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] px-4 py-2 transition-all duration-150 focus-within:bg-white/80 focus-within:shadow-[0_4px_16px_rgba(28,25,22,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]">
        <Sparkles className="w-4 h-4 text-[#ff6a3d] flex-shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={isListening ? 'Listening…' : 'Ask Scout anything…'}
          className="flex-1 bg-transparent border-none outline-none text-[13px] text-zinc-900 placeholder:text-zinc-400"
        />
        {supported && (
          <button
            type="button"
            onClick={toggleListening}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-zinc-400 hover:text-zinc-700 hover:bg-white/60'
            }`}
          >
            {isListening ? <Square className="w-3 h-3" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        )}
        <button
          type="submit"
          disabled={!value.trim()}
          aria-label="Send"
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] text-white shadow-[0_2px_8px_rgba(255,106,61,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:from-[#ff8a5d] hover:to-[#ff6a3d] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
}
