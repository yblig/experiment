import { forwardRef } from 'react';
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
const Shot = forwardRef(function Shot({ chat: raw, upto, onTap }, ref) {
  const chat = raw.statusDefault ? { ...raw, contact: { ...raw.contact, status: 'online' } } : raw;
  const T = MAP[chat.template] || IMessage;
  const fr = chat.frame || 'phone';
  const h = FRAMES[fr];
  const items = chat.messages.slice(0, upto ?? chat.messages.length).map((m, i) => ({ ...m, _i: i }));
  const byId = Object.fromEntries(chat.messages.map(m => [m.id, m]));
  return (
    <div ref={ref} className={`shot-wrap ${fr === 'auto' ? 'auto' : 'phone'} tstyle-${chat.textStyle || 'normal'} bp-${chat.bubble || 'original'}`} style={h ? { '--sh': h + 'px' } : null}>
      <T chat={chat} items={items} byId={byId} onTap={onTap} />
      {chat.template !== 'lock' && <NotifBanner chat={chat} />}
      {chat.watermark ? <div className={'wm ' + (chat.dark ? 'd' : 'l')}>{chat.watermark}</div> : null}
    </div>
  );
});
export default Shot;
