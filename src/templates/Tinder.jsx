import { ChevronLeft, Video, Shield } from 'lucide-react';
import { Avatar, StatusBar, groupInfo, Dots, Content, Reaction, NonBubble, bigEmoji, typeOf, senderOf, Verified, PinBar, Draft, Keyboard, sbAndroid , tx, labels } from './parts.jsx';

const CLS = { time: 'tn-time', system: 'tn-time', unread: 'tn-time' };

export default function Tinder({ chat, items, byId, onTap }) {
  const dark = chat.dark;
  const g = groupInfo(items, chat.group);
  const lastMeIdx = items.map(x => x.kind === 'msg' && x.from === 'me').lastIndexOf(true);
  return (
    <div className={'shot tn ' + (dark ? 'dark' : 'light')} style={{ '--ts': chat.textScale || 1 }}>
      <div className="tn-head">
        {chat.showStatusBar !== false && <StatusBar cfg={chat} android={sbAndroid(chat, false)} time={chat.clock} battery={chat.battery} charging={chat.charging} color={dark ? '#fff' : '#000'} />}
        <div className="tn-head-row">
          <ChevronLeft size={32} strokeWidth={2.2} className="tn-pink" />
          <div className="tn-contact">
            <Avatar contact={chat.contact} size={46} flat />
            <div className="tn-name">{chat.contact.name || 'Unknown'}{chat.verified && <Verified size={13} color="#1786ff" />}</div>
          </div>
          <Video size={25} strokeWidth={1.8} />
          <Shield size={24} strokeWidth={1.8} />
        </div>
      </div>
      <PinBar chat={chat} />
      <div className="msgs tn-msgs">
        {items.map((it, i) => {
          const tap = () => onTap?.(it._i);
          if (!['msg', 'typing'].includes(it.kind)) return <NonBubble key={it.id} it={it} onTap={tap} cls={CLS} chat={chat} />;
          const side = it.from === 'me' ? 'me' : 'them';
          const { first, last } = g[i];
          const big = it.kind === 'msg' && bigEmoji(it);
          const t = typeOf(it);
          return (
            <div key={it.id} className={`tn-row ${side} ${first ? 'first' : ''} ${it.reaction ? 'has-react' : ''}`} onClick={tap}>
              <div className="tn-line">
                {side === 'them' && <div className="tn-avslot">{last && <Avatar contact={senderOf(it, chat)} size={30} flat />}</div>}
                <div className={`tn-b ${side} ${last ? 'last' : ''} ${it.kind === 'typing' ? 'typing' : ''} k-${big ? 'emoji' : t}`} style={big ? { fontSize: 50 - big * 6 } : null}>
                  {it.kind === 'typing' ? <Dots color={dark ? '#9aa1ab' : '#7c8591'} /> : <Content it={it} chat={chat} byId={byId} showName={chat.group && side === 'them' && first} />}
                  <Reaction it={it} />
                </div>
              </div>
              {i === lastMeIdx && it.status && <div className="tn-meta">{it.status === 'read' ? tx(chat).read + ' ✓' : tx(chat).sent}{it.edited ? ' · ' + labels(chat).edited : ''}</div>}
            </div>
          );
        })}
      </div>
      {chat.showInput !== false && (
        <div className="tn-input">
          <span className="tn-gif">GIF</span>
          <span className="tn-ph"><Draft chat={chat} placeholder={tx(chat).tinderPh} /></span>
          <span className="tn-send">{tx(chat).sendBtn}</span>
        </div>
      )}
      <Keyboard chat={chat} />
    </div>
  );
}
