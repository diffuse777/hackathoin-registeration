import { Link } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { formatMoney, HACKATHON } from '../constants/hackathon';
import { ROUTES } from '../constants/routes';
import { usePageTitle } from '../hooks/usePageTitle';
import { getAdminHealth } from '../services/adminRegistrationService';
import { getErrorMessage } from '../utils/apiError';
import { useEffect, useState } from 'react';

function formatWhen(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function StatusMark({ status }) {
  return <span className={`status-mark status-mark--${status}`}>{status}</span>;
}

export function AdminHealthPage() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  usePageTitle(`${HACKATHON.eventName} · Website Health`);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminHealth();
      setHealth(result.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="health-page">
      <p className="lede">
        Live checks for API routes, MongoDB, payment configuration, and incomplete payments.
      </p>
      <p>
        <button className="btn btn--secondary" type="button" onClick={load} disabled={loading}>
          {loading ? 'Checking…' : 'Refresh status'}
        </button>
      </p>

      {loading && !health ? <LoadingState label="Checking website health…" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {health ? (
        <>
          <section className={`health-banner health-banner--${health.overall}`}>
            <p className="eyebrow">Overall</p>
            <h2>{health.overall}</h2>
            <p>Checked {formatWhen(health.checkedAt)}</p>
          </section>

          <section className="admin-panel">
            <div className="admin-panel__head">
              <h2>Database</h2>
              <StatusMark status={health.database.status} />
            </div>
            <dl className="summary-grid">
              <dt>State</dt>
              <dd>{health.database.readyState}</dd>
              <dt>Latency</dt>
              <dd>{health.database.latencyMs != null ? `${health.database.latencyMs} ms` : '—'}</dd>
              <dt>Detail</dt>
              <dd>{health.database.message || '—'}</dd>
            </dl>
          </section>

          <section className="admin-panel">
            <div className="admin-panel__head">
              <h2>API status</h2>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Method</th>
                    <th>Path</th>
                    <th>Status</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {health.apis.map((item) => (
                    <tr key={`${item.method}-${item.path}`}>
                      <td>{item.name}</td>
                      <td>{item.method}</td>
                      <td>
                        <code>{item.path}</code>
                      </td>
                      <td>
                        <StatusMark status={item.status} />
                      </td>
                      <td>{item.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel__head">
              <h2>Payment</h2>
              <span className="eyebrow">{health.payment.provider}</span>
            </div>
            <dl className="summary-grid health-payment-counts">
              <dt>Paid</dt>
              <dd>
                {health.payment.counts.PAID.count} · {formatMoney(health.payment.counts.PAID.amount)}
              </dd>
              <dt>Pending</dt>
              <dd>
                {health.payment.counts.PENDING.count} · {formatMoney(health.payment.counts.PENDING.amount)}
              </dd>
              <dt>Failed</dt>
              <dd>
                {health.payment.counts.FAILED.count} · {formatMoney(health.payment.counts.FAILED.amount)}
              </dd>
            </dl>

            <h3>Issues</h3>
            {health.payment.issues.length === 0 ? (
              <p className="lede">No payment issues reported.</p>
            ) : (
              <ul className="health-issues">
                {health.payment.issues.map((issue) => (
                  <li key={issue.code} className={`health-issue health-issue--${issue.severity}`}>
                    <strong>{issue.code}</strong>
                    <span>{issue.message}</span>
                  </li>
                ))}
              </ul>
            )}

            <h3>Failed payments</h3>
            {health.payment.failed.length === 0 ? (
              <p className="lede">No failed payments.</p>
            ) : (
              <ul className="admin-recent">
                {health.payment.failed.map((row) => (
                  <li key={row.id}>
                    <div>
                      <strong>{row.teamName}</strong>
                      <span>
                        {formatMoney(row.totalAmount)} · {formatWhen(row.updatedAt)}
                      </span>
                    </div>
                    <Link to={ROUTES.ADMIN_REGISTRATION(row.id)}>Open</Link>
                  </li>
                ))}
              </ul>
            )}

            <h3>Pending payments</h3>
            {health.payment.pending.length === 0 ? (
              <p className="lede">No pending payments.</p>
            ) : (
              <ul className="admin-recent">
                {health.payment.pending.map((row) => (
                  <li key={row.id}>
                    <div>
                      <strong>{row.teamName}</strong>
                      <span>
                        {formatMoney(row.totalAmount)} · {formatWhen(row.updatedAt)}
                      </span>
                    </div>
                    <Link to={ROUTES.ADMIN_REGISTRATION(row.id)}>Open</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
