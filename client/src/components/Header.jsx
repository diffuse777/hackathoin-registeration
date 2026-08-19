import { Link } from 'react-router-dom';
import logoCybernerds from '../assets/logo-cybernerds.png';
import logoKare from '../assets/logo-kare.png';
import logoOwasp from '../assets/logo-owasp.png';
import { HACKATHON } from '../constants/hackathon';
import { ROUTES } from '../constants/routes';
import { ButtonLink } from './ButtonLink';

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__bar">
        <Link to={ROUTES.HOME} className="site-header__brand" aria-label={`${HACKATHON.name} home`}>
          <img
            src={logoCybernerds}
            alt="Cybernerds KARE Student Chapter"
            className="site-header__logo site-header__logo--cybernerds"
          />
          <img
            src={logoOwasp}
            alt="OWASP KARE Student Chapter"
            className="site-header__logo site-header__logo--owasp"
          />
        </Link>

        <div className="site-header__actions">
          <img
            src={logoKare}
            alt="Kalasalingam Academy of Research and Education"
            className="site-header__logo site-header__logo--kare"
          />
          <ButtonLink to={ROUTES.REGISTER}>Register Now</ButtonLink>
        </div>
      </div>
    </header>
  );
}
