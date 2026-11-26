// Flat illustrations in the app palette (used for empty states & onboarding).
const Base = ({ children, size = 150 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="104" r="84" fill="var(--primary-soft)" />
    <ellipse cx="100" cy="176" rx="58" ry="7" fill="#000" opacity=".08" />
    {children}
  </svg>
);

export const ArtReceipt = p => (
  <Base {...p}>
    <path d="M62 36h76v124l-9.5-7-9.5 7-9.5-7-9.5 7-9.5-7-9.5 7-9.5-7-9.5 7z" fill="#fff" stroke="#1B2320" strokeOpacity=".12" strokeWidth="2" />
    <rect x="76" y="52" width="48" height="8" rx="4" fill="var(--primary)" />
    <rect x="84" y="66" width="32" height="5" rx="2.5" fill="#C9CFCC" />
    <path d="M74 82h52" stroke="#C9CFCC" strokeWidth="2" strokeDasharray="4 4" />
    <rect x="74" y="92" width="30" height="5" rx="2.5" fill="#C9CFCC" /><rect x="112" y="92" width="14" height="5" rx="2.5" fill="#C9CFCC" />
    <rect x="74" y="104" width="24" height="5" rx="2.5" fill="#C9CFCC" /><rect x="112" y="104" width="14" height="5" rx="2.5" fill="#C9CFCC" />
    <rect x="74" y="116" width="34" height="5" rx="2.5" fill="#C9CFCC" /><rect x="112" y="116" width="14" height="5" rx="2.5" fill="#C9CFCC" />
    <path d="M74 130h52" stroke="#C9CFCC" strokeWidth="2" strokeDasharray="4 4" />
    <rect x="74" y="138" width="22" height="7" rx="3.5" fill="#1B2320" opacity=".75" /><rect x="104" y="138" width="22" height="7" rx="3.5" fill="#1B2320" opacity=".75" />
    <circle cx="146" cy="52" r="16" fill="var(--accent)" /><path d="M139 52l5 5 9-10" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </Base>
);

export const ArtBox = p => (
  <Base {...p}>
    <path d="M100 52l50 22v56l-50 24-50-24V74z" fill="#E8B66A" />
    <path d="M100 52l50 22-50 22-50-22z" fill="#F6CF8C" />
    <path d="M100 96v58l-50-24V74z" fill="#D9A050" />
    <path d="M75 63l50 22v18l-10-4V89L65 67z" fill="#fff" opacity=".55" />
    <rect x="120" y="34" width="34" height="34" rx="10" fill="var(--primary)" transform="rotate(12 137 51)" />
    <path d="M131 51h12M137 45v12" stroke="#fff" strokeWidth="4" strokeLinecap="round" transform="rotate(12 137 51)" />
  </Base>
);

export const ArtWallet = p => (
  <Base {...p}>
    <rect x="46" y="66" width="108" height="78" rx="16" fill="var(--primary)" />
    <rect x="46" y="66" width="108" height="22" rx="11" fill="var(--primary-dark)" />
    <rect x="58" y="48" width="70" height="34" rx="6" fill="#7FD3A8" transform="rotate(-8 93 65)" />
    <rect x="66" y="44" width="70" height="34" rx="6" fill="#A9E6C4" transform="rotate(-3 101 61)" />
    <circle cx="101" cy="60" r="8" fill="#7FD3A8" />
    <rect x="118" y="96" width="44" height="28" rx="10" fill="var(--accent)" />
    <circle cx="132" cy="110" r="6" fill="#fff" />
  </Base>
);

export const ArtChart = p => (
  <Base {...p}>
    <rect x="44" y="44" width="112" height="104" rx="18" fill="#fff" />
    <rect x="62" y="108" width="14" height="24" rx="5" fill="var(--primary-soft)" />
    <rect x="84" y="90" width="14" height="42" rx="5" fill="#9FD9C9" />
    <rect x="106" y="98" width="14" height="34" rx="5" fill="#6CC5AE" />
    <rect x="128" y="70" width="14" height="62" rx="5" fill="var(--primary)" />
    <path d="M62 86l24-14 22 8 30-24" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="138" cy="56" r="6" fill="var(--accent)" />
  </Base>
);

export const ArtPrinter = p => (
  <Base {...p}>
    <rect x="64" y="40" width="72" height="56" rx="6" fill="#fff" stroke="#1B2320" strokeOpacity=".1" strokeWidth="2" />
    <rect x="76" y="54" width="48" height="6" rx="3" fill="#C9CFCC" /><rect x="76" y="66" width="36" height="6" rx="3" fill="#C9CFCC" />
    <rect x="44" y="84" width="112" height="64" rx="18" fill="#2A3330" />
    <rect x="44" y="84" width="112" height="22" rx="11" fill="#3A4542" />
    <rect x="62" y="90" width="76" height="6" rx="3" fill="#101413" />
    <circle cx="136" cy="128" r="6" fill="#3DD17A" />
    <rect x="62" y="124" width="40" height="8" rx="4" fill="#4C5855" />
    <path d="M160 46c6 6 6 18 0 24M150 52c3 3 3 9 0 12" stroke="var(--info)" strokeWidth="4" strokeLinecap="round" />
  </Base>
);

export const ArtPeople = p => (
  <Base {...p}>
    <circle cx="78" cy="78" r="20" fill="#F2C9A0" /><path d="M58 76c0-16 10-24 22-24 10 0 20 8 18 22-6-6-20-8-40 2z" fill="#3B2B20" />
    <path d="M42 150c0-26 16-40 36-40s36 14 36 40z" fill="var(--primary)" />
    <circle cx="128" cy="86" r="18" fill="#E7B48A" /><path d="M110 82c2-14 12-20 22-18 9 2 16 10 14 22-8-8-22-10-36-4z" fill="#1B2320" />
    <path d="M96 152c0-24 14-36 32-36s32 12 32 36z" fill="var(--accent)" />
  </Base>
);

export const ArtLock = p => (
  <Base {...p}>
    <path d="M72 88V70a28 28 0 0156 0v18" stroke="#2A3330" strokeWidth="12" strokeLinecap="round" />
    <rect x="52" y="84" width="96" height="74" rx="18" fill="var(--primary)" />
    <rect x="52" y="84" width="96" height="20" rx="10" fill="var(--primary-2)" />
    <circle cx="100" cy="120" r="10" fill="#fff" /><rect x="96" y="122" width="8" height="18" rx="4" fill="#fff" />
  </Base>
);

export const ArtShop = p => (
  <Base {...p}>
    <rect x="52" y="86" width="96" height="66" rx="8" fill="#fff" />
    <path d="M44 86l12-34h88l12 34z" fill="var(--primary)" />
    <path d="M44 86h112v6a14 14 0 01-28 0 14 14 0 01-28 0 14 14 0 01-28 0 14 14 0 01-28 0z" fill="var(--accent)" />
    <path d="M72 86V52M100 86V52M128 86V52" stroke="var(--primary-dark)" strokeWidth="3" opacity=".4" />
    <rect x="66" y="108" width="28" height="44" rx="5" fill="var(--primary-soft)" />
    <rect x="104" y="108" width="32" height="24" rx="5" fill="#CFE9F6" />
    <circle cx="88" cy="132" r="3" fill="var(--primary)" />
  </Base>
);
