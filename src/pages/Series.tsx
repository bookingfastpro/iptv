import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import CategorySidebar from '../components/UI/CategorySidebar';
import SeriesCard from '../components/Cards/SeriesCard';
import SearchInput from '../components/UI/SearchInput';
import { FullPageLoader } from '../components/UI/LoadingSpinner';

export default function Series() {
  const {
    seriesCategories,
    seriesStreams,
    currentSeriesCategory,
    setCurrentSeriesCategory,
    fetchSeriesCategories,
    fetchSeriesStreams,
    isLoading,
  } = useAppStore();

  const [search, setSearch] = useState('');

  useEffect(() => {
    if (seriesCategories.length === 0) {
      fetchSeriesCategories().then(() => fetchSeriesStreams());
    } else if (seriesStreams.length === 0) {
      fetchSeriesStreams();
    }
  }, []);

  const displayStreams = search.trim()
    ? seriesStreams.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : seriesStreams;

  if (isLoading && seriesStreams.length === 0) return <FullPageLoader />;

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
        <div className="flex items-center mb-2">
          <h1 className="font-bold text-white">
            Séries
            <span className="ml-2 text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>
              ({displayStreams.length})
            </span>
          </h1>
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher une série..."
        />
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <CategorySidebar
          categories={seriesCategories}
          selected={currentSeriesCategory}
          onSelect={setCurrentSeriesCategory}
        />

        <div className="flex-1 overflow-y-auto no-scrollbar p-3">
          {isLoading ? (
            <FullPageLoader />
          ) : displayStreams.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Aucune série trouvée
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {displayStreams.map((s) => (
                <SeriesCard key={s.series_id} series={s} size="sm" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
