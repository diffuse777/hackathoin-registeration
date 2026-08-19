import { EventInfo } from '../components/EventInfo';
import { About } from '../components/About';
import { Hero } from '../components/Hero';
import { Highlights } from '../components/Highlights';
import { Prizes } from '../components/Prizes';
import { RegistrationCTA } from '../components/RegistrationCTA';
import { Rules } from '../components/Rules';
import { Support } from '../components/Support';
import { Timeline } from '../components/Timeline';
import { HACKATHON } from '../constants/hackathon';
import { usePageTitle } from '../hooks/usePageTitle';

export function HomePage() {
  usePageTitle(HACKATHON.name);

  return (
    <>
      <Hero />
      <EventInfo />
      <About />
      <Highlights />
      <Timeline />
      <Rules />
      <Prizes />
      <Support />
      <RegistrationCTA />
    </>
  );
}
