import { ButtonLink } from '../components/ButtonLink';
import { HACKATHON } from '../constants/hackathon';
import { HOME_SECTIONS, ROUTES } from '../constants/routes';
import { usePageTitle } from '../hooks/usePageTitle';

export function ProblemStatementsPage() {
  usePageTitle(`${HACKATHON.eventName} · Problem statements`);

  return (
    <article className="page-screen">
      <p className="eyebrow">Briefs</p>
      <h1 className="heading-serif">Problem statements</h1>
      <div className="rule-line" aria-hidden="true">
        <span className="rule-line__diamond" />
      </div>
      <p className="lede">
        Final statements will be released by the organising committee. Until then, use the category
        preview on the home page as orientation only.
      </p>
      <ButtonLink to={`${ROUTES.HOME}#${HOME_SECTIONS.PROBLEM_STATEMENTS}`} variant="secondary">
        Back to preview
      </ButtonLink>
    </article>
  );
}
