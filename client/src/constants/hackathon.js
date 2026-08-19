export const HACKATHON = Object.freeze({
  name: 'QUANTEX SERIES MUGEN',
  eventName: 'QUANTEX',
  seriesName: 'SERIES',
  editionName: 'MUGEN',
  shortName: 'QUANTEX',
  tagline: 'WHERE LIMITS CEASE, POSSIBILITIES BEGIN',
  readyLabel: 'GET READY',
  statusLabel: 'COMING SOON',
  description:
    'QUANTEX SERIES MUGEN is a 24-hour campus hackathon at Kalasalingam Academy of Research and Education. Teams of up to four register once, pay the official per-participant fee, and build against published problem statements.',
  organizer: 'Cybernerds KARE Student Chapter',
  hostedBy: 'Kalasalingam Academy of Research and Education',
  partners: ['OWASP KARE Student Chapter', 'Cybernerds KARE Student Chapter'],
  durationLabel: '24 HOURS',
  dateLabel: '12–13 SEPTEMBER 2026',
  venueLabel: 'VASUDEVAN SEMINAR HALL',
  teamSizeLabel: '4 MEMBERS',
  prizesLabel: 'EXCITING PRIZES',
  certificatesLabel: 'TO ALL PARTICIPANTS',
  credits: 'DESIGNED AND DEVELOPED BY CYBERNERDS X OWASP KARE',
  copyrightYear: 2026,
  fee: Object.freeze({
    amount: 350,
    currency: 'INR',
    currencySymbol: '₹',
    unit: 'per participant',
  }),
  team: Object.freeze({
    minMembers: 1,
    maxMembers: 4,
  }),
  contact: Object.freeze({
    emailLabel: 'Official email to be published',
    phoneLabel: 'Official phone to be published',
    locationLabel: 'Kalasalingam Academy of Research and Education, Krishnankoil',
  }),
  social: Object.freeze([
    { label: 'Instagram', note: 'Handle to be published' },
    { label: 'LinkedIn', note: 'Page to be published' },
    { label: 'X', note: 'Handle to be published' },
  ]),
});

export const EVENT_STRIP = Object.freeze([
  { label: 'Date', value: HACKATHON.dateLabel },
  { label: 'Venue', value: HACKATHON.venueLabel },
  { label: 'Duration', value: HACKATHON.durationLabel },
  { label: 'Team size', value: HACKATHON.teamSizeLabel },
  { label: 'Prizes', value: HACKATHON.prizesLabel },
  { label: 'Certificates', value: HACKATHON.certificatesLabel },
]);

export const DATES = Object.freeze([
  { id: 'registration-opens', title: 'Registration Opens', dateLabel: 'To be announced' },
  { id: 'registration-closes', title: 'Registration Closes', dateLabel: 'To be announced' },
  { id: 'hackathon-starts', title: 'Hackathon Starts', dateLabel: HACKATHON.dateLabel.split('–')[0].trim() + ' 2026' },
  { id: 'hackathon-ends', title: 'Hackathon Ends', dateLabel: '13 SEPTEMBER 2026' },
  { id: 'results', title: 'Results', dateLabel: 'To be announced' },
]);

export const ABOUT = Object.freeze({
  what: 'MUGEN is a timed team sprint. Registered teams work through a single night and day, present what they built, and are assessed against the published brief.',
  who: 'Participation is for eligible students as defined by the organising committee. The official circular is the source of truth; this page does not replace that notice.',
  build: 'Teams build a working prototype or a clearly demonstrated solution against one released problem statement. Scope, submission format and judging criteria will be published before the event starts.',
  why: 'The sprint is a chance to ship under constraint, work across departments, and take critique from mentors — with recognition for teams that finish strong.',
});

export const HIGHLIGHTS = Object.freeze([
  {
    title: 'Team-based',
    body: `Register as a team of ${HACKATHON.team.minMembers}–${HACKATHON.team.maxMembers} participants. The roster you submit is the roster that competes.`,
  },
  {
    title: '24-hour sprint',
    body: 'A single continuous build window on campus. Pace, rest and hand-off are part of the craft.',
  },
  {
    title: 'Real briefs',
    body: 'Work from problem statements written for campus and civic constraints, not toy demos.',
  },
  {
    title: 'Mentorship',
    body: 'Mentor hours will be published with the event schedule. Details remain with the organisers until then.',
  },
  {
    title: 'Recognition',
    body: 'Prizes and certificates will be announced with the official circular. Unpublished prize lists are not final.',
  },
]);

export const PROBLEM_PREVIEWS = Object.freeze([
  {
    title: 'Campus operations',
    body: 'Illustrative category. Final statements will be released by the organising committee.',
  },
  {
    title: 'Access and inclusion',
    body: 'Illustrative category. Final statements will be released by the organising committee.',
  },
  {
    title: 'Safety and trust',
    body: 'Illustrative category. Final statements will be released by the organising committee.',
  },
]);

export const RULES = Object.freeze([
  {
    title: 'Team requirements',
    body: `A team may include ${HACKATHON.team.minMembers} to ${HACKATHON.team.maxMembers} participants. Every participant on the roster must be registered; substitutions after payment, if allowed, will be stated in the official rules.`,
  },
  {
    title: 'Submission requirements',
    body: 'Submission format, deadline and demo rules will be published before the hackathon starts. Unpublished formats on this page are not binding.',
  },
  {
    title: 'Code of conduct',
    body: 'A code of conduct will be issued with the official rules. Harassment, cheating and misrepresentation of authorship are expected to be disqualifying — confirm the final wording in the circular.',
  },
  {
    title: 'Payment and registration',
    body: `Registration is complete only after the official fee is paid through the event payment flow. The fee is ${HACKATHON.fee.currencySymbol}${HACKATHON.fee.amount} ${HACKATHON.fee.unit}. The amount due is calculated on the server as number of participants × ${HACKATHON.fee.currencySymbol}${HACKATHON.fee.amount}. Do not treat a browser estimate as the payable amount.`,
  },
]);

export const PRIZES = Object.freeze([
  {
    title: 'Exciting prizes',
    body: 'Prize categories and amounts will be published with the official circular. Treat unpublished lists as unofficial.',
  },
  {
    title: 'Certificates',
    body: 'Certificates will be issued to all participants whose registration is paid and verified.',
  },
]);

export const SUPPORT_CONTACTS = Object.freeze([
  {
    title: 'For event related issue',
    people: [{ name: 'N Dinesh', phone: '8367641224', phoneLabel: '8367641224' }],
  },
  {
    title: 'For website related issue',
    people: [
      { name: 'Karthikeyen', phone: '6363872706', phoneLabel: '6363872706' },
      { name: 'Venkata Ramana', phone: '9121898309', phoneLabel: '91218 98309' },
    ],
  },
]);

export function formatFeePerParticipant() {
  return `${HACKATHON.fee.currencySymbol}${HACKATHON.fee.amount} ${HACKATHON.fee.unit}`;
}

export function estimateRegistrationTotal(participantCount) {
  return participantCount * HACKATHON.fee.amount;
}

export function formatMoney(amount) {
  return `${HACKATHON.fee.currencySymbol}${amount}`;
}
