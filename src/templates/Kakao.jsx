import { ChevronLeft, Search, Menu, Plus, Smile, Hash } from 'lucide-react';
import { Avatar, StatusBar, groupInfo, Dots, Content, Reaction, NonBubble, bigEmoji, typeOf, senderOf, Verified, PinBar, Draft, Keyboard, sbAndroid, wallpaperStyle , tx, labels , fmtTime } from './parts.jsx';

const CLS = { time: 'kk-date', system: 'kk-date', unread: 'kk-date' };

export default function Kakao({ chat, items, byId, onTap }) {
  const dark = chat.dark;
  const g = groupInfo(items, chat.group);
  return (
    <div className={'shot kk ' + (dark ? 'dark' : 'light')} style={{ '--ts': chat.textScale || 1, ...wallpaperStyle(chat, {}) }}>
      <div className="kk-head">
        {chat.showStatusBar !== false && <StatusBar cfg={chat} android={sbAndroid(chat, true)} time={chat.clock} battery={chat.battery} charging={chat.charging} color={dark ? '#fff' : '#000'} />}
        <div className="kk-head-row">
          <ChevronLeft size={30} strokeWidth={2} />
          <div className="kk-name">{chat.contact.name || 'Unknown'}{chat.group && <small>{chat.participants.length + 1}</small>}{chat.verified && <Verified size={15} color="#3c1e1e" check="#fee500" />}</div>
          <Search size={23} strokeWidth={1.8} />
          <Menu size={24} strokeWidth={1.8} />
        </div>
      </div>
      <PinBar chat={chat} />
      <div className="msgs kk-msgs">
        {items.map((it, i) => {
          const tap = () => onTap?.(it._i);
          if (!['msg', 'typing'].includes(it.kind)) return <NonBubble key={it.id} it={it} onTap={tap} cls={CLS} chat={chat} />;
          const side = it.from === 'me' ? 'me' : 'them';
          const { first, last } = g[i];
          const big = it.kind === 'msg' && bigEmoji(it);
          const t = typeOf(it);
          const meta = it.kind === 'msg' && last && (
            <span className="kk-meta">
              {side === 'me' && it.status !== 'read' && <b>1</b>}
              {it.edited && <span>{labels(chat).edited}</span>}
              <span>{fmtTime(it.time, chat)}</span>
            </span>
          );
          return (
            <div key={it.id} className={`kk-row ${side} ${first ? 'first' : ''} ${it.reaction ? 'has-react' : ''}`} onClick={tap}>
              {side === 'them' && <div className="kk-avslot">{first && <Avatar contact={senderOf(it, chat)} size={40} flat />}</div>}
              <div className="kk-col">
                {side === 'them' && first && <div className="kk-sender">{senderOf(it, chat).name}</div>}
                <div className="kk-line">
                  {side === 'me' && meta}
                  <div className={`kk-b ${side} ${first ? 'tail' : ''} ${it.kind === 'typing' ? 'typing' : ''} k-${big ? 'emoji' : t}`} style={big ? { fontSize: 50 - big * 6 } : null}>
                    {it.kind === 'typing' ? <Dots color="#9aa3ad" /> : <Content it={it} chat={chat} byId={byId} />}
                    <Reaction it={it} />
                  </div>
                  {side === 'them' && meta}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {chat.showInput !== false && (
        <div className="kk-input">
          <Plus size={26} strokeWidth={1.8} />
          <span className="kk-field"><span className="kk-ph"><Draft chat={chat} placeholder="" /></span><Smile size={22} strokeWidth={1.8} /></span>
          <span className="kk-send"><Hash size={20} strokeWidth={2.2} /></span>
        </div>
      )}
      <Keyboard chat={chat} android />
    </div>
  );
}
