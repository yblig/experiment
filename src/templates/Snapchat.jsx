// Snapchat-style chat: no bubbles, coloured sender labels and a left bar per run.
import { ChevronLeft, Phone, Video, Camera, Mic, Smile, Sticker } from 'lucide-react';
import { Avatar, StatusBar, groupInfo, Content, Reaction, NonBubble, bigEmoji, typeOf, senderOf, Verified, PinBar, Draft, Keyboard, sbAndroid } from './parts.jsx';

const CLS = { time: 'sc-time', system: 'sc-time', unread: 'sc-time' };
const ME = '#f23c57', THEM = '#0eadff';

export default function Snapchat({ chat, items, byId, onTap }) {
  const dark = chat.dark;
  const g = groupInfo(items, chat.group);
  const lastMeIdx = items.map(x => x.kind === 'msg' && x.from === 'me').lastIndexOf(true);
  return (
    <div className={'shot sc ' + (dark ? 'dark' : 'light')} style={{ '--ts': chat.textScale || 1 }}>
      <div className="sc-head">
        {chat.showStatusBar !== false && <StatusBar android={sbAndroid(chat, false)} time={chat.clock} battery={chat.battery} charging={chat.charging} color={dark ? '#fff' : '#000'} />}
        <div className="sc-head-row">
          <ChevronLeft size={28} strokeWidth={2.4} />
          <Avatar contact={chat.contact} size={36} flat />
          <div className="sc-name">{chat.contact.name || 'Unknown'}{chat.verified && <Verified size={14} color="#fffc00" check="#000" />}</div>
          <span className="sc-pill"><Phone size={18} fill="currentColor" strokeWidth={0} /></span>
          <span className="sc-pill"><Video size={20} fill="currentColor" strokeWidth={0} /></span>
        </div>
      </div>
      <PinBar chat={chat} />
      <div className="msgs sc-msgs">
        {items.map((it, i) => {
          const tap = () => onTap?.(it._i);
          if (!['msg', 'typing'].includes(it.kind)) return <NonBubble key={it.id} it={it} onTap={tap} cls={CLS} />;
          const side = it.from === 'me' ? 'me' : 'them';
          const col = side === 'me' ? ME : (chat.group ? senderOf(it, chat).color : null) || THEM;
          const { first } = g[i];
          const big = it.kind === 'msg' && bigEmoji(it);
          const t = typeOf(it);
          return (
            <div key={it.id} className={`sc-row ${side} ${first ? 'first' : ''} ${it.reaction ? 'has-react' : ''}`} onClick={tap} style={{ '--c': col }}>
              {first && <div className="sc-label">{side === 'me' ? 'ME' : (senderOf(it, chat).name || '').toUpperCase()}</div>}
              <div className={`sc-b ${side} ${it.kind === 'typing' ? 'typing' : ''} k-${big ? 'emoji' : t}`} style={big ? { fontSize: 50 - big * 6 } : null}>
                {it.kind === 'typing' ? <span className="sc-typing">typing...</span> : <Content it={it} chat={chat} byId={byId} />}
                <Reaction it={it} />
              </div>
              {it.edited && <div className="sc-sub">Edited</div>}
              {i === lastMeIdx && it.status === 'read' && <div className="sc-sub">Opened</div>}
            </div>
          );
        })}
      </div>
      {chat.showInput !== false && (
        <div className="sc-input">
          <span className="sc-cam"><Camera size={22} strokeWidth={2} /></span>
          <span className="sc-field"><span className="sc-ph"><Draft chat={chat} placeholder="Send a chat" /></span><Mic size={21} strokeWidth={2} /></span>
          <Smile size={24} strokeWidth={2} />
          <Sticker size={24} strokeWidth={2} />
        </div>
      )}
      <Keyboard chat={chat} />
    </div>
  );
}
