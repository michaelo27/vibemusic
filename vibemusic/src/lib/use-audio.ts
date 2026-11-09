'use client';

import { useEffect, useState } from 'react';

/**
 * Dead-simple global audio player so only one preview plays at a time.
 * Audius' /stream endpoint 302s to a fresh signed CDN url, so we never store
 * expiring links — we just point <audio> at the stable endpoint.
 */
type PlayerState = { id: string | null; playing: boolean; loading: boolean };

let state: PlayerState = { id: null, playing: false, loading: false };
let audio: HTMLAudioElement | null = null;
const subs = new Set<(s: PlayerState) => void>();

function emit(next: PlayerState) {
  state = next;
  subs.forEach((fn) => fn(next));
}

function ensureAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!audio) {
    audio = new Audio();
    audio.preload = 'none';
    audio.addEventListener('playing', () => emit({ ...state, playing: true, loading: false }));
    audio.addEventListener('pause', () => emit({ ...state, playing: false }));
    audio.addEventListener('waiting', () => emit({ ...state, loading: true }));
    audio.addEventListener('ended', () => emit({ id: null, playing: false, loading: false }));
    audio.addEventListener('error', () => emit({ id: null, playing: false, loading: false }));
  }
  return audio;
}

export function useAudioPlayer() {
  const [s, setS] = useState<PlayerState>(state);
  useEffect(() => {
    subs.add(setS);
    setS(state);
    return () => {
      subs.delete(setS);
    };
  }, []);

  const toggle = (id: string, src: string | null | undefined) => {
    const el = ensureAudio();
    if (!el || !src) return;
    if (state.id === id && state.playing) {
      el.pause();
      return;
    }
    if (state.id !== id) {
      el.src = src;
      el.currentTime = 0;
    }
    emit({ id, playing: false, loading: true });
    void el.play().catch(() => emit({ id: null, playing: false, loading: false }));
  };

  return {
    playingId: s.playing ? s.id : null,
    loadingId: s.loading ? s.id : null,
    toggle,
  };
}
