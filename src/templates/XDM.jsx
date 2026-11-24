import { ArrowLeft, Info, Image, Smile, SendHorizontal } from 'lucide-react';
import { Avatar, StatusBar, groupInfo, Dots, to12 } from './parts.jsx';

export default function XDM({ chat, items, onTap }) {
  const dark = chat.dark;
  const g = groupInfo(items);
  const lastMeIdx = items.map(x => x.kind === 'msg' && x.from === 'me').lastIndexOf(true);
  const handle = chat.contact.handle || '@' + (chat.contact.name || 'user').toLowerCase().replace(/\s+/g, '');
  return (
    <div className={'shot xd ' + (dark ? 'dark' : 'light')}>
      <div className="xd-head">
        {chat.showStatusBar !== false && <StatusBar time={chat.clock} battery={chat.battery} color={dark ? '#fff' : '#0f1419'} />}
        <div className="xd-head-row">
          <ArrowLeft size={22} strokeWidth={2.2} />
          <Avatar contact={chat.contact} size={34} flat />
          <div className="xd-who">
            <div className="xd-name">{chat.contact.name || 'Unknown'}</div>
            <div className="xd-handle">{handle}</div>
          </div>
          <Info size={22} strokeWidth={2} />
        </div>
      </div>
      <div className="msgs xd-msgs">
        {items.map((it, i) => {
          const tap = () => onTap?.(it._i);
          if (it.kind === 'time') return <div key={it.id} className="xd-time" onClick={tap}>{it.text}</div>;
          const side = it.from === 'me' ? 'me' : 'them';
          const { first, last } = g[i];
          const showAv = side === 'them' && last;
          return (
            <div key={it.id} className={`xd-row ${side} ${first ? 'first' : ''}`} onClick={tap}>
              <div className="xd-line">
                {side === 'them' && <div className="xd-avslot">{showAv && <Avatar contact={chat.contact} size={30} flat />}</div>}
                <div className={`xd-b ${side} ${last ? 'last' : ''} ${it.kind === 'typing' ? 'typing' : ''}`}>
                  {it.kind === 'typing' ? <Dots color={dark ? '#71767b' : '#536471'} /> : it.text}
                </div>
              </div>
              {last && it.kind === 'msg' && (
                <div className="xd-meta">
                  {to12(it.time)}{i === lastMeIdx && it.status === 'read' ? ' · Seen' : ''}
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
            <span className="xd-ph">Start a message</span>
            <Smile size={20} strokeWidth={2} />
            <SendHorizontal size={20} strokeWidth={2} />
          </span>
        </div>
      )}
    </div>
  );
}
