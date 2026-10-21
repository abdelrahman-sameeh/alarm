import { Home, Settings, Volume2 } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'المنبهات', icon: Home },
  { to: '/sounds', label: 'الرنات', icon: Volume2 },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
]

export function AppShell() {
  const location = useLocation()
  const hideNavigation = location.pathname.startsWith('/alarm/')
  return (
    <div className="app-frame" dir="rtl">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <main className={`app-content ${hideNavigation ? 'without-nav' : ''}`}><Outlet /></main>
      {!hideNavigation && (
        <nav className="bottom-nav" aria-label="التنقل الرئيسي">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <Icon size={21} strokeWidth={2.1} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
