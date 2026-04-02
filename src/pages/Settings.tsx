import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { clearHistory } from '../services/storage';
import { isLocalProxyEnabled, setLocalProxy } from '../services/xtreamApi';

export default function Settings() {
  const navigate = useNavigate();
  const {
    userInfo,
    serverInfo,
    credentials,
    profiles,
    watchHistory,
    favorites,
    vodStreams,
    liveStreams,
    seriesStreams,
    logout,
    removeProfile,
    refreshAll,
    isLoading,
    setToast,
  } = useAppStore();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteProfile, setShowDeleteProfile] = useState<string | null>(null);
  const [proxyEnabled, setProxyEnabled] = useState(isLocalProxyEnabled());

  function handleProxyToggle() {
    const next = !proxyEnabled;
    setLocalProxy(next);
    setProxyEnabled(next);
    setToast({ message: next ? 'Proxy activé — relancez la lecture' : 'Proxy désactivé', type: 'success' });
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function handleRefresh() {
    await refreshAll();
  }

  function handleClearHistory() {
    clearHistory();
    setToast({ message: 'Historique effacé', type: 'success' });
  }

  const expDate = userInfo?.exp_date
    ? new Date(parseInt(userInfo.exp_date) * 1000)
    : null;

  const daysLeft = expDate
    ? Math.max(0, Math.floor((expDate.getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div
      className="min-h-screen px-4"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <h1 className="font-bold text-white text-xl mb-5">Réglages</h1>

      {/* Account card */}
      {userInfo && credentials && (
        <div
          className="rounded-2xl p-4 mb-4"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))',
                border: '1px solid rgba(0,212,255,0.3)',
                color: '#00d4ff',
              }}
            >
              {userInfo.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white">{userInfo.username}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {credentials.serverUrl.replace(/^https?:\/\//, '')}
              </p>
            </div>
            <div>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={{
                  background: userInfo.status === 'Active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: userInfo.status === 'Active' ? '#22c55e' : '#ef4444',
                }}
              >
                {userInfo.status}
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Films', value: vodStreams.length.toLocaleString() },
              { label: 'Chaînes', value: liveStreams.length.toLocaleString() },
              { label: 'Séries', value: seriesStreams.length.toLocaleString() },
              { label: 'Favoris', value: favorites.length.toString() },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-0.5 p-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <span className="text-sm font-bold text-white">{s.value}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription info */}
      {userInfo && (
        <div
          className="rounded-2xl p-4 mb-4"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
        >
          <h2 className="text-xs font-bold mb-3 uppercase" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
            Abonnement
          </h2>
          <div className="flex flex-col gap-2">
            {[
              {
                label: "Date d'expiration",
                value: expDate ? expDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A',
              },
              {
                label: 'Jours restants',
                value: daysLeft !== null ? `${daysLeft} jours` : 'N/A',
                color: daysLeft !== null && daysLeft < 30 ? '#f59e0b' : undefined,
              },
              {
                label: 'Connexions actives',
                value: `${userInfo.active_cons} / ${userInfo.max_connections}`,
              },
              {
                label: 'Essai',
                value: userInfo.is_trial === '1' ? 'Oui' : 'Non',
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.label}</span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: item.color || 'rgba(255,255,255,0.75)' }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Server info */}
      {serverInfo && (
        <div
          className="rounded-2xl p-4 mb-4"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
        >
          <h2 className="text-xs font-bold mb-3 uppercase" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
            Serveur
          </h2>
          <div className="flex flex-col gap-2">
            {[
              { label: 'URL', value: credentials?.serverUrl.replace(/^https?:\/\//, '') || '' },
              { label: 'Version', value: `${serverInfo.version} (r${serverInfo.revision})` },
              { label: 'Protocole', value: serverInfo.server_protocol?.toUpperCase() || 'HTTP' },
              { label: 'Timezone', value: serverInfo.timezone || 'UTC' },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4">
                <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.label}</span>
                <span className="text-xs font-medium text-right truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profiles */}
      {profiles.length > 0 && (
        <div
          className="rounded-2xl p-4 mb-4"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
        >
          <h2 className="text-xs font-bold mb-3 uppercase" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
            Profils sauvegardés ({profiles.length})
          </h2>
          <div className="flex flex-col gap-2">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff' }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {p.username}
                  </p>
                </div>
                {showDeleteProfile === p.id ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { removeProfile(p.id); setShowDeleteProfile(null); }}
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => setShowDeleteProfile(null)}
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteProfile(p.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div
        className="rounded-2xl overflow-hidden mb-4"
        style={{ border: '1px solid rgba(255,255,255,0.09)' }}
      >
        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="w-full flex items-center gap-3 px-4 py-3.5 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,212,255,0.15)' }}
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              style={{ color: '#00d4ff' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-white">Actualiser le contenu</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Recharger toutes les catégories
            </p>
          </div>
          <svg className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Clear history */}
        <button
          onClick={handleClearHistory}
          disabled={watchHistory.length === 0}
          className="w-full flex items-center gap-3 px-4 py-3.5 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            opacity: watchHistory.length === 0 ? 0.4 : 1,
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.15)' }}
          >
            <svg className="w-4 h-4" style={{ color: '#f59e0b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-white">Effacer l'historique</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {watchHistory.length} éléments dans l'historique
            </p>
          </div>
          <svg className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Proxy local */}
        <button
          onClick={handleProxyToggle}
          className="w-full flex items-center gap-3 px-4 py-3.5 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: proxyEnabled ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.06)' }}
          >
            <svg className="w-4 h-4" style={{ color: proxyEnabled ? '#00d4ff' : 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-white">Proxy local (son AC3/Dolby)</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {proxyEnabled ? 'Actif — localhost:4000' : 'Inactif — active pour corriger le son'}
            </p>
          </div>
          <div
            className="w-11 h-6 rounded-full relative transition-all flex-shrink-0"
            style={{ background: proxyEnabled ? '#00d4ff' : 'rgba(255,255,255,0.12)' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
              style={{ left: proxyEnabled ? '22px' : '2px' }}
            />
          </div>
        </button>

        {/* About */}
        <div
          className="w-full flex items-center gap-3 px-4 py-3.5"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(124,58,237,0.15)' }}
          >
            <svg className="w-4 h-4" style={{ color: '#7c3aed' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8v8l7-4z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-white">AURA TV</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Version 1.0.0 — Xtream Codes Compatible
            </p>
          </div>
        </div>
      </div>

      {/* Logout */}
      {!showLogoutConfirm ? (
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171',
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Se déconnecter
        </button>
      ) : (
        <div
          className="p-4 rounded-2xl"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
        >
          <p className="text-sm text-white mb-3 text-center">
            Confirmer la déconnexion ?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
            >
              Annuler
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(239,68,68,0.25)', color: '#f87171' }}
            >
              Déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
