import { ChevronLeft, Search, Phone, Menu, Plus, Camera, Image, Smile, Mic } from 'lucide-react';
import { Avatar, StatusBar, groupInfo, Dots, Content, Reaction, NonBubble, bigEmoji, typeOf, senderOf, Verified, PinBar, Draft, Keyboard, sbAndroid, wallpaperStyle } from './parts.jsx';

const CLS = { time: 'ln-date', system: 'ln-date', unread: 'ln-date' };

export default function Line({ chat, items, byId, onTap }) {
  const dark = chat.dark;
  const g = groupInfo(items, chat.group);
  return (
    <div className={'shot ln ' + (dark ? 'dark' : 'light')} style={{ '--ts': chat.textScale || 1 }}>
      <div className="ln-head">
        {chat.showStatusBar !== false && <StatusBar android={sbAndroid(chat, true)} time={chat.clock} battery={chat.battery} charging={chat.charging} color={dark ? '#fff' : '#111'} />}
        <div className="ln-head-row">
          <ChevronLeft size={30} strokeWidth={2} />
          <div className="ln-name">{chat.contact.name || 'Unknown'}{chat.group ? ` (${chat.participants.length + 1})` : ''}{chat.verified && <Verified size={15} color="#06c755" />}</div>
          <Search size={22} strokeWidth={1.9} />
          <Phone size={21} strokeWidth={1.9} />
          <Menu size={23} strokeWidth={1.9} />
        </div>
      </div>
      <PinBar chat={chat} />
      <div className="msgs ln-msgs" style={wallpaperStyle(chat, null)}>
        {items.map((it, i) => {
          const tap = () => onTap?.(it._i);
          if (!['msg', 'typing'].includes(it.kind)) return <NonBubble key={it.id} it={it} onTap={tap} cls={CLS} />;
          const side = it.from === 'me' ? 'me' : 'them';
          const { first } = g[i];
          const big = it.kind === 'msg' && bigEmoji(it);
          const t = typeOf(it);
          const meta = it.kind === 'msg' && (
            <span className="ln-meta">
              {side === 'me' && it.status === 'read' && <span>Read</span>}
              {it.edited && <span>Edited</span>}
              <span>{it.time}</span>
            </span>
          );
          return (
            <div key={it.id} className={`ln-row ${side} ${first ? 'first' : ''} ${it.reaction ? 'has-react' : ''}`} onClick={tap}>
              {side === 'them' && <div className="ln-avslot">{first && <Avatar contact={senderOf(it, chat)} size={38} flat />}</div>}
              <div className="ln-col">
                {side === 'them' && first && <div className="ln-sender">{senderOf(it, chat).name}</div>}
                <div className="ln-line">
                  {side === 'me' && meta}
                  <div className={`ln-b ${side} ${first ? 'tail' : ''} ${it.kind === 'typing' ? 'typing' : ''} k-${big ? 'emoji' : t}`} style={big ? { fontSize: 50 - big * 6 } : null}>
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
        <div className="ln-input">
          <Plus size={26} strokeWidth={1.8} />
          <Camera size={24} strokeWidth={1.8} />
          <Image size={24} strokeWidth={1.8} />
          <span className="ln-field"><span className="ln-ph"><Draft chat={chat} placeholder="Aa" /></span><Smile size={21} strokeWidth={1.8} /></span>
          <Mic size={24} strokeWidth={1.8} />
        </div>
      )}
      <Keyboard chat={chat} android />
    </div>
  );
}
