import { formatFeePerParticipant, formatMoney } from '../../constants/hackathon';

export function PaymentSummary({ teamName, memberCount, amount }) {
  return (
    <section className="card" aria-labelledby="payment-summary-heading">
      <h2 id="payment-summary-heading">Payment summary</h2>
      <dl className="summary-grid">
        <dt>Team name</dt>
        <dd>{teamName}</dd>
        <dt>Participants</dt>
        <dd>{memberCount}</dd>
        <dt>Registration fee</dt>
        <dd>{formatFeePerParticipant()}</dd>
        <dt>Total amount</dt>
        <dd>{formatMoney(amount)}</dd>
      </dl>
    </section>
  );
}
