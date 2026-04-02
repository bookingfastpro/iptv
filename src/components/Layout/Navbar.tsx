import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: (active: boolean) => JSX.Element;
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Accueil',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? '#00d4ff' : 'none'} viewBox="0 0 24 24" stroke={active ? '#00d4ff' : 'currentColor'} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: '/live',
    label: 'Live',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? '#00d4ff' : 'none'} viewBox="0 0 24 24" stroke={active ? '#00d4ff' : 'currentColor'} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    path: '/movies',
    label: 'Films',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? '#00d4ff' : 'none'} viewBox="0 0 24 24" stroke={active ? '#00d4ff' : 'currentColor'} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125A1.125 1.125 0 013.375 20.625m0 0h17.25m0-1.125A1.125 1.125 0 0120.625 19.5m0 0h-1.5A1.125 1.125 0 0118 18.375m3.75 1.125A1.125 1.125 0 0120.625 21H3.375A1.125 1.125 0 012.25 19.875m17.25-15.75H4.5A2.25 2.25 0 002.25 6.375v10.5a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 16.875V6.375a2.25 2.25 0 00-2.25-2.25zM9.75 9.75l4.5 2.625-4.5 2.625V9.75z" />
      </svg>
    ),
  },
  {
    path: '/series',
    label: 'Séries',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? '#00d4ff' : 'none'} viewBox="0 0 24 24" stroke={active ? '#00d4ff' : 'currentColor'} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    path: '/search',
    label: 'Chercher',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? '#00d4ff' : 'currentColor'} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    path: '/settings',
    label: 'Réglages',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? '#00d4ff' : 'currentColor'} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide navbar on player page
  if (location.pathname === '/player') return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'var(--safe-bottom)',
      }}
    >
      <div className="flex items-center justify-around px-1 pt-1.5 pb-1">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all min-w-0 flex-1"
              style={{
                color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.45)',
                background: isActive ? 'rgba(0,212,255,0.1)' : 'transparent',
              }}
              aria-label={item.label}
            >
              {item.icon(isActive)}
              <span
                className="text-xs font-medium truncate"
                style={{ fontSize: '0.6rem' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
