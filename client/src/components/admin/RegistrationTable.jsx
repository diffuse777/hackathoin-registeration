import { Link } from 'react-router-dom';
import { formatMoney } from '../../constants/hackathon';
import { ROUTES } from '../../constants/routes';

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

export function RegistrationTable({ teams, deletingId, onDelete }) {
  return (
    <>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Team name</th>
              <th>Members</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id}>
                <td>{team.teamName}</td>
                <td>{team.memberCount}</td>
                <td>
                  <span className={`badge badge--${String(team.paymentStatus || '').toLowerCase()}`}>
                    {team.paymentStatus}
                  </span>
                </td>
                <td>{formatMoney(team.totalAmount)}</td>
                <td>{formatDate(team.createdAt)}</td>
                <td>
                  <div className="table-actions">
                    <Link to={ROUTES.ADMIN_REGISTRATION(team.id)}>Open</Link>
                    <button
                      type="button"
                      className="btn btn--secondary btn--compact"
                      disabled={deletingId === team.id}
                      onClick={() => onDelete(team)}
                    >
                      {deletingId === team.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-cards">
        {teams.map((team) => (
          <article key={team.id} className="card">
            <h2>{team.teamName}</h2>
            <p>
              {team.memberCount} members · {formatMoney(team.totalAmount)}
            </p>
            <p>
              <span className={`badge badge--${String(team.paymentStatus || '').toLowerCase()}`}>
                {team.paymentStatus}
              </span>
            </p>
            <p>{formatDate(team.createdAt)}</p>
            <div className="table-actions">
              <Link to={ROUTES.ADMIN_REGISTRATION(team.id)}>Open team</Link>
              <button
                type="button"
                className="btn btn--secondary btn--compact"
                disabled={deletingId === team.id}
                onClick={() => onDelete(team)}
              >
                {deletingId === team.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
