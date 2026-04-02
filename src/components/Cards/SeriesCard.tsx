import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import type { SeriesStream } from '../../types';

interface SeriesCardProps {
  series: SeriesStream;
  size?: 'sm' | 'md' | 'lg';
}

export default function SeriesCard({ series, size = 'md' }: SeriesCardProps) {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useAppStore();
  const [imgError, setImgError] = useState(false);

  const isFav = favorites.some((f) => f.id === `series_${series.series_id}`);

  const sizeClasses = {
    sm: 'w-28',
    md: 'w-36',
    lg: 'w-44',
  };

  const heightClasses = {
    sm: 'h-40',
    md: 'h-52',
    lg: 'h-64',
  };

  function handleClick() {
    navigate(`/series/${series.series_id}`);
  }

  function handleFavToggle(e: React.MouseEvent) {
    e.stopPropagation();
    toggleFavorite({
      id: `series_${series.series_id}`,
      streamId: series.series_id,
      streamType: 'series',
      name: series.name,
      poster: series.cover,
      addedAt: Date.now(),
    });
  }

  return (
    <div
      className={`${sizeClasses[size]} flex-shrink-0 cursor-pointer group`}
      onClick={handleClick}
    >
      <div
        className={`relative ${heightClasses[size]} rounded-xl overflow-hidden`}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Poster Image */}
        {series.cover && !imgError ? (
          <img
            src={series.cover}
            alt={series.name}
            className="w-full h-full object-cover transition-transform duration-300 group-active:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-10 h-10"
              style={{ color: 'rgba(255,255,255,0.2)' }}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8v8l7-4z" />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 gradient-card-overlay" />

        {/* Rating badge */}
        {series.rating_5based > 0 && (
          <div
            className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold"
            style={{ background: 'rgba(0,0,0,0.7)', color: '#fbbf24' }}
          >
            ★ {series.rating_5based.toFixed(1)}
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={handleFavToggle}
          className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-full transition-all"
          style={{
            background: isFav ? 'rgba(232,121,249,0.3)' : 'rgba(0,0,0,0.5)',
            border: `1px solid ${isFav ? '#e879f9' : 'rgba(255,255,255,0.2)'}`,
          }}
          aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <svg
            className="w-3.5 h-3.5"
            fill={isFav ? '#e879f9' : 'none'}
            viewBox="0 0 24 24"
            stroke={isFav ? '#e879f9' : '#fff'}
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {/* Genre tag */}
        {series.genre && (
          <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-6 gradient-card-overlay">
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(124,58,237,0.5)', color: '#c4b5fd' }}
            >
              {series.genre.split('/')[0].trim()}
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <p className="mt-1.5 text-xs font-medium text-white/80 truncate px-0.5">
        {series.name}
      </p>
    </div>
  );
}
