import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { AdminHealthPage } from '../pages/AdminHealthPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminIndexRedirect, AdminLoginPage } from '../pages/AdminLoginPage';
import { AdminRegistrationDetailPage } from '../pages/AdminRegistrationDetailPage';
import { AdminRegistrationsPage } from '../pages/AdminRegistrationsPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ParticipantsPage } from '../pages/ParticipantsPage';
import { PaymentPage } from '../pages/PaymentPage';
import { ProblemStatementsPage } from '../pages/ProblemStatementsPage';
import { RegisterPage } from '../pages/RegisterPage';
import { SuccessPage } from '../pages/SuccessPage';
import { ROUTES } from '../constants/routes';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.REGISTER_PARTICIPANTS} element={<ParticipantsPage />} />
        <Route path={ROUTES.REGISTER_PAYMENT} element={<PaymentPage />} />
        <Route path={ROUTES.REGISTER_SUCCESS} element={<SuccessPage />} />
        <Route path={ROUTES.PAYMENT} element={<Navigate to={ROUTES.REGISTER_PAYMENT} replace />} />
        <Route
          path={ROUTES.REGISTRATION_SUCCESS}
          element={<Navigate to={ROUTES.REGISTER_SUCCESS} replace />}
        />
        <Route path={ROUTES.PROBLEM_STATEMENTS} element={<ProblemStatementsPage />} />
        <Route path={ROUTES.ADMIN} element={<AdminIndexRedirect />} />
        <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
      </Route>
      <Route element={<AdminLayout />}>
        <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
        <Route path={ROUTES.ADMIN_HEALTH} element={<AdminHealthPage />} />
        <Route path={ROUTES.ADMIN_REGISTRATIONS} element={<AdminRegistrationsPage />} />
        <Route path="/admin/registrations/:id" element={<AdminRegistrationDetailPage />} />
      </Route>
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
