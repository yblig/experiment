import { ArrowLeft, Info, Image, Smile, SendHorizontal } from 'lucide-react';
import { Avatar, StatusBar, groupInfo, Dots, to12, Content, Reaction, NonBubble, bigEmoji, typeOf, senderOf, Verified , PinBar, Draft, Keyboard } from './parts.jsx';

const CLS = { time: 'xd-time', system: 'xd-time', unread: 'xd-unread' };

export default function XDM({ chat, items, byId, onTap }) {
  const dark = chat.dark;
  const g = groupInfo(items, chat.group);
  const lastMeIdx = items.map(x => x.kind === 'msg' && x.from === 'me').lastIndexOf(true);
  const handle = chat.contact.handle || '@' + (chat.contact.name || 'user').toLowerCase().replace(/\s+/g, '');
  return (
    <div className={'shot xd ' + (dark ? 'dark' : 'light')} style={{ '--ts': chat.textScale || 1 }}>
      <div className="xd-head">
        {chat.showStatusBar !== false && <StatusBar time={chat.clock} battery={chat.battery} charging={chat.charging} color={dark ? '#fff' : '#0f1419'} />}
        <div className="xd-head-row">
          <ArrowLeft size={22} strokeWidth={2.2} />
          <Avatar contact={chat.contact} size={34} flat />
          <div className="xd-who">
            <div className="xd-name">{chat.contact.name || 'Unknown'}{chat.verified && <Verified size={17} />}</div>
            <div className="xd-handle">{chat.group ? `${chat.participants.length + 1} people` : handle}</div>
          </div>
          <Info size={22} strokeWidth={2} />
        </div>
      </div>
      <PinBar chat={chat} />
      <div className="msgs xd-msgs">
        {items.map((it, i) => {
          const tap = () => onTap?.(it._i);
          if (!['msg', 'typing'].includes(it.kind)) return <NonBubble key={it.id} it={it} onTap={tap} cls={CLS} />;
          const side = it.from === 'me' ? 'me' : 'them';
          const { first, last } = g[i];
          const big = it.kind === 'msg' && bigEmoji(it);
          const t = typeOf(it);
          return (
            <div key={it.id} className={`xd-row ${side} ${first ? 'first' : ''} ${it.reaction ? 'has-react' : ''}`} onClick={tap}>
              <div className="xd-line">
                {side === 'them' && <div className="xd-avslot">{last && <Avatar contact={senderOf(it, chat)} size={30} flat />}</div>}
                <div className={`xd-b ${side} ${last ? 'last' : ''} ${it.kind === 'typing' ? 'typing' : ''} k-${big ? 'emoji' : t}`} style={big ? { fontSize: 50 - big * 6 } : null}>
                  {it.kind === 'typing' ? <Dots color={dark ? '#71767b' : '#536471'} /> : <Content it={it} chat={chat} byId={byId} />}
                  <Reaction it={it} />
                </div>
              </div>
              {last && it.kind === 'msg' && (
                <div className="xd-meta">
                  {chat.group && side === 'them' ? senderOf(it, chat).name + ' · ' : ''}{to12(it.time)}{it.edited ? ' · Edited' : ''}{i === lastMeIdx && it.status === 'read' ? ' · Seen' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {chat.showInput !== false && (
        <div className="xd-input">
          <span className="xd-field">
            <Image size={20} strokeWidth={2} />
            <span className="xd-gif">GIF</span>
            <span className="xd-ph"><Draft chat={chat} placeholder="Start a message" /></span>
            <Smile size={20} strokeWidth={2} />
            <SendHorizontal size={20} strokeWidth={2} />
          </span>
        </div>
      )}
      <Keyboard chat={chat} />
    </div>
  );
}
