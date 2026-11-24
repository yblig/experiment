// Round template picker (original icons in each app's colours, no third-party logos).
import { MessageCircle, Send, Camera, AtSign, MessageSquare, Lock, Smile, Heart, Zap, Phone, MessagesSquare, MessageSquareText } from 'lucide-react';
import { TEMPLATES } from '../store.js';
import { fx } from '../fx.js';

export const TPL_ICON = {
  snapchat: [Smile, 'linear-gradient(160deg,#fffc00,#f5c400)', '#111'],
  line: [MessageSquareText, 'linear-gradient(160deg,#2ee07a,#06b14c)', '#fff'],
  x: [AtSign, 'linear-gradient(160deg,#3a3a3a,#000)', '#fff'],
  imessage: [MessageCircle, 'linear-gradient(160deg,#6cf07f,#1ec337)', '#fff'],
  telegram: [Send, 'linear-gradient(160deg,#5ccbff,#1c93e3)', '#fff'],
  tinder: [Heart, 'linear-gradient(160deg,#ff7a59,#fd267a)', '#fff'],
  instagram: [Camera, 'linear-gradient(45deg,#feda75,#fa7e1e 30%,#d62976 60%,#962fbf 85%,#4f5bd5)', '#fff'],
  messenger: [Zap, 'linear-gradient(160deg,#00b2ff,#0a7cff 55%,#a033ff)', '#fff'],
  whatsapp: [Phone, 'linear-gradient(160deg,#5bf08a,#1faa4c)', '#fff'],
  kakao: [MessagesSquare, 'linear-gradient(160deg,#fff04d,#fee500)', '#3c1e1e'],
  sms: [MessageSquare, 'linear-gradient(160deg,#7fb0ff,#2f6fe0)', '#fff'],
  lock: [Lock, 'linear-gradient(160deg,#ffc25c,#ff8a00)', '#fff']
};

export function TplIcon({ k, size = 40 }) {
  const [I, bg, fg] = TPL_ICON[k] || TPL_ICON.imessage;
  return (
    <span className="tpl-ic" style={{ width: size, height: size, background: bg, color: fg, borderRadius: size * 0.28 }}>
      <I size={size * 0.56} strokeWidth={2.2} fill={k === 'imessage' || k === 'messenger' || k === 'whatsapp' ? fg : 'none'} />
    </span>
  );
}

export default function TplGrid({ value, onPick }) {
  return (
    <div className="tpl-grid">
      {Object.entries(TEMPLATES).map(([k, t]) => (
        <button key={k} className={'tpl-cell press' + (value === k ? ' on' : '')} onClick={() => { fx.toggle(); onPick(k); }}>
          <span className="tpl-ring"><TplIcon k={k} /></span>
          <small>{t.label}</small>
        </button>
      ))}
    </div>
  );
}
