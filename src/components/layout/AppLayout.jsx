import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, ClipboardList, LayoutDashboard, LogOut, Map, Plus, UserRound } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationsContext.jsx';
import ConnectionBanner from './ConnectionBanner.jsx';
import Logo from './Logo.jsx';

function NavItem({ to, icon: Icon, children, end }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, isOfficial, logout } = useAuth();
  const { unread } = useNotifications();
  const { pathname } = useLocation();
  const fullBleed = pathname === '/mapa';

  return (
    <div className={`app${fullBleed ? ' app--full' : ''}`}>
      <a href="#main" className="skip-link">Saltar al contenido</a>
      <header className="topbar">
        <Link to="/mapa" className="topbar__brand" aria-label="Vías Seguras, mapa">
          <Logo />
          <span>Vías <strong>Seguras</strong></span>
        </Link>

        <nav className="topbar__nav" aria-label="Principal">
          <NavItem to="/mapa" icon={Map}>Mapa</NavItem>
          <NavItem to="/mis-reportes" icon={ClipboardList}>Mis reportes</NavItem>
          {isOfficial && <NavItem to="/panel" icon={LayoutDashboard}>Panel alcaldía</NavItem>}
        </nav>

        <div className="topbar__actions">
          <Link to="/reportar" className="button button--accent topbar__cta">
            <Plus size={18} aria-hidden="true" /> <span>Reportar daño</span>
          </Link>
          <ThemeToggle />
          <Link to="/notificaciones" className="icon-button topbar__bell" aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ''}`}>
            <Bell size={20} />
            {unread > 0 && <span className="counter">{unread > 9 ? '9+' : unread}</span>}
          </Link>
          <Link to="/perfil" className="user-chip" title={`Mi perfil (${user.email})`} aria-label="Mi perfil">
            <Avatar user={user} className="user-chip__avatar" />
            <span className="user-chip__text">
              <strong>{user.name.split(' ')[0]}</strong>
              <small>{user.roleLabel}</small>
            </span>
          </Link>
          <button type="button" className="icon-button" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
            <LogOut size={19} />
          </button>
        </div>
      </header>

      <ConnectionBanner />

      <main id="main" className="app__main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Navegación móvil">
        <NavItem to="/mapa" icon={Map}>Mapa</NavItem>
        {isOfficial
          ? <NavItem to="/panel" icon={LayoutDashboard}>Panel</NavItem>
          : <NavItem to="/mis-reportes" icon={ClipboardList}>Mis reportes</NavItem>}
        <NavLink to="/reportar" className="bottom-nav__cta" aria-label="Reportar daño"><Plus size={26} /></NavLink>
        <NavItem to="/notificaciones" icon={Bell}>
          Avisos{unread > 0 && <span className="counter counter--inline">{unread}</span>}
        </NavItem>
        <NavItem to="/perfil" icon={UserRound}>Perfil</NavItem>
      </nav>
    </div>
  );
}
