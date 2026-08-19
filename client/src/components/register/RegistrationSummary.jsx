import { formatFeePerParticipant, formatMoney, estimateRegistrationTotal } from '../../constants/hackathon';
import { isHostelMember, studentTypeLabel } from '../../utils/registrationForm';

export function RegistrationSummary({ teamName, members }) {
  return (
    <section className="card" aria-labelledby="summary-heading">
      <h2 id="summary-heading">Registration summary</h2>
      <dl className="summary-grid">
        <dt>Team name</dt>
        <dd>{teamName}</dd>
        <dt>Number of participants</dt>
        <dd>{members.length}</dd>
        <dt>Estimated total</dt>
        <dd>
          {formatMoney(estimateRegistrationTotal(members.length))}{' '}
          <span className="fee-preview__note">({formatFeePerParticipant()})</span>
        </dd>
      </dl>
      <ol className="summary-list">
        {members.map((member, index) => (
          <li key={member.id || index} className="card">
            <h3>
              {index + 1}. {member.name}
            </h3>
            <p>
              {member.registerNumber} · {member.department} · Section {member.section}
            </p>
            <p>
              {member.phone} · {member.email}
            </p>
            <p>
              {studentTypeLabel(member.studentType)}
              {isHostelMember(member.studentType)
                ? ` · ${member.hostelName} · Room ${member.roomNumber}`
                : ''}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
