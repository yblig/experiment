// Shared pieces for the phone-screen templates: status bar, avatar, ticks, grouping.

export function groupInfo(items) {
  // For each item: is it the first/last of a run of bubbles from the same sender?
  const side = it => (it && (it.kind === 'msg' || it.kind === 'typing') ? it.from : null);
  return items.map((it, i) => {
    const s = side(it);
    return { first: s !== side(items[i - 1]), last: s !== side(items[i + 1]) };
  });
}

export function initials(name = '?') {
  const clean = name.replace(/[^\p{L}\p{N} ]/gu, ' ').trim();
  if (!clean) return '#';
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, parts[0].length <= 3 ? 3 : 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AV_COLORS = ['#8e8e93', '#ff9f0a', '#30b0c7', '#5e5ce6', '#ff375f', '#34c759', '#bf5af2', '#64d2ff'];
export function avatarColor(name = '') {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}

export function Avatar({ contact, size, flat, color, personIcon }) {
  const st = { width: size, height: size, minWidth: size };
  if (contact.avatar) {
    return <div className="t-av" style={st}><img src={contact.avatar} alt="" /></div>;
  }
  if (personIcon) {
    return (
      <div className="t-av" style={{ ...st, background: personIcon.bg }}>
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <circle cx="20" cy="15.5" r="7.2" fill={personIcon.fg} />
          <path d="M6.5 35c1.8-7.2 7-10.6 13.5-10.6S31.7 27.8 33.5 35z" fill={personIcon.fg} />
        </svg>
      </div>
    );
  }
  const bg = flat ? (color || avatarColor(contact.name)) : 'linear-gradient(180deg,#a5a5ab,#858589)';
  const txt = initials(contact.name);
  return (
    <div className="t-av" style={{ ...st, background: bg, fontSize: size * (txt.length > 2 ? 0.34 : 0.42) }}>
      {txt}
    </div>
  );
}

export function StatusBar({ time, battery = 76, color = '#fff', android = false }) {
  const lvl = Math.max(4, Math.min(100, battery));
  return (
    <div className={'t-sb' + (android ? ' android' : '')} style={{ color }}>
      <span className="t-sb-time">{time}</span>
      <span className="t-sb-icons">
        <svg width="18" height="12" viewBox="0 0 18 12">
          {[0, 1, 2, 3].map(i => (
            <rect key={i} x={i * 4.6} y={9 - i * 2.8} width="3.2" height={3 + i * 2.8} rx="0.9" fill="currentColor" />
          ))}
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12">
          <path d="M8 11.4 5.6 8.9a3.4 3.4 0 0 1 4.8 0z" fill="currentColor" />
          <path d="M3.6 6.9a6.3 6.3 0 0 1 8.8 0l-1.3 1.3a4.5 4.5 0 0 0-6.2 0z" fill="currentColor" />
          <path d="M1.4 4.7a9.4 9.4 0 0 1 13.2 0l-1.3 1.3a7.6 7.6 0 0 0-10.6 0z" fill="currentColor" />
        </svg>
        <span className="t-bat">
          <span className="t-bat-body"><span className="t-bat-lvl" style={{ width: lvl + '%', background: lvl <= 20 ? '#ff453a' : 'currentColor' }} /></span>
          <span className="t-bat-cap" />
        </span>
      </span>
    </div>
  );
}

export function Ticks({ status, color }) {
  if (status === 'sent') {
    return (
      <svg className="wa-tick" width="12" height="11" viewBox="0 0 12 11">
        <path d="M1.5 6l3 3 6-7" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="wa-tick" width="16" height="11" viewBox="0 0 16 11">
      <path d="M1.2 6l3 3 6-7" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.4 8.2l.8.8 6-7" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 12h label for templates that show English times
export function to12(t = '') {
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h)) return t;
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')} ${ap}`;
}

export function Dots({ color }) {
  return (
    <span className="t-dots">
      <i style={{ background: color }} /><i style={{ background: color }} /><i style={{ background: color }} />
    </span>
  );
}
