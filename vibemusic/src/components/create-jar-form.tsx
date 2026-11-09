'use client';

import { useConnectModal } from '@rainbow-me/rainbowkit';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Link2,
  Plus,
  Sparkles,
  Wand2,
} from 'lucide-react';
import * as React from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { Artwork } from '@/components/artwork';
import { TrackRow } from '@/components/track-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { api, IS_DEMO } from '@/lib/api';
import { AUDIUS_API, trendingTracks } from '@/lib/audius';
import { DEMO_CATALOGUE } from '@/lib/demo-fixtures';
import { buildJarMessage } from '../../shared/eip712';
import type { AudiusTrack, TipJar } from '@/lib/types';
import { cn, shortAddress, slugify } from '@/lib/utils';

const DEMO_WALLET_KEY = 'vibemusic:demoWallet';

function demoWallet(): string {
  if (typeof window === 'undefined') return '0x0000000000000000000000000000000000000001';
  const existing = window.localStorage.getItem(DEMO_WALLET_KEY);
  if (existing) return existing;
  let h = '';
  for (let i = 0; i < 40; i++) h += '0123456789abcdef'[Math.floor(Math.random() * 16)];
  const addr = `0x${h}`;
  window.localStorage.setItem(DEMO_WALLET_KEY, addr);
  return addr;
}

