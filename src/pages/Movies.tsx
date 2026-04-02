import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import CategorySidebar from '../components/UI/CategorySidebar';
import MovieCard from '../components/Cards/MovieCard';
import SearchInput from '../components/UI/SearchInput';
import { FullPageLoader } from '../components/UI/LoadingSpinner';

type SortOption = 'default' | 'name' | 'rating' | 'added';

const SORT_LABELS: Record<SortOption, string> = {
  default: 'Par défaut',
  name: 'Nom A-Z',
  rating: 'Mieux notés',
  added: 'Récents',
};

export default function Movies() {
  const {
    vodCategories,
    vodStreams,
    currentVodCategory,
    setCurrentVodCategory,
    fetchVodCategories,
    fetchVodStreams,
    isLoading,
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('added');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    if (vodCategories.length === 0) {
      fetchVodCategories().then(() => fetchVodStreams());
    } else if (vodStreams.length === 0) {
      fetchVodStreams();
    }
  }, []);

  let displayStreams = [...vodStreams];

  // Filter
  if (search.trim()) {
    displayStreams = displayStreams.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Sort
  if (sort === 'name') {
    displayStreams.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'rating') {
    displayStreams.sort((a, b) => (b.rating_5based || 0) - (a.rating_5based || 0));
  } else if (sort === 'added') {
    displayStreams.sort((a, b) => parseInt(b.added) - parseInt(a.added));
  }

  if (isLoading && vodStreams.length === 0) return <FullPageLoader />;

  return (
    <div
      className="flex flex-col"
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 px-4 pt-3 pb-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-bold text-white">
            Films
            <span className="ml-2 text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>
              ({displayStreams.length})
            </span>
          </h1>

          {/* Sort button */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M6 12h12M10 17h4" />
              </svg>
              {SORT_LABELS[sort]}
            </button>

            {showSortMenu && (
              <div
                className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden min-w-32 shadow-xl"
                style={{
                  background: 'rgba(15,15,25,0.98)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSort(opt); setShowSortMenu(false); }}
                    className="w-full px-4 py-2.5 text-left text-xs transition-all"
                    style={{
                      color: sort === opt ? '#00d4ff' : 'rgba(255,255,255,0.6)',
                      background: sort === opt ? 'rgba(0,212,255,0.1)' : 'transparent',
                    }}
                  >
                    {SORT_LABELS[opt]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un film..."
        />
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <CategorySidebar
          categories={vodCategories}
          selected={currentVodCategory}
          onSelect={setCurrentVodCategory}
        />

        {/* Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3">
          {isLoading ? (
            <FullPageLoader />
          ) : displayStreams.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Aucun film trouvé
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {displayStreams.map((movie) => (
                <MovieCard key={movie.stream_id} movie={movie} size="sm" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dismiss sort menu overlay */}
      {showSortMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
      )}
    </div>
  );
}
