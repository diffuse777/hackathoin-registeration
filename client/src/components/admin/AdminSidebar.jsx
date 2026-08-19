import { NavLink, useNavigate } from 'react-router-dom';
import { HACKATHON } from '../../constants/hackathon';
import { ADMIN_NAV, ROUTES } from '../../constants/routes';
import { useAdminAuth } from '../../context/AdminAuthContext';

export function AdminSidebar({ open, onClose }) {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate(ROUTES.ADMIN_LOGIN);
  }

  return (
    <aside className="admin-sidebar" data-open={open ? 'true' : 'false'}>
      <p className="admin-sidebar__brand">{HACKATHON.eventName}</p>
      <p className="admin-sidebar__meta">Administration</p>
      <nav aria-label="Admin">
        <ul>
          {ADMIN_NAV.map((item) => (
            <li key={item.label}>
              <NavLink to={item.to} end={Boolean(item.end)} onClick={onClose}>
                {item.label}
              </NavLink>
            </li>
          ))}
          <li>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
