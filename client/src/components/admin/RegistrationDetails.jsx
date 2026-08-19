import { formatFeePerParticipant, formatMoney } from '../../constants/hackathon';
import { isHostelMember, studentTypeLabel } from '../../utils/registrationForm';

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

export function RegistrationDetails({ team }) {
  return (
    <div className="register-form">
      <section className="card">
        <h2>Team</h2>
        <dl className="summary-grid">
          <dt>Team name</dt>
          <dd>{team.teamName}</dd>
          <dt>Number of members</dt>
          <dd>{team.memberCount}</dd>
        </dl>
      </section>
      <section className="card">
        <h2>Payment</h2>
        <dl className="summary-grid">
          <dt>Participants</dt>
          <dd>{team.memberCount}</dd>
          <dt>Fee</dt>
          <dd>{formatFeePerParticipant()}</dd>
          <dt>Total amount</dt>
          <dd>{formatMoney(team.totalAmount)}</dd>
          <dt>Payment status</dt>
          <dd>{team.paymentStatus}</dd>
          <dt>Payment date/time</dt>
          <dd>{formatDate(team.payment?.paidAt)}</dd>
          {team.payment?.paymentTransactionId ? (
            <>
              <dt>Payment reference</dt>
              <dd>{team.payment.paymentTransactionId}</dd>
            </>
          ) : null}
        </dl>
      </section>
      {(team.members || []).map((member) => (
        <article key={member.id || member.registerNumber} className="member-card">
          <h2>{member.name}</h2>
          <p>
            {member.registerNumber} · {member.department} · Section {member.section}
          </p>
          <p>
            {member.phone} · {member.email}
          </p>
          <p>{studentTypeLabel(member.studentType)}</p>
          {isHostelMember(member.studentType) ? (
            <p>
              {member.hostelName} · Room {member.roomNumber}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
