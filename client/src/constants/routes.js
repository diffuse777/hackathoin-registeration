export const ROUTES = Object.freeze({
  HOME: '/',
  REGISTER: '/register',
  REGISTER_PARTICIPANTS: '/register/participants',
  REGISTER_PAYMENT: '/register/payment',
  REGISTER_SUCCESS: '/register/success',
  PAYMENT: '/payment',
  REGISTRATION_SUCCESS: '/registration-success',
  PROBLEM_STATEMENTS: '/problem-statements',
  ADMIN: '/admin',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_REGISTRATIONS: '/admin/registrations',
  ADMIN_REGISTRATION: (id) => `/admin/registrations/${id}`,
  ADMIN_EXPORTS: '/admin/registrations#exports',
  ADMIN_HEALTH: '/admin/health',
});

export const HOME_SECTIONS = Object.freeze({
  ABOUT: 'about',
  TIMELINE: 'timeline',
  PROBLEM_STATEMENTS: 'problem-statements',
  RULES: 'rules',
  FAQ: 'faq',
  CONTACT: 'contact',
});

export const SITE_NAV = Object.freeze([
  { label: 'Home', to: ROUTES.HOME, end: true },
  { label: 'About', to: `${ROUTES.HOME}#${HOME_SECTIONS.ABOUT}` },
  { label: 'Timeline', to: `${ROUTES.HOME}#${HOME_SECTIONS.TIMELINE}` },
  { label: 'Rules', to: `${ROUTES.HOME}#${HOME_SECTIONS.RULES}` },
  { label: 'Contact', to: `${ROUTES.HOME}#${HOME_SECTIONS.CONTACT}` },
]);

export const ADMIN_NAV = Object.freeze([
  { to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', end: true },
  { to: ROUTES.ADMIN_REGISTRATIONS, label: 'Registrations' },
  { to: ROUTES.ADMIN_HEALTH, label: 'Website Health' },
  { to: ROUTES.ADMIN_EXPORTS, label: 'Exports' },
]);
