import { HACKATHON } from '../constants/hackathon';
import { ROUTES } from '../constants/routes';
import { ButtonLink } from './ButtonLink';
import { HeroScene } from './HeroScene';

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <HeroScene />
      <div className="wrap hero__inner">
        <h1 id="hero-heading" className="hero__title">
          <span className="display-title">{HACKATHON.eventName}</span>
          <span className="serif-kicker hero__series">
            <span className="rule-line__diamond" />
            {HACKATHON.seriesName}
            <span className="rule-line__diamond" />
          </span>
          <span className="display-title">{HACKATHON.editionName}</span>
        </h1>
        <div className="rule-line" aria-hidden="true">
          <span className="rule-line__diamond" />
        </div>
        <p className="serif-kicker hero__tagline">{HACKATHON.tagline}</p>
        <p className="hero__ready">{HACKATHON.readyLabel}</p>
        <p className="hero__soon">{HACKATHON.statusLabel}</p>
        <div className="hero__actions">
          <ButtonLink to={ROUTES.REGISTER}>Register Now</ButtonLink>
        </div>
      </div>
    </section>
  );
}
