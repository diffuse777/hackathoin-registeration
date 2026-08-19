import { Navigate } from 'react-router-dom';
import { ButtonLink } from '../components/ButtonLink';
import { formatMoney, HACKATHON } from '../constants/hackathon';
import { ROUTES } from '../constants/routes';
import { usePageTitle } from '../hooks/usePageTitle';
import { loadSuccessSnapshot } from '../utils/registrationDraft';

export function SuccessPage() {
  const snapshot = loadSuccessSnapshot();
  usePageTitle(`${HACKATHON.eventName} · Registration successful`);

  if (!snapshot || snapshot.paymentStatus !== 'PAID') {
    return <Navigate to={ROUTES.REGISTER} replace />;
  }

  return (
    <article className="page-screen page-screen--narrow">
      <p className="eyebrow">Confirmed</p>
      <h1 className="heading-serif">Registration successful</h1>
      <div className="rule-line" aria-hidden="true">
        <span className="rule-line__diamond" />
      </div>
      <p className="lede">Payment is successful. Be ready to face the challenge.</p>
      <section className="card">
        <dl className="summary-grid">
          <dt>Team name</dt>
          <dd>{snapshot.teamName}</dd>
          <dt>Number of participants</dt>
          <dd>{snapshot.memberCount}</dd>
          <dt>Total paid</dt>
          <dd>{formatMoney(snapshot.totalAmount)}</dd>
          <dt>Payment status</dt>
          <dd>{snapshot.paymentStatus}</dd>
          {snapshot.paymentReference ? (
            <>
              <dt>Payment reference</dt>
              <dd>{snapshot.paymentReference}</dd>
            </>
          ) : null}
        </dl>
      </section>
      <p>
        <ButtonLink to={ROUTES.HOME}>Return home</ButtonLink>
      </p>
    </article>
  );
}
