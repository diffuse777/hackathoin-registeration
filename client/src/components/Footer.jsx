import { Link } from 'react-router-dom';
import { HACKATHON, SUPPORT_CONTACTS } from '../constants/hackathon';
import { HOME_SECTIONS, ROUTES, SITE_NAV } from '../constants/routes';

export function Footer() {
  return (
    <footer className="site-footer" id={HOME_SECTIONS.CONTACT}>
      <div className="wrap">
        <p className="eyebrow footer-kicker">Contact</p>
      </div>
      <div className="wrap site-footer__grid">
        <div>
          <p className="site-logo--footer">
            <span className="site-header__brand-name">{HACKATHON.eventName}</span>
            <span className="site-header__brand-meta">{HACKATHON.seriesName}</span>
            <span className="site-header__brand-name">{HACKATHON.editionName}</span>
          </p>
          <p>{HACKATHON.hostedBy}</p>
          {HACKATHON.partners.map((partner) => (
            <p key={partner}>{partner}</p>
          ))}
        </div>

        <nav aria-label="Footer">
          <h2 className="footer-heading">Navigate</h2>
          <ul className="footer-links">
            {SITE_NAV.map((item) => (
              <li key={item.label}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
            <li>
              <Link to={ROUTES.REGISTER}>Register</Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="footer-heading">Contact</h2>
          <address className="footer-address">
            {SUPPORT_CONTACTS.map((group) => (
              <p key={group.title}>
                {group.title}
                {group.people.map((person) => (
                  <span key={person.phone}>
                    <br />
                    {person.name} : <a href={`tel:${person.phone}`}>{person.phoneLabel}</a>
                  </span>
                ))}
              </p>
            ))}
          </address>
        </div>

        <div>
          <h2 className="footer-heading">Chapters</h2>
          <p>{HACKATHON.organizer}</p>
          <p>{HACKATHON.partners[0]}</p>
        </div>
      </div>
      <div className="wrap site-footer__legal">
        <p className="site-footer__credits">{HACKATHON.credits}</p>
      </div>
    </footer>
  );
}
