export function HeroScene() {
  return (
    <div className="hero-scene" aria-hidden="true">
      <div className="hero-scene__sky" />
      <div className="hero-scene__stars" />
      <div className="hero-scene__haze" />
      <div className="hero-scene__moon">
        <svg className="hero-scene__moon-face" viewBox="0 0 200 200">
          <defs>
            <radialGradient id="heroMoonFill" cx="36%" cy="30%">
              <stop offset="0%" stopColor="#f6d0b0" />
              <stop offset="22%" stopColor="#e8a05a" />
              <stop offset="48%" stopColor="#c44a2a" />
              <stop offset="74%" stopColor="#8e1c1c" />
              <stop offset="100%" stopColor="#2c0c0c" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="97" fill="url(#heroMoonFill)" />
          <ellipse cx="68" cy="78" rx="22" ry="16" fill="#6b1414" opacity="0.22" />
          <ellipse cx="122" cy="108" rx="28" ry="18" fill="#3a1010" opacity="0.18" />
          <ellipse cx="86" cy="132" rx="14" ry="10" fill="#7a2418" opacity="0.2" />
        </svg>
      </div>
      <svg className="hero-scene__clouds" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMin slice">
        <path
          fill="#1a0c0c"
          opacity="0.5"
          d="M0 240 C200 170 320 250 470 200 C620 150 720 250 900 190 C1080 130 1220 220 1440 170 L1440 0 L0 0 Z"
        />
        <path
          fill="#100808"
          opacity="0.72"
          d="M0 90 C240 150 380 40 580 110 C780 180 940 50 1160 120 C1300 155 1380 80 1440 105 L1440 0 L0 0 Z"
        />
      </svg>
      <svg className="hero-scene__mountains hero-scene__mountains--back" viewBox="0 0 1440 340" preserveAspectRatio="none">
        <path
          fill="#16100f"
          d="M0 340 L0 220 L150 160 L270 210 L430 88 L580 188 L740 70 L900 176 L1060 98 L1200 198 L1340 128 L1440 210 L1440 340 Z"
        />
      </svg>
      <svg className="hero-scene__shrine" viewBox="0 0 140 160">
        <rect x="58" y="54" width="24" height="96" fill="#1a1210" />
        <polygon points="70,18 8,62 132,62" fill="#2a1614" />
        <rect x="28" y="62" width="84" height="10" fill="#8e1c1c" />
        <rect x="40" y="84" width="60" height="66" fill="#120c0b" />
        <rect x="58" y="100" width="24" height="50" fill="#3a1816" />
      </svg>
      <svg className="hero-scene__pagoda" viewBox="0 0 200 280">
        <rect x="88" y="36" width="24" height="230" fill="#17100e" />
        <polygon points="100,6 18,52 182,52" fill="#2c1714" />
        <polygon points="100,48 30,92 170,92" fill="#251412" />
        <polygon points="100,88 42,128 158,128" fill="#1d100f" />
        <polygon points="100,124 54,160 146,160" fill="#160d0c" />
        <polygon points="100,156 64,188 136,188" fill="#120a0a" />
        <rect x="22" y="48" width="156" height="5" fill="#8e1c1c" opacity="0.7" />
        <rect x="34" y="88" width="132" height="4" fill="#a12626" opacity="0.55" />
        <circle cx="164" cy="150" r="7" fill="#e8a05a" opacity="0.45" />
      </svg>
      <svg className="hero-scene__mountains hero-scene__mountains--front" viewBox="0 0 1440 300" preserveAspectRatio="none">
        <path
          fill="#0a0706"
          d="M0 300 L0 198 L110 238 L250 148 L390 216 L530 126 L700 208 L850 138 L1010 228 L1150 158 L1310 218 L1440 168 L1440 300 Z"
        />
      </svg>
      <svg className="hero-scene__torii" viewBox="0 0 170 200">
        <rect x="22" y="52" width="16" height="148" fill="#8e1c1c" />
        <rect x="132" y="52" width="16" height="148" fill="#8e1c1c" />
        <rect x="10" y="30" width="150" height="11" fill="#a12626" />
        <rect x="26" y="50" width="118" height="9" fill="#6b1414" />
        <rect x="6" y="18" width="158" height="9" fill="#c44a2a" />
        <rect x="4" y="14" width="8" height="16" fill="#c44a2a" />
        <rect x="158" y="14" width="8" height="16" fill="#c44a2a" />
      </svg>
      <div className="hero-scene__water" />
      <div className="hero-scene__reflection" />
      <svg className="hero-scene__desk" viewBox="0 0 440 240">
        <ellipse cx="220" cy="226" rx="200" ry="12" fill="#050403" />
        <rect x="36" y="178" width="368" height="16" rx="2" fill="#1c1410" />
        <rect x="64" y="122" width="108" height="58" rx="3" fill="#0c0a09" />
        <rect x="74" y="130" width="88" height="42" fill="#15202c" />
        <rect x="80" y="136" width="54" height="2" fill="#f4eee6" opacity="0.5" />
        <rect x="80" y="143" width="40" height="2" fill="#e8a05a" opacity="0.55" />
        <rect x="80" y="150" width="62" height="2" fill="#f4eee6" opacity="0.38" />
        <rect x="80" y="157" width="28" height="2" fill="#e8a05a" opacity="0.42" />
        <path d="M176 178 L186 94 L228 88 L244 178" fill="#12100f" />
        <circle cx="218" cy="78" r="18" fill="#0f0d0c" />
        <rect x="262" y="140" width="20" height="38" fill="#241816" />
        <rect x="288" y="152" width="24" height="26" fill="#2a1c16" />
        <rect x="318" y="158" width="32" height="20" rx="9" fill="#1a1210" />
        <path d="M338 122 L342 158" stroke="#e8a05a" strokeWidth="2.2" opacity="0.6" />
        <circle cx="338" cy="116" r="8" fill="#e8a05a" opacity="0.5" />
      </svg>
      <div className="scene-grain" />
    </div>
  );
}
