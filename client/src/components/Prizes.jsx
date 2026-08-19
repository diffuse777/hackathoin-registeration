import { PRIZES } from '../constants/hackathon';
import { SectionHeading } from './SectionHeading';

export function Prizes() {
  return (
    <section className="section section--band" aria-labelledby="prizes-heading">
      <div className="wrap">
        <SectionHeading eyebrow="Recognition" title="Prizes" id="prizes-heading" />
        <ul className="prize-list">
          {PRIZES.map((item) => (
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
