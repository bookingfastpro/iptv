import { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  streamType?: 'live' | 'vod' | 'series';
  initialPosition?: number;
  knownDuration?: number | null;
  onBack: () => void;
  onTimeUpdate?: (position: number, duration: number) => void;
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({
  src,
  title,
  poster,
  streamType = 'vod',
  initialPosition = 0,
  knownDuration = null,
  onBack,
  onTimeUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const knownDurationRef = useRef<number | null>(knownDuration);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Pour les streams proxy : offset FFmpeg (-ss), currentTime réel = video.currentTime + seekOffset
  const [seekOffset, setSeekOffset] = useState(0);
  const seekOffsetRef = useRef(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const isLive = streamType === 'live';

  // Synchroniser le ref avec la prop (toujours à jour dans les closures)
  useEffect(() => {
    knownDurationRef.current = knownDuration;
  }, [knownDuration]);

  // Mettre à jour la durée dès que ffprobe répond (priorité absolue sur video.duration)
  useEffect(() => {
    if (knownDuration && knownDuration > 0) {
      setDuration(knownDuration);
    }
  }, [knownDuration]);

  // Vérifier la durée à nouveau après 5s (au cas où ffprobe répond tard)
  useEffect(() => {
    if (isLive) return;
    const timer = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      const d = video.duration;
      if (isFinite(d) && d > 0) {
        setDuration(prev => d > prev ? d : prev);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [src, isLive]);

  // ── Controls auto-hide ─────────────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // ── HLS / Native setup ─────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(null);
    setIsLoading(true);
    setIsPlaying(false);

    // Unmute explicitly (React muted prop is unreliable)
    video.muted = false;
    video.volume = 1;

    function initNative() {
      video!.src = src;
      video!.load();
      video!.addEventListener('canplay', () => {
        if (initialPosition > 0 && !isLive) video!.currentTime = initialPosition;
        video!.muted = false;
        video!.volume = 1;
        video!.play().catch(() => {});
      }, { once: true });
    }

    // Detect if this is an HLS stream (.m3u8)
    // Proxy URLs (/vod, /live) retournent du fMP4 → traités comme native, pas HLS
    const isHlsUrl = /\.m3u8(\?|$)/i.test(src)
      || (src.toLowerCase().includes('.m3u8') && !src.includes('localhost:4000') && !src.includes('127.0.0.1:4000'));

    if (!isHlsUrl) {
      // Direct video file (MP4, MKV, TS, AVI...) — always use native player
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      initNative();
    } else if (video.canPlayType('application/vnd.apple.mpegurl') !== '') {
      // iOS Safari: native HLS support
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      initNative();
    } else if (Hls.isSupported()) {
      // Desktop (Chrome/Firefox): use HLS.js for .m3u8 streams
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: isLive,
        backBufferLength: isLive ? 0 : 30,
        maxBufferLength: isLive ? 10 : 60,
        startLevel: -1,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (initialPosition > 0 && !isLive) video.currentTime = initialPosition;
        video.muted = false;
        video.volume = 1;
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          setError('Erreur de lecture. Vérifiez votre connexion.');
          setIsLoading(false);
        }
      });
      hlsRef.current = hls;
    } else {
      // Last fallback
      initNative();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, isLive, initialPosition]);

  // ── Video event listeners ─────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      const known = knownDurationRef.current;
      const d = isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
      // ffprobe a priorité si sa valeur est plus grande
      setDuration(known && known > d ? known : d);
      setIsLoading(false);
      if (initialPosition > 0 && !isLive && video.readyState >= 2) {
        video.currentTime = initialPosition;
      }
    };

    // Met à jour la durée — ne diminue jamais, respecte knownDuration
    const handleDurationChange = () => {
      const known = knownDurationRef.current;
      if (known && known > 0) {
        setDuration(known); // ffprobe a priorité
        return;
      }
      const d = video.duration;
      if (isFinite(d) && d > 0) {
        setDuration(prev => d > prev ? d : prev);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      if (!video.paused) setIsPlaying(true);
    };

    // Sync muted/volume state with actual video element (browser may override)
    const handleVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.muted ? 0 : video.volume);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime + seekOffsetRef.current);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1) + seekOffsetRef.current);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      const err = video.error;
      if (err) {
        setError(`Erreur ${err.code}: ${err.message || 'Impossible de lire ce flux'}`);
        setIsLoading(false);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [isLive, initialPosition]);

  // ── Save progress every 10s ────────────────────────────────────────────
  useEffect(() => {
    if (isLive || !onTimeUpdate) return;

    progressTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && video.duration > 0) {
        onTimeUpdate(video.currentTime, video.duration);
      }
    }, 10000);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isLive, onTimeUpdate]);

  // ── Controls timer start ───────────────────────────────────────────────
  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [resetControlsTimer]);

  // ── Fullscreen change listener ─────────────────────────────────────────
  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(
        !!(document.fullscreenElement || (document as unknown as { webkitFullscreenElement: Element | null }).webkitFullscreenElement)
      );
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    document.addEventListener('webkitfullscreenchange', handleFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
      document.removeEventListener('webkitfullscreenchange', handleFSChange);
    };
  }, []);

  // ── Screen orientation lock (iOS PWA) ─────────────────────────────────
  useEffect(() => {
    // Lock to landscape on player mount when possible
    try {
      (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape').catch(() => {});
    } catch {
      // Not supported on all platforms
    }
    return () => {
      try {
        screen.orientation.unlock?.();
      } catch {
        // ignore
      }
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────
  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.muted = false;
      video.volume = volume > 0 ? volume : 1;
      setIsMuted(false);
      video.play().catch(console.error);
    } else {
      video.pause();
    }
    resetControlsTimer();
  }

  function reloadAtPosition(t: number) {
    const video = videoRef.current;
    if (!video) return;
    const isProxy = src.includes('localhost:4000') || src.includes('127.0.0.1:4000');
    if (isProxy) {
      // Recharger le stream proxy depuis la position t (FFmpeg -ss)
      const baseUrl = src.split('&start=')[0];
      seekOffsetRef.current = t;
      setSeekOffset(t);
      setCurrentTime(t);
      setIsLoading(true);
      video.src = `${baseUrl}&start=${Math.floor(t)}`;
      video.load();
      video.addEventListener('canplay', () => {
        video.muted = false;
        video.volume = 1;
        video.play().catch(() => {});
      }, { once: true });
    } else {
      video.currentTime = t;
      setCurrentTime(t);
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (isLive) return;
    reloadAtPosition(parseFloat(e.target.value));
    resetControlsTimer();
  }

  function skip(seconds: number) {
    if (isLive) return;
    reloadAtPosition(currentTime + seconds);
    resetControlsTimer();
  }

  function toggleFullscreen() {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    const doc = document as unknown as {
      webkitFullscreenElement: Element | null;
      exitFullscreen: () => Promise<void>;
      webkitExitFullscreen: () => void;
    };

    const el = container as unknown as {
      requestFullscreen: () => Promise<void>;
      webkitRequestFullscreen: () => void;
    };

    if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(console.error);
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    }
    resetControlsTimer();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !video.muted;
    video.muted = newMuted;
    if (!newMuted && video.volume === 0) video.volume = 1;
    setIsMuted(newMuted);
    setVolume(video.volume);
    resetControlsTimer();
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const v = parseFloat(e.target.value);
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setIsMuted(v === 0);
    resetControlsTimer();
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden"
      style={{ touchAction: 'none' }}
      onTouchStart={resetControlsTimer}
      onClick={resetControlsTimer}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        style={{ objectFit: 'contain' }}
        poster={poster}
        playsInline
        preload="auto"
      />

      {/* Loading spinner */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin"
            style={{
              borderColor: 'rgba(0,212,255,0.2)',
              borderTopColor: '#00d4ff',
              borderStyle: 'solid',
              borderWidth: '3px',
            }}
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
          <svg className="w-16 h-16" style={{ color: 'rgba(255,255,255,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-white/70 text-center text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(0,212,255,0.2)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-300 flex flex-col"
        style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none' }}
        onClick={togglePlay}
      >
        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-4 pt-4 pb-8"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)' }}
            aria-label="Retour"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            {title && (
              <p className="text-white font-semibold text-sm truncate">{title}</p>
            )}
          </div>

          {isLive && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-400">LIVE</span>
            </div>
          )}
        </div>

        {/* Center play/pause */}
        <div className="flex-1 flex items-center justify-center gap-8" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
          {!isLive && (
            <button
              onClick={(e) => { e.stopPropagation(); skip(-10); }}
              className="w-12 h-12 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                <text x="9" y="14" fontSize="6" fill="white" fontWeight="bold">10</text>
              </svg>
            </button>
          )}

          <button
            className="w-16 h-16 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(0,212,255,0.25)', border: '2px solid rgba(0,212,255,0.6)' }}
          >
            {isLoading ? (
              <div
                className="w-7 h-7 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(0,212,255,0.3)', borderTopColor: '#00d4ff' }}
              />
            ) : isPlaying ? (
              <svg className="w-7 h-7" style={{ color: '#00d4ff' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-7 h-7 ml-1" style={{ color: '#00d4ff' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {!isLive && (
            <button
              onClick={(e) => { e.stopPropagation(); skip(10); }}
              className="w-12 h-12 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
              </svg>
            </button>
          )}
        </div>

        {/* Bottom controls */}
        <div
          className="px-4 pb-4"
          style={{
            background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar (hide for live) */}
          {!isLive && (
            <div className="mb-2">
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={1}
                value={currentTime}
                onChange={handleSeek}
                className="progress-bar w-full"
                style={{
                  background: `linear-gradient(to right, #00d4ff ${progressPct}%, rgba(255,255,255,0.25) ${progressPct}%)`,
                }}
              />
            </div>
          )}

          {/* Time & controls row */}
          <div className="flex items-center gap-3">
            {/* Mute button */}
            <button onClick={toggleMute} className="flex-shrink-0">
              {isMuted || volume === 0 ? (
                <svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>

            {/* Volume slider */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="progress-bar w-20"
            />

            {/* Time display */}
            {!isLive && (
              <div className="text-xs text-white/70 flex-1 text-center font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            )}

            {isLive && <div className="flex-1" />}

            {/* Fullscreen button */}
            <button onClick={toggleFullscreen} className="flex-shrink-0">
              {isFullscreen ? (
                <svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
