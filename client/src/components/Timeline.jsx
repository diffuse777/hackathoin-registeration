import { DATES } from '../constants/hackathon';
import { HOME_SECTIONS } from '../constants/routes';
import { SectionHeading } from './SectionHeading';

export function Timeline() {
  return (
    <section className="section section--band" id={HOME_SECTIONS.TIMELINE} aria-labelledby="timeline-heading">
      <div className="wrap">
        <SectionHeading eyebrow="Schedule" title="Timeline" id="timeline-heading">
          <p className="section__intro">
            Dates below remain placeholders until the organising committee publishes the circular.
          </p>
        </SectionHeading>
        <ol className="timeline">
          {DATES.map((item, index) => (
            <li key={item.id} className="timeline__item">
              <span className="timeline__index">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{item.title}</h3>
                <p className="timeline__date">{item.dateLabel}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
