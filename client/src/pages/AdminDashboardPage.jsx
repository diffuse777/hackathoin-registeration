import { Link } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { StatCard } from '../components/admin/StatCard';
import { formatMoney, HACKATHON } from '../constants/hackathon';
import { STUDENT_TYPES } from '../constants/registration';
import { ROUTES } from '../constants/routes';
import { useAdminAuth } from '../context/AdminAuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { getAdminHealth, getRegistrationSummary, listRegistrations } from '../services/adminRegistrationService';
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

async function sumPaidAmount() {
  let page = 1;
  let total = 0;
  let totalPages = 1;

  do {
    const result = await listRegistrations({ page, limit: 100, paymentStatus: 'PAID' });
    total += (result.data.teams || []).reduce((sum, team) => sum + Number(team.totalAmount || 0), 0);
    totalPages = result.data.pagination?.totalPages || 0;
    page += 1;
  } while (page <= totalPages && page <= 25);

  return total;
}

export function AdminDashboardPage() {
  const { admin } = useAdminAuth();
  const [metrics, setMetrics] = useState(null);
  const [recent, setRecent] = useState([]);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  usePageTitle(`${HACKATHON.eventName} · Dashboard`);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [all, hostel, day, paidTotal, latest, healthResult] = await Promise.all([
        getRegistrationSummary({ studentType: 'ALL' }),
        getRegistrationSummary({ studentType: STUDENT_TYPES.HOSTEL }),
        getRegistrationSummary({ studentType: STUDENT_TYPES.DAY_SCHOLAR }),
        sumPaidAmount(),
        listRegistrations({ page: 1, limit: 6 }),
        getAdminHealth().catch(() => null),
      ]);
      setMetrics({
        totalTeams: all.data.totalTeams,
        totalParticipants: all.data.totalParticipants,
        hostelParticipants: hostel.data.totalParticipants,
        dayScholarParticipants: day.data.totalParticipants,
        paidTotal,
      });
      setRecent(latest.data.teams || []);
      setHealth(healthResult?.data || null);
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
    <div className="admin-dashboard">
      <section className="admin-intro">
        <div>
          <p className="eyebrow">Operations</p>
          <p className="lede admin-intro__lede">
            {HACKATHON.name} administration
            {admin?.email ? ` · signed in as ${admin.email}` : ''}.
          </p>
        </div>
        {health ? (
          <Link className={`health-chip health-chip--${health.overall}`} to={ROUTES.ADMIN_HEALTH}>
            Systems: {health.overall}
          </Link>
        ) : null}
      </section>

      {loading ? <LoadingState label="Loading dashboard…" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {metrics ? (
        <div className="stat-grid">
          <StatCard label="Total teams" value={metrics.totalTeams} />
          <StatCard label="Total participants" value={metrics.totalParticipants} />
          <StatCard label="Hostel participants" value={metrics.hostelParticipants} />
          <StatCard label="Day scholars" value={metrics.dayScholarParticipants} />
          <StatCard label="Collected payments" value={formatMoney(metrics.paidTotal)} />
          <StatCard
            label="Payment attention"
            value={
              health
                ? health.payment.counts.FAILED.count + health.payment.counts.PENDING.count
                : '—'
            }
          />
        </div>
      ) : null}

      <div className="admin-panels">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Recent registrations</h2>
            <Link to={ROUTES.ADMIN_REGISTRATIONS}>View all</Link>
          </div>
          {recent.length === 0 && !loading ? (
            <p className="lede">No registrations yet.</p>
          ) : (
            <ul className="admin-recent">
              {recent.map((team) => (
                <li key={team.id}>
                  <div>
                    <strong>{team.teamName}</strong>
                    <span>
                      {team.memberCount} members · {formatMoney(team.totalAmount)}
                    </span>
                  </div>
                  <span className={`badge badge--${String(team.paymentStatus || '').toLowerCase()}`}>
                    {team.paymentStatus}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Quick actions</h2>
          </div>
          <div className="admin-actions">
            <Link className="btn" to={ROUTES.ADMIN_REGISTRATIONS}>
              Open registrations
            </Link>
            <Link className="btn btn--secondary" to={ROUTES.ADMIN_HEALTH}>
              Website health
            </Link>
            <Link className="btn btn--secondary" to={ROUTES.ADMIN_EXPORTS}>
              Export records
            </Link>
          </div>
          {health ? (
            <p className="status-line">Last systems check {formatWhen(health.checkedAt)}.</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
