import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { FormInput } from '../components/FormInput';
import { HACKATHON } from '../constants/hackathon';
import { ROUTES } from '../constants/routes';
import { useAdminAuth } from '../context/AdminAuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { getErrorMessage } from '../utils/apiError';

const ADMIN_USERNAME = 'admin';
const ADMIN_LOGIN_EMAIL = 'admin@example.com';

function resolveAdminEmail(identifier) {
  const value = identifier.trim();
  if (!value) {
    return value;
  }
  if (value.toLowerCase() === ADMIN_USERNAME) {
    return ADMIN_LOGIN_EMAIL;
  }
  return value;
}

export function AdminIndexRedirect() {
  const { isAuthenticated } = useAdminAuth();
  return <Navigate to={isAuthenticated ? ROUTES.ADMIN_DASHBOARD : ROUTES.ADMIN_LOGIN} replace />;
}

export function AdminLoginPage() {
  const { login, isAuthenticated } = useAdminAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  usePageTitle(`${HACKATHON.eventName} · Admin login`);

  const from = location.state?.from || ROUTES.ADMIN_DASHBOARD;

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login({ email: resolveAdminEmail(email), password });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="page-screen page-screen--narrow">
      <p className="eyebrow">Administration</p>
      <h1 className="heading-serif">QUANTEX MUGEN administration</h1>
      <div className="rule-line" aria-hidden="true">
        <span className="rule-line__diamond" />
      </div>
      <form className="register-form" onSubmit={handleSubmit}>
        <FormInput
          id="admin-username"
          label="Username"
          type="text"
          value={email}
          autoComplete="username"
          required
          onChange={setEmail}
        />
        <FormInput
          id="admin-password"
          label="Password"
          type="password"
          value={password}
          autoComplete="current-password"
          required
          onChange={setPassword}
        />
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Login'}
        </button>
      </form>
    </article>
  );
}
