import { useState, useEffect } from 'react';
import { getApiInstance } from '../../services/xtreamApi';
import type { LiveStream, EpgEntry } from '../../types';

interface EpgPanelProps {
  channel: LiveStream | null;
  onPlay: (channel: LiveStream) => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getProgressPercent(entry: EpgEntry): number {
  const now = Date.now() / 1000;
  const total = entry.stop_timestamp - entry.start_timestamp;
  const elapsed = now - entry.start_timestamp;
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

function isCurrentlyAiring(entry: EpgEntry): boolean {
  const now = Date.now() / 1000;
  return now >= entry.start_timestamp && now <= entry.stop_timestamp;
}

export default function EpgPanel({ channel, onPlay }: EpgPanelProps) {
  const [epgData, setEpgData] = useState<EpgEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!channel) {
      setEpgData([]);
      return;
    }
    const api = getApiInstance();
    if (!api) return;

    setLoading(true);
    api
      .getEpg(channel.stream_id, 4)
      .then((res) => {
        setEpgData(res.epg_listings || []);
      })
      .catch(() => setEpgData([]))
      .finally(() => setLoading(false));
  }, [channel?.stream_id]);

  if (!channel) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center p-6"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="text-sm text-center">Sélectionnez une chaîne</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Channel Header */}
      <div
        className="p-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          {channel.stream_icon ? (
            <img
              src={channel.stream_icon}
              alt={channel.name}
              className="w-12 h-12 rounded-lg object-contain"
              style={{ background: 'rgba(255,255,255,0.07)' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <svg className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.3)' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 6H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 14H3V8h18v12z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-white">{channel.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#22c55e', boxShadow: '0 0 4px #22c55e' }}
              />
              <span className="text-xs" style={{ color: '#22c55e' }}>EN DIRECT</span>
            </div>
          </div>
        </div>

        {/* Play button */}
        <button
          onClick={() => onPlay(channel)}
          className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity active:opacity-80"
          style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', color: '#fff' }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Regarder en direct
        </button>
      </div>

      {/* EPG List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2">
        <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          PROGRAMME
        </p>

        {loading && (
          <div className="flex items-center justify-center py-6">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'rgba(0,212,255,0.3)', borderTopColor: '#00d4ff' }}
            />
          </div>
        )}

        {!loading && epgData.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Aucune info de programme
          </p>
        )}

        {epgData.map((entry) => {
          const current = isCurrentlyAiring(entry);
          const pct = current ? getProgressPercent(entry) : 0;

          let title = entry.title;
          try {
            title = atob(entry.title);
          } catch {
            // not base64
          }

          return (
            <div
              key={entry.id}
              className="px-2 py-2 rounded-lg mb-1"
              style={{
                background: current ? 'rgba(0,212,255,0.08)' : 'transparent',
                border: current ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: current ? '#00d4ff' : 'rgba(255,255,255,0.75)' }}
                  >
                    {title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {formatTime(entry.start_timestamp)} — {formatTime(entry.stop_timestamp)}
                  </p>
                </div>
                {current && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                    style={{ background: 'rgba(0,212,255,0.2)', color: '#00d4ff', fontSize: '0.55rem' }}
                  >
                    EN COURS
                  </span>
                )}
              </div>

              {current && (
                <div
                  className="mt-1.5 h-0.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: '#00d4ff' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
