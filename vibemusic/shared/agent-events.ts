/** Flatten missions into the public Agent Activity feed (shared frontend/worker). */
import type { AgentEvent, AgentMission } from './types';

export function eventsFromMissions(missions: AgentMission[], limit = 40): AgentEvent[] {
  const events: AgentEvent[] = [];
  for (const m of missions) {
    for (const s of m.steps ?? []) {
      events.push({
        id: `${m.id}-${s.at}-${events.length}`,
        at: s.at,
        missionId: m.id,
        prompt: m.prompt,
        stage: s.stage,
        text: s.text,
        detail: s.detail ?? null,
        txHash: s.txHash ?? null,
        amount: s.amount ?? null,
        trackTitle: s.trackTitle ?? null,
        artist: s.artist ?? null,
        artwork: s.artwork ?? null,
      });
    }
  }
  return events.sort((a, b) => b.at - a.at).slice(0, limit);
}
