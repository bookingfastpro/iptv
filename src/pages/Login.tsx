import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import LoadingSpinner from '../components/UI/LoadingSpinner';

export default function Login() {
  const { login, isLoading, error, clearError, profiles, loginWithProfile } = useAppStore();

  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'profiles'>('login');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!serverUrl.trim() || !username.trim() || !password.trim()) return;
    await login(serverUrl.trim(), username.trim(), password.trim());
  }

  async function handleProfileLogin(profile: (typeof profiles)[0]) {
    await loginWithProfile(profile);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: '#0a0a0f' }}
    >
      {/* Ambient glow blobs */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2 animate-fade-in">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))',
            border: '1px solid rgba(0,212,255,0.3)',
            boxShadow: '0 0 30px rgba(0,212,255,0.2)',
          }}
        >
          <svg className="w-10 h-10" style={{ color: '#00d4ff' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8v8l7-4z" />
          </svg>
        </div>
        <h1
          className="text-3xl font-bold tracking-widest text-glow-cyan"
          style={{ color: '#00d4ff' }}
        >
          AURA TV
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Premium IPTV Player
        </p>
      </div>

      {/* Main card */}
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {(['login', 'profiles'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-3.5 text-sm font-semibold transition-all"
              style={{
                color: activeTab === tab ? '#00d4ff' : 'rgba(255,255,255,0.4)',
                borderBottom: activeTab === tab ? '2px solid #00d4ff' : '2px solid transparent',
                background: 'transparent',
              }}
            >
              {tab === 'login' ? 'Connexion' : `Profils (${profiles.length})`}
            </button>
          ))}
        </div>

        {/* Login form */}
        {activeTab === 'login' && (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#fca5a5',
                }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Server URL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                URL DU SERVEUR
              </label>
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://iptv.exemple.com:8080"
                required
                className="px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(0,212,255,0.5)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                NOM D'UTILISATEUR
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="utilisateur"
                required
                className="px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(0,212,255,0.5)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                MOT DE PASSE
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-white/20 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(0,212,255,0.5)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 mt-1"
              style={{
                background: isLoading
                  ? 'rgba(0,212,255,0.3)'
                  : 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                color: '#fff',
                boxShadow: isLoading ? 'none' : '0 0 20px rgba(0,212,255,0.3)',
              }}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="#fff" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Se connecter
                </>
              )}
            </button>

            {/* Save as profile hint */}
            <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Votre profil sera sauvegardé automatiquement
            </p>
          </form>
        )}

        {/* Profiles tab */}
        {activeTab === 'profiles' && (
          <div className="p-5">
            {profiles.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <svg className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Aucun profil sauvegardé.{'\n'}Connectez-vous d'abord.
                </p>
                <button
                  onClick={() => setActiveTab('login')}
                  className="text-sm font-semibold"
                  style={{ color: '#00d4ff' }}
                >
                  Aller à Connexion
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleProfileLogin(profile)}
                    disabled={isLoading}
                    className="flex items-center gap-3 p-3 rounded-xl text-left transition-all active:scale-98"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #00d4ff33, #7c3aed33)',
                        border: '1px solid rgba(0,212,255,0.3)',
                        color: '#00d4ff',
                      }}
                    >
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{profile.name}</p>
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {profile.username} @ {profile.serverUrl.replace(/^https?:\/\//, '')}
                      </p>
                    </div>
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#00d4ff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>
        AURA TV v1.0 — Xtream Codes Compatible
      </p>
    </div>
  );
}
