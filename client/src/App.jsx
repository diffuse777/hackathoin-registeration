import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { RegistrationDraftProvider } from './context/RegistrationDraftContext';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <ErrorBoundary>
      <AdminAuthProvider>
        <RegistrationDraftProvider>
          <AppRoutes />
        </RegistrationDraftProvider>
      </AdminAuthProvider>
    </ErrorBoundary>
  );
}
