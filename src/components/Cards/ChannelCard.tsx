import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { getApiInstance } from '../../services/xtreamApi';
import type { LiveStream } from '../../types';

interface ChannelCardProps {
  channel: LiveStream;
  isSelected?: boolean;
  epgTitle?: string;
  onClick?: () => void;
}

export default function ChannelCard({
  channel,
  isSelected = false,
  epgTitle,
  onClick,
}: ChannelCardProps) {
  const navigate = useNavigate();
  const { favorites, toggleFavorite, credentials } = useAppStore();
  const [imgError, setImgError] = useState(false);

  const isFav = favorites.some((f) => f.id === `live_${channel.stream_id}`);

  function handleClick() {
    if (onClick) {
      onClick();
      return;
    }
    if (!credentials) return;
    const api = getApiInstance();
    const streamUrl = api
      ? api.getLiveStreamUrl(channel.stream_id)
      : `${credentials.serverUrl}/live/${credentials.username}/${credentials.password}/${channel.stream_id}.m3u8`;
    navigate('/player', {
      state: {
        streamUrl,
        streamId: channel.stream_id,
        streamType: 'live',
        title: channel.name,
        poster: channel.stream_icon,
      },
    });
  }

  function handleFavToggle(e: React.MouseEvent) {
    e.stopPropagation();
    toggleFavorite({
      id: `live_${channel.stream_id}`,
      streamId: channel.stream_id,
      streamType: 'live',
      name: channel.name,
      poster: channel.stream_icon,
      addedAt: Date.now(),
    });
  }

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all rounded-lg mx-1 my-0.5"
      style={{
        background: isSelected
          ? 'rgba(0,212,255,0.12)'
          : 'transparent',
        border: isSelected
          ? '1px solid rgba(0,212,255,0.3)'
          : '1px solid transparent',
      }}
      onClick={handleClick}
    >
      {/* Channel logo */}
      <div
        className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.07)' }}
      >
        {channel.stream_icon && !imgError ? (
          <img
            src={channel.stream_icon}
            alt={channel.name}
            className="w-full h-full object-contain"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg
            className="w-5 h-5"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M21 6H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 14H3V8h18v12zM9 10v8l7-4z" />
          </svg>
        )}
      </div>

      {/* Channel info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-semibold truncate"
          style={{ color: isSelected ? '#00d4ff' : '#fff' }}
        >
          {channel.name}
        </p>
        {epgTitle && (
          <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {epgTitle}
          </p>
        )}
      </div>

      {/* Favorite + Live badge */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {channel.tv_archive === 1 && (
          <span
            className="text-xs px-1.5 py-0.5 rounded font-semibold"
            style={{ background: 'rgba(124,58,237,0.3)', color: '#c4b5fd', fontSize: '0.6rem' }}
          >
            DVR
          </span>
        )}
        <button
          onClick={handleFavToggle}
          className="w-6 h-6 flex items-center justify-center"
          aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <svg
            className="w-3.5 h-3.5"
            fill={isFav ? '#e879f9' : 'none'}
            viewBox="0 0 24 24"
            stroke={isFav ? '#e879f9' : 'rgba(255,255,255,0.35)'}
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
