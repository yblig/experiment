import { forwardRef } from 'react';
import IMessage from './IMessage.jsx';
import WhatsApp from './WhatsApp.jsx';
import XDM from './XDM.jsx';
import './templates.css';

const MAP = { imessage: IMessage, whatsapp: WhatsApp, x: XDM };

// One phone screen, 390pt wide. `upto` limits how many items are shown (step-by-step export).
const Shot = forwardRef(function Shot({ chat, upto, onTap }, ref) {
  const T = MAP[chat.template] || IMessage;
  const items = chat.messages.slice(0, upto ?? chat.messages.length).map((m, i) => ({ ...m, _i: i }));
  return (
    <div ref={ref} className={'shot-wrap ' + (chat.frame === 'auto' ? 'auto' : 'phone')}>
      <T chat={chat} items={items} onTap={onTap} />
    </div>
  );
});
export default Shot;
