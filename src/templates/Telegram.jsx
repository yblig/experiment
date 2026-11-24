import { ArrowLeft, MoreVertical, Smile, Paperclip, Mic, Phone } from 'lucide-react';
import { Avatar, StatusBar, groupInfo, Ticks, Content, Reaction, NonBubble, bigEmoji, typeOf, senderOf, Verified, wallpaperStyle , PinBar, Draft, Keyboard , sbAndroid } from './parts.jsx';

// Original wallpaper: soft gradient with a faint scattered-shape pattern.
const pattern = c => `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'><g fill='none' stroke='${c}' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'>
  <path d='M20 30l10-6 10 6v12l-10 6-10-6z'/><circle cx='95' cy='26' r='8'/><path d='M140 20l14 14M154 20l-14 14'/>
  <path d='M30 100q10-14 20 0t20 0'/><path d='M110 90l8 16h-16z'/><circle cx='160' cy='100' r='5'/>
  <path d='M20 150h24M32 138v24'/><rect x='84' y='140' width='20' height='20' rx='5'/><path d='M140 150c0-8 14-8 14 0s-14 8-14 0'/>
  </g></svg>`)}")`;

const CLS = { time: 'tg-date', system: 'tg-date', unread: 'tg-unread' };

export default function Telegram({ chat, items, byId, onTap }) {
  const dark = chat.dark;
  const g = groupInfo(items, chat.group);
  const last = items[items.length - 1];
  const typing = last?.kind === 'typing' && last.from !== 'me';
  const shown = typing ? items.slice(0, -1) : items;
  const sub = typing
    ? (chat.group ? `${senderOf(last, chat).name} sedang mengetik…` : 'sedang mengetik…')
    : chat.group ? `${chat.participants.length + 1} anggota` : chat.contact.status || 'terakhir dilihat baru saja';
  const fallback = dark
    ? { backgroundColor: '#0e1621', backgroundImage: pattern('rgba(255,255,255,.04)'), backgroundSize: '180px 180px' }
    : { backgroundImage: `${pattern('rgba(40,80,40,.10)')}, linear-gradient(160deg,#d7e6b5 0%,#a8cba0 45%,#c7dca8 100%)`, backgroundSize: '180px 180px, cover' };
  const check = dark ? '#6ab3f3' : '#4fae4e';
  return (
    <div className={'shot tg ' + (dark ? 'dark' : 'light')} style={{ '--ts': chat.textScale || 1 }}>
      <div className="tg-head">
        {chat.showStatusBar !== false && <StatusBar android={sbAndroid(chat, true)} time={chat.clock} battery={chat.battery} charging={chat.charging} color="#fff" />}
        <div className="tg-head-row">
          <ArrowLeft size={24} strokeWidth={2.2} />
          <Avatar contact={chat.contact} size={42} flat color="#5fa8d3" />
          <div className="tg-who">
            <div className="tg-name">{chat.contact.name || 'Unknown'}{chat.verified && <Verified size={16} color="#fff" check={dark ? '#212d3b' : '#517da2'} />}</div>
            <div className={'tg-sub' + (typing || chat.contact.status === 'online' ? ' on' : '')}>{sub}</div>
          </div>
          <Phone size={21} strokeWidth={2} />
          <MoreVertical size={22} strokeWidth={2.2} />
        </div>
      </div>
      <PinBar chat={chat} />
      <div className="msgs tg-msgs" style={wallpaperStyle(chat, fallback)}>
        {shown.map((it, i) => {
          const tap = () => onTap?.(it._i);
          if (it.kind !== 'msg') return it.kind === 'typing' ? null : <NonBubble key={it.id} it={it} onTap={tap} cls={CLS} />;
          const side = it.from === 'me' ? 'me' : 'them';
          const { first, last: lst } = g[i];
          const big = bigEmoji(it);
          const t = typeOf(it);
          const groupThem = chat.group && side === 'them';
          const meta = (
            <>
              {it.edited && <span>diedit </span>}
              {it.time}
              {side === 'me' && <Ticks status={it.status === 'read' ? 'read' : 'sent'} color={check} />}
            </>
          );
          return (
            <div key={it.id} className={`tg-row ${side} ${first ? 'first' : ''} ${it.reaction ? 'has-react' : ''}`} onClick={tap}>
              {groupThem && <div className="tg-avslot">{lst && <Avatar contact={senderOf(it, chat)} size={34} flat />}</div>}
              <div className={`tg-b ${side} k-${big ? 'emoji' : t} ${lst && !big ? 'tail' : ''}`} style={big ? { fontSize: 50 - big * 6 } : null}>
                {lst && !big && (
                  <svg className="tg-tailsvg" width="9" height="16" viewBox="0 0 9 16">
                    {side === 'me' ? <path d="M0 0v16h8c1 0 1.3-1.2.6-1.8C4 10 1.2 5 0 0z" /> : <path d="M9 0v16H1c-1 0-1.3-1.2-.6-1.8C5 10 7.8 5 9 0z" />}
                  </svg>
                )}
                <Content it={it} chat={chat} byId={byId} showName={groupThem && first} />
                {t !== 'call' && <span className="wa-meta-space">{meta}</span>}
                <span className="tg-meta">{meta}</span>
                <Reaction it={it} />
              </div>
            </div>
          );
        })}
      </div>
      {chat.showInput !== false && (
        <div className="tg-input">
          <Smile size={24} strokeWidth={1.8} />
          <span className="tg-ph"><Draft chat={chat} placeholder="Pesan" /></span>
          <Paperclip size={22} strokeWidth={1.8} />
          <Mic size={23} strokeWidth={1.8} />
        </div>
      )}
      <Keyboard chat={chat} android />
    </div>
  );
}
