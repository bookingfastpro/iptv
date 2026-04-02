import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { getApiInstance } from '../services/xtreamApi';
import CategorySidebar from '../components/UI/CategorySidebar';
import ChannelCard from '../components/Cards/ChannelCard';
import EpgPanel from '../components/EPG/EpgPanel';
import SearchInput from '../components/UI/SearchInput';
import { FullPageLoader } from '../components/UI/LoadingSpinner';
import type { LiveStream } from '../types';

type Panel = 'channels' | 'epg';

export default function LiveTV() {
  const navigate = useNavigate();
  const {
    liveCategories,
    liveStreams,
    currentLiveCategory,
    setCurrentLiveCategory,
    fetchLiveCategories,
    fetchLiveStreams,
    isLoading,
    credentials,
  } = useAppStore();

  const [activePanel, setActivePanel] = useState<Panel>('channels');
  const [selectedChannel, setSelectedChannel] = useState<LiveStream | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (liveCategories.length === 0) {
      fetchLiveCategories().then(() => fetchLiveStreams());
    } else if (liveStreams.length === 0) {
      fetchLiveStreams();
    }
  }, []);

  const filteredStreams = search.trim()
    ? liveStreams.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : liveStreams;

  function handlePlay(channel: LiveStream) {
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

  function handleChannelSelect(channel: LiveStream) {
    // First tap selects and shows EPG; second tap (or play button in EPG) plays
    if (selectedChannel?.stream_id === channel.stream_id) {
      handlePlay(channel);
    } else {
      setSelectedChannel(channel);
      setActivePanel('epg');
    }
  }

  if (isLoading && liveStreams.length === 0 && liveCategories.length === 0) {
    return <FullPageLoader />;
  }

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
          <h1 className="font-bold text-white flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: '#ef4444', boxShadow: '0 0 6px #ef4444' }}
            />
            Live TV
            <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>
              ({filteredStreams.length})
            </span>
          </h1>

          {/* Panel toggle */}
          {selectedChannel && (
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {(['channels', 'epg'] as Panel[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePanel(p)}
                  className="px-3 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    background: activePanel === p ? 'rgba(0,212,255,0.15)' : 'transparent',
                    color: activePanel === p ? '#00d4ff' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {p === 'channels' ? 'Chaînes' : 'Programme'}
                </button>
              ))}
            </div>
          )}
        </div>

        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setActivePanel('channels'); }}
          placeholder="Rechercher une chaîne..."
        />
      </div>

      {/* Main layout: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Categories sidebar */}
        <CategorySidebar
          categories={liveCategories}
          selected={currentLiveCategory}
          onSelect={(id) => {
            setCurrentLiveCategory(id);
            setActivePanel('channels');
          }}
        />

        {/* Main panel */}
        <div className="flex-1 overflow-hidden">
          {/* Channels list */}
          {activePanel === 'channels' && (
            <div className="h-full overflow-y-auto no-scrollbar">
              {isLoading ? (
                <FullPageLoader />
              ) : filteredStreams.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Aucune chaîne trouvée
                  </p>
                </div>
              ) : (
                filteredStreams.map((channel) => (
                  <ChannelCard
                    key={channel.stream_id}
                    channel={channel}
                    isSelected={selectedChannel?.stream_id === channel.stream_id}
                    onClick={() => handleChannelSelect(channel)}
                  />
                ))
              )}
            </div>
          )}

          {/* EPG panel */}
          {activePanel === 'epg' && (
            <div className="h-full overflow-hidden">
              <EpgPanel channel={selectedChannel} onPlay={handlePlay} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
