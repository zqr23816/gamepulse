'use client';

import { useMemo, useState } from 'react';

const initialEvents = [
  { id: 'evt_8D12', type: 'match.completed', player: 'NovaFox', age: '4s' },
  { id: 'evt_8D11', type: 'player.level_up', player: 'KiteRunner', age: '11s' },
  { id: 'evt_8D10', type: 'purchase.confirmed', player: 'PixelValkyrie', age: '18s' },
  { id: 'evt_8D0F', type: 'session.started', player: 'ArcByte', age: '25s' },
];

const leaderboard = [
  ['NovaFox', 'Diamond I', '2,840', '+124'],
  ['PixelValkyrie', 'Diamond II', '2,715', '+91'],
  ['KiteRunner', 'Platinum I', '2,592', '+76'],
  ['ArcByte', 'Platinum II', '2,481', '+68'],
];

export default function Home() {
  const [events, setEvents] = useState(initialEvents);
  const [matches, setMatches] = useState(324);
  const [status, setStatus] = useState('Live ingestion');
  const [range, setRange] = useState('24h');
  const chart = useMemo(() => range === '24h' ? [44, 52, 46, 69, 63, 81, 73, 91, 78, 86, 72, 94] : [30, 43, 38, 57, 48, 68, 61, 76, 70, 84, 79, 90], [range]);

  async function simulateMatch() {
    setStatus('Submitting match to API…');
    try {
      const response = await fetch('/api/v1/matches/simulate', { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as { eventId: string; winner: string };
      setMatches((value) => value + 1);
      setEvents((value) => [{ id: data.eventId, type: 'match.completed', player: data.winner, age: 'now' }, ...value.slice(0, 3)]);
      setStatus(`Persisted ${data.eventId} · D1 transaction complete`);
    } catch {
      setStatus('API request failed · try again');
    }
  }

  return (
    <main className="min-h-screen bg-[#08111f] text-slate-100">
      <header className="border-b border-white/10 bg-[#0b1627]/90 px-5 py-4 backdrop-blur lg:px-9">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 font-black text-[#06111d]">G</span><div><p className="font-semibold tracking-tight">GamePulse</p><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Telemetry control plane</p></div></div>
          <div className="flex items-center gap-3 text-xs text-slate-400"><span className="hidden rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono sm:inline">NEXUS // prod-eu-1</span><span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" /> Operational</span></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-6 lg:grid-cols-[190px_minmax(0,1fr)] lg:px-9">
        <aside className="hidden lg:block"><nav className="space-y-1 text-sm"><p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">Workspace</p>{['Overview', 'Live events', 'Players', 'Leaderboards', 'API keys'].map((item, index) => <button key={item} className={`w-full rounded-lg px-3 py-2.5 text-left transition ${index === 0 ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><span className="mr-3 font-mono text-xs text-slate-600">0{index + 1}</span>{item}</button>)}</nav><div className="mt-10 border-t border-white/10 pt-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">Event pipeline</p><p className="mt-3 text-xs leading-5 text-slate-500">Batch API → validation → deduplication → ranking projection</p></div></aside>

        <section className="min-w-0">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-400">Production overview</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">NEXUS Arena</h1><p className="mt-1 text-sm text-slate-400">Realtime player activity and competitive health</p></div><button onClick={simulateMatch} className="rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-[#06111d] shadow-[0_8px_30px_rgb(34_211_238/16%)] transition hover:bg-cyan-300 active:translate-y-px">Simulate match</button></div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
            ['Active players', '12,842', '+8.4%', 'online now'], ['Live matches', matches.toLocaleString(), '+12.1%', 'concurrent'], ['Event throughput', '18.4k', '+5.7%', 'events / min'], ['API error rate', '0.021%', '-18.3%', 'last 24 hours'],
          ].map(([label, value, delta, hint]) => <article key={label} className="rounded-xl border border-white/10 bg-[#0d192a] p-4 shadow-[0_18px_50px_rgb(0_0_0/14%)]"><p className="text-xs text-slate-500">{label}</p><div className="mt-3 flex items-baseline justify-between gap-2"><strong className="font-mono text-2xl font-medium text-white">{value}</strong><span className="text-emerald-400">{delta}</span></div><p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-slate-600">{hint}</p></article>)}</div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.8fr)]">
            <article className="rounded-xl border border-white/10 bg-[#0d192a] p-5"><div className="flex items-start justify-between"><div><h2 className="font-medium text-white">Event throughput</h2><p className="mt-1 text-xs text-slate-500">Validated events processed per interval</p></div><div className="flex rounded-lg border border-white/10 bg-black/10 p-1 text-xs">{['24h', '7d'].map((item) => <button key={item} onClick={() => setRange(item)} className={`rounded px-2.5 py-1 ${range === item ? 'bg-white/10 text-white' : 'text-slate-500'}`}>{item}</button>)}</div></div><div className="mt-8 flex h-44 items-end gap-2 border-b border-l border-white/10 px-3 pb-3">{chart.map((height, index) => <div key={index} className="group relative flex-1 rounded-t bg-gradient-to-t from-cyan-500/25 to-cyan-300/90 transition-all hover:to-white" style={{ height: `${height}%` }}><span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 font-mono text-[9px] text-cyan-200 group-hover:block">{height * 240}</span></div>)}</div><div className="mt-3 flex justify-between font-mono text-[10px] text-slate-600"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>NOW</span></div></article>
            <article className="rounded-xl border border-white/10 bg-[#0d192a] p-5"><div className="flex items-center justify-between"><div><h2 className="font-medium text-white">Live event stream</h2><p className="mt-1 text-xs text-slate-500">{status}</p></div><span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" /></div><div className="mt-4 divide-y divide-white/5">{events.map((event) => <div key={event.id} className="grid grid-cols-[1fr_auto] gap-3 py-3"><div className="min-w-0"><p className="truncate font-mono text-xs text-cyan-300">{event.type}</p><p className="mt-1 truncate text-xs text-slate-500">{event.player} · {event.id}</p></div><span className="font-mono text-[10px] text-slate-600">{event.age}</span></div>)}</div></article>
          </div>

          <article className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#0d192a]"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><h2 className="font-medium text-white">Competitive leaderboard</h2><p className="mt-1 text-xs text-slate-500">Season 08 · materialized ranking view</p></div><span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">Updated 9s ago</span></div><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="font-mono text-[10px] uppercase tracking-wider text-slate-600"><tr><th className="px-5 py-3">Rank</th><th className="px-5 py-3">Player</th><th className="px-5 py-3">Tier</th><th className="px-5 py-3">Rating</th><th className="px-5 py-3">24h</th></tr></thead><tbody className="divide-y divide-white/5">{leaderboard.map((row, index) => <tr key={row[0]} className="hover:bg-white/[.025]"><td className="px-5 py-3 font-mono text-slate-500">#{index + 1}</td><td className="px-5 py-3 font-medium text-white">{row[0]}</td><td className="px-5 py-3 text-slate-400">{row[1]}</td><td className="px-5 py-3 font-mono text-slate-300">{row[2]}</td><td className="px-5 py-3 font-mono text-emerald-400">{row[3]}</td></tr>)}</tbody></table></div></article>
        </section>
      </div>
    </main>
  );
}

