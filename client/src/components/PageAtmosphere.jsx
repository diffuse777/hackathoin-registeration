export function PageAtmosphere({ variant = 'register' }) {
  const showArchitecture = variant === 'register' || variant === 'page' || variant === 'admin';
  const showMountains = true;
  const showWater = variant !== 'admin';

  return (
    <div className={`page-atmosphere page-atmosphere--${variant}`} aria-hidden="true">
      <div className="page-atmosphere__sky" />
      <div className="page-atmosphere__moon">
        <svg viewBox="0 0 200 200">
          <defs>
            <radialGradient id={`pageMoonFill-${variant}`} cx="36%" cy="30%">
              <stop offset="0%" stopColor="#f6d0b0" />
              <stop offset="24%" stopColor="#e8a05a" />
              <stop offset="52%" stopColor="#c44a2a" />
              <stop offset="78%" stopColor="#8e1c1c" />
              <stop offset="100%" stopColor="#2c0c0c" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="97" fill={`url(#pageMoonFill-${variant})`} />
        </svg>
      </div>
      {showArchitecture ? (
        <>
          <svg className="page-atmosphere__torii" viewBox="0 0 170 200">
            <rect x="22" y="52" width="16" height="148" fill="#8e1c1c" />
            <rect x="132" y="52" width="16" height="148" fill="#8e1c1c" />
            <rect x="10" y="30" width="150" height="11" fill="#a12626" />
            <rect x="26" y="50" width="118" height="9" fill="#6b1414" />
            <rect x="6" y="18" width="158" height="9" fill="#c44a2a" />
          </svg>
          <svg className="page-atmosphere__pagoda" viewBox="0 0 200 280">
            <rect x="88" y="36" width="24" height="230" fill="#17100e" />
            <polygon points="100,6 18,52 182,52" fill="#2c1714" />
            <polygon points="100,48 30,92 170,92" fill="#251412" />
            <polygon points="100,88 42,128 158,128" fill="#1d100f" />
            <polygon points="100,124 54,160 146,160" fill="#160d0c" />
            <polygon points="100,156 64,188 136,188" fill="#120a0a" />
          </svg>
        </>
      ) : null}
      {showMountains ? (
        <svg className="page-atmosphere__mountains" viewBox="0 0 1440 280" preserveAspectRatio="none">
          <path
            fill="#0a0706"
            d="M0 280 L0 180 L160 210 L300 120 L460 190 L620 110 L800 188 L960 128 L1140 200 L1280 140 L1440 176 L1440 280 Z"
          />
        </svg>
      ) : null}
      {showWater ? <div className="page-atmosphere__water" /> : null}
      {variant === 'admin' ? <div className="page-atmosphere__texture" /> : null}
      <div className="scene-grain" />
    </div>
  );
}
