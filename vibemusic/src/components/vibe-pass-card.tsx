'use client';

import * as React from 'react';
import { JarLink } from '@/components/links';
import type { TipJar } from '@/lib/types';

/**
 * The VibeMusic pass — the physical-looking membership card from the design.
 * It is deliberately always dark (it reads as an object, not a surface), tilts
 * with the pointer, and drifts on its own when untouched.
 *
 * Barcode + waveform are derived from the wallet address, so every jar gets a
 * stable, unique-looking card.
 */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) >>> 0;
}

function seeded(seed: string, count: number): number[] {
  let x = hash(seed) || 1;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    out.push(x);
  }
  return out;
}

export function VibePassCard({ jar }: { jar: TipJar | null }) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const seed = jar?.wallet ?? 'vibemusic';
  const vals = React.useMemo(() => seeded(seed, 120), [seed]);

  const bars = vals.slice(0, 46).map((v) => 1 + (v % 3));
  const wave = vals.slice(46, 78).map((v) => 7 + (v % 29));

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--vpass-ry', `${(px * 16).toFixed(2)}deg`);
    el.style.setProperty('--vpass-rx', `${(-py * 13).toFixed(2)}deg`);
  };

  const onLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--vpass-ry', '0deg');
    el.style.setProperty('--vpass-rx', '0deg');
  };

  const name = jar?.name ?? 'Your artist name';
  const slug = jar?.slug ?? null;
  const trackCount = jar?.tracks?.length ?? 0;
  const received = Number(jar?.totalReceived ?? 0);
  const initials =
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'V';
  const serial = `No ${(hash(seed) % 9000) + 1000}`;

  const card = (
    <div className="vpass" ref={cardRef} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="vpass-glow" aria-hidden="true" />
      <div className="vpass-in">
        <div className="vpass-notch" aria-hidden="true" />
        <div className="vpass-top">
          <span>VibeMusic Pass</span>
          <span>Base - 8453</span>
        </div>

        <svg className="vpass-sigil" viewBox="0 0 260 260" fill="none" aria-hidden="true">
          <circle cx="130" cy="130" r="104" stroke="currentColor" strokeWidth="0.6" />
          <circle cx="130" cy="130" r="74" stroke="currentColor" strokeWidth="0.6" />
          <ellipse cx="130" cy="130" rx="104" ry="38" stroke="currentColor" strokeWidth="0.6" />
          <ellipse cx="130" cy="130" rx="104" ry="38" transform="rotate(60 130 130)" stroke="currentColor" strokeWidth="0.6" />
          <ellipse cx="130" cy="130" rx="104" ry="38" transform="rotate(-60 130 130)" stroke="currentColor" strokeWidth="0.6" />
        </svg>

        <div className="vpass-brand">vibemusic</div>

        <div className="vpass-id">
          <div className="vpass-idtext">
            <div className="vpass-name">{name}</div>
            <div className="vpass-meta">
              <span className="vpass-pill">artist</span>
              <em>@{slug ?? 'you'}</em>
            </div>
          </div>
          <div className="vpass-medal">
            <span>{initials}</span>
          </div>
        </div>

        <div className="vpass-grid">
          <div>
            <div className="k">Access</div>
            <div className="v">Any tip</div>
          </div>
          <div>
            <div className="k">Tracks</div>
            <div className="v">{trackCount} linked</div>
          </div>
          <div>
            <div className="k">Agent</div>
            <div className={received > 0 ? 'v ok' : 'v'}>{received > 0 ? 'Tipping' : 'Pending'}</div>
          </div>
        </div>

        <div className="vpass-wave" aria-hidden="true">
          {wave.map((h, i) => (
            <i key={i} style={{ height: `${h}px`, animationDelay: `${(i % 12) * 0.12}s` }} />
          ))}
        </div>

        <div className="vpass-last">
          <span>Last tip</span>
          <span>
            {received > 0 ? (
              <>
                <b>+{received} $VIBES</b>
              </>
            ) : (
              'waiting for the first one'
            )}
          </span>
        </div>

        <div className="vpass-stub">
          <div className="vpass-bars" aria-hidden="true">
            {bars.map((w, i) => (
              <i key={i} style={{ width: `${w}px` }} />
            ))}
          </div>
          <div className="vpass-stubrow">
            <span>{serial}</span>
            <span>admit one</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="vpass-stage">
      {slug ? (
        <JarLink wallet={jar?.wallet ?? ''} slug={slug} className="vpass-link">
          {card}
        </JarLink>
      ) : (
        card
      )}
      <div className="vpass-shadow" aria-hidden="true" />
      <p className="vpass-hint">
        <span className="hidden sm:inline">Move your cursor to tilt it - </span>
        {slug ? (
          <JarLink wallet={jar?.wallet ?? ''} slug={slug} className="vpass-hint-link">
            open @{slug}&apos;s jar -&gt;
          </JarLink>
        ) : (
          <a href="/create" className="vpass-hint-link">
            create your pass -&gt;
          </a>
        )}
      </p>
    </div>
  );
}
