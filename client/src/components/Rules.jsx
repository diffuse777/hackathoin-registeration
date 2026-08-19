import { useState } from 'react';
import { RULES } from '../constants/hackathon';
import { HOME_SECTIONS } from '../constants/routes';
import { SectionHeading } from './SectionHeading';

export function Rules() {
  const [openId, setOpenId] = useState(RULES[0]?.title || null);

  return (
    <section className="section" id={HOME_SECTIONS.RULES} aria-labelledby="rules-heading">
      <div className="wrap">
        <SectionHeading eyebrow="Guidelines" title="Rules" id="rules-heading" />
        <dl className="rule-list">
          {RULES.map((item) => {
            const expanded = openId === item.title;
            return (
              <div key={item.title} className="rule-list__row">
                <dt>
                  <button
                    type="button"
                    className="faq-item__button"
                    aria-expanded={expanded}
                    onClick={() => setOpenId(expanded ? null : item.title)}
                  >
                    {item.title}
                    <span className="faq-item__icon" aria-hidden="true">
                      {expanded ? '–' : '+'}
                    </span>
                  </button>
                </dt>
                {expanded ? <dd>{item.body}</dd> : null}
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
