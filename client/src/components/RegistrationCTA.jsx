import { HACKATHON } from '../constants/hackathon';
import { ROUTES } from '../constants/routes';
import { ButtonLink } from './ButtonLink';

export function RegistrationCTA() {
  return (
    <section className="cta" aria-labelledby="cta-heading">
      <div className="wrap">
        <p className="eyebrow">Enter the Mugen</p>
        <h2 id="cta-heading">Register your team</h2>
        <p className="lede">
          {HACKATHON.team.minMembers}–{HACKATHON.team.maxMembers} participants. Fee calculated on the
          server after you submit the roster.
        </p>
        <ButtonLink to={ROUTES.REGISTER}>Register Now</ButtonLink>
      </div>
    </section>
  );
}
