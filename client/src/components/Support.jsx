import { SUPPORT_CONTACTS } from '../constants/hackathon';
import { HOME_SECTIONS } from '../constants/routes';
import { SectionHeading } from './SectionHeading';

export function Support() {
  return (
    <section className="section" id={HOME_SECTIONS.FAQ} aria-labelledby="support-heading">
      <div className="wrap">
        <SectionHeading eyebrow="Support" title="Need help" id="support-heading" />
        <div className="support-list">
          {SUPPORT_CONTACTS.map((group) => (
            <article key={group.title} className="support-card">
              <h3>{group.title}</h3>
              <ul>
                {group.people.map((person) => (
                  <li key={person.phone}>
                    {person.name} :{' '}
                    <a href={`tel:${person.phone}`}>{person.phoneLabel}</a>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
