import { motion } from 'framer-motion';
import { HARI } from '../lib/format.js';
import { rpShort } from '../lib/format.js';

export function BarChart({ data, height = 150, color = 'var(--primary)', second }) {
  const max = Math.max(1, ...data.map(d => Math.max(d.omzet, second ? d.out : 0)));
  const today = data.length - 1;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height, padding: '0 2px' }}>
        {data.map((d, i) => (
          <div key={d.from} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 }}>
            <div className="tiny bold num" style={{ color: i === today ? 'var(--primary)' : 'var(--muted)', opacity: d.omzet ? 1 : 0, whiteSpace: 'nowrap' }}>{rpShort(d.omzet)}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, width: '100%', justifyContent: 'center', flex: 1 }}>
              <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(3, (d.omzet / max) * 100)}%` }} transition={{ delay: i * 0.04, type: 'spring', damping: 18 }}
                style={{ width: second ? '45%' : '70%', maxWidth: 30, borderRadius: 8, background: i === today ? `linear-gradient(180deg, var(--primary-2), ${color})` : 'color-mix(in srgb, var(--primary) 30%, var(--surface2))' }} />
              {second && <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(3, (d.out / max) * 100)}%` }} transition={{ delay: i * 0.04 + 0.1, type: 'spring', damping: 18 }}
                style={{ width: '45%', maxWidth: 30, borderRadius: 8, background: 'color-mix(in srgb, var(--expense) 70%, transparent)' }} />}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, padding: '0 2px' }}>
        {data.map((d, i) => <div key={d.from} className="tiny bold" style={{ flex: 1, textAlign: 'center', color: i === today ? 'var(--text)' : 'var(--muted)' }}>{i === today ? 'Hari ini' : HARI[new Date(d.from).getDay()].slice(0, 3)}</div>)}
      </div>
    </div>
  );
}

export function Donut({ parts, size = 120, stroke = 18 }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const r = (size - stroke) / 2, C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg2)" strokeWidth={stroke} />
      {parts.map((p, i) => {
        const len = (p.value / total) * C; const off = acc; acc += len;
        return <motion.circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={stroke} strokeLinecap="butt"
          strokeDasharray={`${len} ${C - len}`} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: -off }} transition={{ duration: 0.8, delay: i * 0.05 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />;
      })}
    </svg>
  );
}
