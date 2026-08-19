import { ButtonLink } from '../components/ButtonLink';
import { HACKATHON } from '../constants/hackathon';
import { ROUTES } from '../constants/routes';
import { usePageTitle } from '../hooks/usePageTitle';

export function NotFoundPage() {
  usePageTitle(`${HACKATHON.eventName} · 404`);

  return (
    <article className="page-screen page-screen--narrow">
      <p className="eyebrow">404</p>
      <h1 className="display-title">404</h1>
      <p className="serif-kicker">The path has disappeared into the Mugen.</p>
      <div className="rule-line" aria-hidden="true">
        <span className="rule-line__diamond" />
      </div>
      <p className="lede">That address is not part of this application.</p>
      <ButtonLink to={ROUTES.HOME}>Return home</ButtonLink>
    </article>
  );
}
