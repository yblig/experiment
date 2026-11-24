import { forwardRef } from 'react';
import { useStore } from '../store.js';
import IMessage from './IMessage.jsx';
import WhatsApp from './WhatsApp.jsx';
import XDM from './XDM.jsx';
import Telegram from './Telegram.jsx';
import Instagram from './Instagram.jsx';
import Sms from './Sms.jsx';
import Lock from './Lock.jsx';
import Line from './Line.jsx';
import Messenger from './Messenger.jsx';
import Snapchat from './Snapchat.jsx';
import Tinder from './Tinder.jsx';
import Kakao from './Kakao.jsx';
import { NotifBanner } from './parts.jsx';
import './templates.css';

const MAP = { imessage: IMessage, whatsapp: WhatsApp, x: XDM, telegram: Telegram, instagram: Instagram, sms: Sms, lock: Lock, line: Line, messenger: Messenger, snapchat: Snapchat, tinder: Tinder, kakao: Kakao };

// Screen heights for the export sizes (width is always 390).
export const FRAMES = { phone: 844, '916': 693.334, '45': 487.5, '11': 390 };

// One phone screen, 390pt wide. `upto` limits how many items are shown (step-by-step export / play mode).
const Shot = forwardRef(function Shot({ chat: raw, upto, onTap, phase }, ref) {
  const appLang = useStore(st => st.settings.lang || 'id');
  const _lang = raw.lang && raw.lang !== 'auto' ? raw.lang : appLang;
  const hour = +(raw.clock || '12:00').split(':')[0];
  const chat = { ...raw, _lang, ...(raw.autoDark ? { dark: hour >= 18 || hour < 6 } : {}), ...(raw.statusDefault ? { contact: { ...raw.contact, status: 'online' } } : {}) };
  const cme = chat.bubbleColor;
  const cmeText = cme ? (lum(cme) > 0.6 ? '#111' : '#fff') : null;
  const T = MAP[chat.template] || IMessage;
  const fr = chat.frame || 'phone';
  const h = FRAMES[fr];
  const items = chat.messages.slice(0, upto ?? chat.messages.length).map((m, i) => ({ ...m, _i: i }));
  const byId = Object.fromEntries(chat.messages.map(m => [m.id, m]));
  return (
    <div ref={ref} className={`shot-wrap ${fr === 'auto' ? 'auto' : 'phone'} tstyle-${chat.textStyle || 'normal'} bp-${chat.bubble || 'original'}${phase != null ? ' ph-' + phase : ''}${cme ? ' cme' : ''} cf-${chat.chatFont || 'default'}`} style={{ ...(h ? { '--sh': h + 'px' } : {}), ...(cme ? { '--cme': cme, '--cme-t': cmeText, '--me': cme } : {}) }}>
      <T chat={chat} items={items} byId={byId} onTap={onTap} />
      {chat.template !== 'lock' && <NotifBanner chat={chat} />}
      {chat.watermark ? <div className={`wm ${chat.dark ? 'd' : 'l'} wm-${chat.wmPos || 'center'}`} style={chat.wmOpacity != null ? { opacity: chat.wmOpacity / 0.16 > 1 ? 1 : undefined, color: `rgba(${chat.dark ? '255,255,255' : '0,0,0'},${chat.wmOpacity})` } : null}>{chat.watermark}</div> : null}
    </div>
  );
});
function lum(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
export default Shot;
