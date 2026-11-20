"use client";
// Free voice using the browser's built-in speech (no API, no cost; works offline on most phones).

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "en-NG") ??
    voices.find((v) => v.lang === "en-GB" && /female|zira|libby|sonia|google uk english female/i.test(v.name)) ??
    voices.find((v) => v.lang?.startsWith("en-GB")) ??
    voices.find((v) => v.lang?.startsWith("en"))
  );
}

export function speak(text: string, onEnd?: () => void) {
  if (!canSpeak()) return onEnd?.();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/₦/g, "naira "));
  const v = pickVoice();
  if (v) u.voice = v;
  u.lang = v?.lang ?? "en-GB";
  u.rate = 1;
  u.pitch = 1.25; // a little bright: it's a bean
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

export function makeRecognizer(): Recognition | null {
  if (typeof window === "undefined") return null;
  const W = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = "en-NG";
  r.interimResults = false;
  r.maxAlternatives = 1;
  return r;
}
