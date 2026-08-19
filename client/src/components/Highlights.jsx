import { HIGHLIGHTS } from '../constants/hackathon';
import { SectionHeading } from './SectionHeading';

export function Highlights() {
  return (
    <section className="section section--band" aria-labelledby="highlights-heading">
      <div className="wrap">
        <SectionHeading eyebrow="At a glance" title="Highlights" id="highlights-heading" />
        <ul className="highlight-list">
          {HIGHLIGHTS.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
