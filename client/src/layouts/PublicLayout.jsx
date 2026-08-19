import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { PageAtmosphere } from '../components/PageAtmosphere';
import { ROUTES } from '../constants/routes';
import { useScrollToHash } from '../hooks/useScrollToHash';

function atmosphereVariant(pathname) {
  if (pathname === ROUTES.HOME) {
    return null;
  }
  if (pathname.startsWith(ROUTES.REGISTER_SUCCESS) || pathname.startsWith(ROUTES.REGISTRATION_SUCCESS)) {
    return 'success';
  }
  if (pathname.startsWith(ROUTES.REGISTER_PAYMENT) || pathname === ROUTES.PAYMENT) {
    return 'payment';
  }
  if (pathname.startsWith(ROUTES.REGISTER)) {
    return 'register';
  }
  if (pathname.startsWith(ROUTES.ADMIN)) {
    return 'admin';
  }
  return 'page';
}

export function PublicLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === ROUTES.HOME;
  const atmosphere = atmosphereVariant(pathname);
  useScrollToHash();

  return (
    <div className={isHome ? 'app-shell' : 'app-shell app-shell--cinematic'}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {atmosphere ? <PageAtmosphere variant={atmosphere} /> : null}
      <Header />
      <main id="main-content" className={isHome ? 'app-main app-main--home' : 'app-main app-main--page'}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
