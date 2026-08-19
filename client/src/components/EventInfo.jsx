import { EVENT_STRIP } from '../constants/hackathon';

const ICONS = {
  Date: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 10h17M8 3.2v4.2M16 3.2v4.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Venue: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s7-6.1 7-11.1A7 7 0 0 0 5 9.9C5 14.9 12 21 12 21z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="10" r="2.15" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Duration: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="13" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 9.2v4.1l2.8 1.7M9.5 3.2h5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  'Team size': (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8.2" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.2" cy="9" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.2 19.2c.6-3.1 2.6-4.9 4.9-4.9s4.3 1.8 4.9 4.9M14.2 14.4c1.8.2 3.4 1.6 4 4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  Prizes: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 4.2h8v3.8a4 4 0 0 1-8 0V4.2zM8 6.2H5.2v2A3 3 0 0 0 8 11.2M16 6.2h2.8v2A3 3 0 0 1 16 11.2M10 20.2h4M12 12.2v8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  Certificates: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5.2" y="3.2" width="13.6" height="17.6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.2 8.2h7.6M8.2 12h7.6M8.2 15.8h5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
};

export function EventInfo() {
  return (
    <section className="event-strip" aria-label="Event information">
      <div className="wrap">
        <ul className="event-strip__list">
          {EVENT_STRIP.map((item) => (
            <li key={item.label} className="event-strip__item">
              <span className="event-strip__icon">{ICONS[item.label]}</span>
              <span className="event-strip__label">{item.label}</span>
              <span className="event-strip__value">{item.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