export function CreateJarForm() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync } = useSignMessage();
  const { toast } = useToast();

  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [bio, setBio] = React.useState('');
  const [x, setX] = React.useState('');
  const [image, setImage] = React.useState('');
  const [tracks, setTracks] = React.useState<AudiusTrack[]>([]);
  const [input, setInput] = React.useState('');
  const [resolving, setResolving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [publishing, setPublishing] = React.useState(false);
  const [created, setCreated] = React.useState<TipJar | null>(null);
  const [picks, setPicks] = React.useState<AudiusTrack[]>([]);
  const [copied, setCopied] = React.useState(false);

  const wallet = address ?? (IS_DEMO ? (typeof window !== 'undefined' ? demoWallet() : null) : null);

  // quick picks: live trending from Audius (offline-safe)
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const t = await trendingTracks(6);
        if (alive) setPicks(t.slice(0, 4));
      } catch {
        if (alive && IS_DEMO) setPicks(DEMO_CATALOGUE.slice(0, 4));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  async function addTrack(raw?: string) {
    const value = (raw ?? input).trim();
    if (!value) return;
    if (tracks.length >= 3) {
      setError('You can link up to 3 tracks in the MVP.');
      return;
    }
    if (tracks.some((t) => t.id === value)) return;
    setResolving(true);
    setError(null);
    try {
      const track = await api.resolveTrack(value);
      if (tracks.some((t) => t.id === track.id)) {
        setError('That track is already linked.');
      } else {
        setTracks((prev) => [...prev, track].slice(0, 3));
        setInput('');
      }
    } catch (e: any) {
      setError(
        e?.message?.includes('fetch') || e?.name === 'TypeError'
          ? 'Could not reach the Audius API from here. Paste a track id or link, or add one of the picks below.'
          : String(e?.message ?? 'Could not resolve that track'),
      );
    } finally {
      setResolving(false);
    }
  }

  function addPick(t: AudiusTrack) {
    if (tracks.length >= 3 || tracks.some((x) => x.id === t.id)) return;
    setTracks((prev) => [...prev, t].slice(0, 3));
  }

  async function publish() {
    if (!wallet) {
      openConnectModal?.();
      return;
    }
    if (!name.trim()) {
      setError('Give your jar a display name.');
      return;
    }
    if (!/^[a-z0-9_-]{2,24}$/.test(effectiveSlug)) {
      setError('Handle must be 2–24 characters: a–z, 0–9, "-" or "_".');
      return;
    }
    if (tracks.length === 0) {
      setError('Link at least one Audius track.');
      return;
    }

    setPublishing(true);
    setError(null);
    try {
      const timestamp = Date.now();
      const payload = {
        wallet,
        slug: effectiveSlug,
        name: name.trim(),
        bio: bio.trim().slice(0, 280),
        x: x.trim() ? x.trim().replace(/^@/, '') : null,
        image: image.trim() || null,
        tracks,
      };

      let signature: string | undefined;
      if (!IS_DEMO) {
        const message = buildJarMessage({
          wallet,
          slug: payload.slug,
          name: payload.name,
          trackIds: tracks.map((t) => t.id),
          timestamp,
        });
        signature = await signMessageAsync({ message });
      }

      const jar = await api.createJar(payload, { signature, timestamp });
      setCreated(jar);
      toast({ title: 'Tip jar is live', description: `vibemusic / @${jar.slug}`, tone: 'success' });
    } catch (e: any) {
      const msg = String(e?.shortMessage || e?.message || e);
      setError(/user rejected|denied/i.test(msg) ? 'Signature rejected — nothing was saved.' : msg.slice(0, 200));
    } finally {
      setPublishing(false);
    }
  }

  function copyLink(link: string) {
    navigator.clipboard?.writeText(link).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      },
      () => {},
    );
  }

  if (created) {
    const link = typeof window !== 'undefined' ? `${window.location.origin}/@${created.slug}` : `/@${created.slug}`;
    return (
      <Card className="mx-auto max-w-2xl animate-scale-in">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-vibe-400/30 bg-vibe-400/10">
            <Check className="h-6 w-6 text-vibe-300" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">Your tip jar is live</h2>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-white/45">
            Share the link. Humans can tip you in $VIBES on Base — and the VibeMusic agent can now discover your linked
            tracks and tip you autonomously.
          </p>

          <div className="mx-auto mt-5 flex max-w-md items-center gap-2 rounded-xl border border-white/[0.08] bg-black/40 p-1.5 pl-3">
            <span className="truncate text-[12.5px] text-white/60">{link}</span>
            <Button size="sm" variant="secondary" className="ml-auto shrink-0" onClick={() => copyLink(link)}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <a href={`/@${created.slug}`}>
              <Button variant="accent" size="lg" className="w-full sm:w-auto">
                Open my jar <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setCreated(null);
                setName('');
                setSlug('');
                setSlugTouched(false);
                setBio('');
                setTracks([]);
              }}
            >
              Edit / create another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        {/* ── identity ─────────────────────────────────────────────── */}
        <Card>
          <CardContent className="space-y-4">
            <Section n={1} title="Your artist profile" hint="Shown on your public tip jar" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Luna Waves"
                  maxLength={48}
                />
              </div>
              <div>
                <Label htmlFor="slug" hint="your public url">
                  Handle
                </Label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] text-white/25">@</span>
                  <Input
                    id="slug"
                    value={effectiveSlug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugify(e.target.value));
                    }}
                    placeholder="luna"
                    maxLength={24}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="bio" hint={`${bio.length}/280`}>
                Short bio
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 280))}
                placeholder="Bedroom producer making lo-fi for the 2am crowd."
                className="min-h-[72px]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="x" hint="optional">
                  X handle
                </Label>
                <Input id="x" value={x} onChange={(e) => setX(e.target.value)} placeholder="lunawaves" />
              </div>
              <div>
                <Label htmlFor="image" hint="optional url">
                  Profile image
                </Label>
                <Input
                  id="image"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://…"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── tracks ───────────────────────────────────────────────── */}
        <Card>
          <CardContent className="space-y-3">
            <Section n={2} title="Link Audius tracks" hint={`${tracks.length}/3 linked`} />

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTrack()}
                  placeholder="Paste audius.co link, track id or search a title"
                  className="pl-9"
                  disabled={resolving || tracks.length >= 3}
                />
              </div>
              <Button onClick={() => addTrack()} loading={resolving} disabled={tracks.length >= 3} variant="secondary">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>

            {tracks.length > 0 && (
              <div className="space-y-1.5">
                {tracks.map((t, i) => (
                  <TrackRow
                    key={t.id}
                    track={t}
                    index={i}
                    compact
                    onRemove={() => setTracks((prev) => prev.filter((x) => x.id !== t.id))}
                  />
                ))}
              </div>
            )}

            {tracks.length < 3 && picks.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/25">
                  <Sparkles className="h-2.5 w-2.5" /> quick picks · trending on Audius
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {picks
                    .filter((p) => !tracks.some((t) => t.id === p.id))
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addPick(p)}
                        className="group flex w-[168px] shrink-0 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1.5 text-left transition hover:border-vibe-400/40 hover:bg-vibe-400/[0.06]"
                      >
                        <Artwork src={p.artwork} seed={p.id} name={p.title} className="h-9 w-9" />
                        <div className="min-w-0">
                          <p className="truncate text-[11.5px] font-medium text-white/80">{p.title}</p>
                          <p className="truncate text-[10.5px] text-white/35">@{p.artistHandle}</p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            <p className="text-[11px] leading-relaxed text-white/25">
              Metadata, artwork and previews come from the free Audius API ({AUDIUS_API.replace('https://', '')}).
              Linking a track also links your Audius handle, which is how the agent finds you.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── preview / publish ──────────────────────────────────────── */}
      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardContent className="p-5">
            <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/30">live preview</p>
            <div className="flex items-center gap-3">
              <Artwork
                src={image || tracks[0]?.artwork}
                seed={wallet ?? 'preview'}
                name={name || 'You'}
                className="h-14 w-14"
                rounded="rounded-full"
              />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-white">{name || 'Your name'}</p>
                <p className="truncate text-[12px] text-white/40">@{effectiveSlug || 'handle'}</p>
              </div>
              <Badge tone="vibe" className="ml-auto">
                tip jar
              </Badge>
            </div>
            <p className="mt-3 line-clamp-2 min-h-[32px] text-[12.5px] leading-relaxed text-white/45">
              {bio || 'Your bio appears here — tell fans what they are supporting.'}
            </p>
            <div className="mt-3 space-y-1.5">
              {tracks.length ? (
                tracks.map((t) => <TrackRow key={t.id} track={t} compact />)
              ) : (
                <div className="rounded-xl border border-dashed border-white/[0.08] px-3 py-4 text-center text-[11.5px] text-white/25">
                  linked tracks show up here
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={cn('border-vibe-400/20 bg-gradient-to-b from-vibe-400/[0.07] to-transparent')}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-vibe-300" />
              <p className="text-[13px] font-semibold text-white/85">
                {wallet ? `Publishing as ${shortAddress(wallet)}` : 'Connect a wallet to publish'}
              </p>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/40">
              {IS_DEMO
                ? 'Demo mode: your jar is stored in this browser only. Set NEXT_PUBLIC_API_BASE to a running Worker to go on-chain.'
                : 'You will sign a free message (no gas) to prove the wallet is yours. Tips arrive directly in this wallet.'}
            </p>

            {error && (
              <p className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-red-400/25 bg-red-400/10 p-2 text-[11.5px] leading-relaxed text-red-200">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                {error}
              </p>
            )}

            <Button
              variant="accent"
              size="lg"
              className="mt-3 w-full"
              onClick={publish}
              loading={publishing}
              disabled={!wallet || !name || tracks.length === 0 || publishing}
            >
              {!isConnected && !IS_DEMO ? 'Connect wallet' : 'Publish tip jar'}
              {!publishing && <ArrowRight className="h-4 w-4" />}
            </Button>

            {IS_DEMO && !isConnected && (
              <p className="mt-2 text-center text-[10.5px] text-white/25">
                Using a local demo wallet: <span className="num">{shortAddress(wallet)}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/25">checklist</p>
          <ul className="mt-2 space-y-1.5 text-[12px] text-white/45">
            <ChecklistItem ok={!!name.trim()}>Display name</ChecklistItem>
            <ChecklistItem ok={/^[a-z0-9_-]{2,24}$/.test(effectiveSlug)}>Unique handle</ChecklistItem>
            <ChecklistItem ok={tracks.length > 0}>At least one Audius track</ChecklistItem>
            <ChecklistItem ok={!!wallet}>Wallet</ChecklistItem>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Section({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-[13.5px] font-semibold text-white/85">
        <span className="flex h-5 w-5 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-[10.5px] text-white/50">
          {n}
        </span>
        {title}
      </h2>
      {hint && <span className="text-[10.5px] uppercase tracking-wider text-white/25">{hint}</span>}
    </div>
  );
}

function ChecklistItem({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={cn(
          'flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[8px]',
          ok ? 'border-vibe-400/50 bg-vibe-400/20 text-vibe-300' : 'border-white/15 text-transparent',
        )}
      >
        <Check className="h-2 w-2" />
      </span>
      <span className={ok ? 'text-white/70' : ''}>{children}</span>
    </li>
  );
}
