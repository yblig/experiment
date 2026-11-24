import { forwardRef } from 'react';
import IMessage from './IMessage.jsx';
import WhatsApp from './WhatsApp.jsx';
import XDM from './XDM.jsx';
import Telegram from './Telegram.jsx';
import Instagram from './Instagram.jsx';
import Sms from './Sms.jsx';
import Lock from './Lock.jsx';
import { NotifBanner } from './parts.jsx';
import './templates.css';

const MAP = { imessage: IMessage, whatsapp: WhatsApp, x: XDM, telegram: Telegram, instagram: Instagram, sms: Sms, lock: Lock };

// One phone screen, 390pt wide. `upto` limits how many items are shown (step-by-step export / play mode).
const Shot = forwardRef(function Shot({ chat, upto, onTap }, ref) {
  const T = MAP[chat.template] || IMessage;
  const items = chat.messages.slice(0, upto ?? chat.messages.length).map((m, i) => ({ ...m, _i: i }));
  const byId = Object.fromEntries(chat.messages.map(m => [m.id, m]));
  return (
    <div ref={ref} className={'shot-wrap ' + (chat.frame === 'auto' ? 'auto' : 'phone')}>
      <T chat={chat} items={items} byId={byId} onTap={onTap} />
      {chat.template !== 'lock' && <NotifBanner chat={chat} />}
      {chat.watermark ? <div className={'wm ' + (chat.dark ? 'd' : 'l')}>{chat.watermark}</div> : null}
    </div>
  );
});
export default Shot;
