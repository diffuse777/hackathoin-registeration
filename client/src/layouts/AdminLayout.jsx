import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { PageAtmosphere } from '../components/PageAtmosphere';
import { RequireAdmin } from '../components/RequireAdmin';
import { ROUTES } from '../constants/routes';
import { useScrollToHash } from '../hooks/useScrollToHash';

function titleFromPath(pathname) {
  if (pathname === ROUTES.ADMIN_HEALTH) {
    return 'Website Health';
  }
  if (pathname === ROUTES.ADMIN_DASHBOARD) {
    return 'Dashboard';
  }
  if (pathname === ROUTES.ADMIN_REGISTRATIONS) {
    return 'Registrations';
  }
  if (pathname.startsWith(`${ROUTES.ADMIN_REGISTRATIONS}/`)) {
    return 'Team details';
  }
  return 'Administration';
}

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  useScrollToHash();

  return (
    <RequireAdmin>
      <div className="app-shell app-shell--admin">
        <PageAtmosphere variant="admin" />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {menuOpen ? (
          <button
            type="button"
            className="admin-backdrop"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}
        <div className="admin-shell">
          <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
          <div className="admin-frame">
            <AdminHeader title={titleFromPath(pathname)} onMenu={() => setMenuOpen((value) => !value)} />
            <main id="main-content" className="admin-main">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </RequireAdmin>
  );
}
