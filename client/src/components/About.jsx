import { ABOUT } from '../constants/hackathon';
import { HOME_SECTIONS } from '../constants/routes';
import { SectionHeading } from './SectionHeading';

export function About() {
  return (
    <section className="section" id={HOME_SECTIONS.ABOUT} aria-labelledby="about-heading">
      <div className="wrap section__grid">
        <SectionHeading eyebrow="About" title="The sprint" id="about-heading" />
        <div className="prose">
          <h3>What it is</h3>
          <p>{ABOUT.what}</p>
          <h3>Who it is for</h3>
          <p>{ABOUT.who}</p>
          <h3>What teams build</h3>
          <p>{ABOUT.build}</p>
          <h3>Why it matters</h3>
          <p>{ABOUT.why}</p>
        </div>
      </div>
    </section>
  );
}
