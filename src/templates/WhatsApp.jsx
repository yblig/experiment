import { ArrowLeft, ChevronLeft, Video, Phone, MoreVertical, Smile, Paperclip, Camera, Mic, Plus, StickyNote } from 'lucide-react';
import { Avatar, StatusBar, groupInfo, Ticks, Content, Reaction, NonBubble, bigEmoji, typeOf, Verified, wallpaperStyle , PinBar, Draft, Keyboard , sbAndroid } from './parts.jsx';

// Original doodle wallpaper (drawn for this app), tiled behind the messages.
const doodle = c => `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='none' stroke='${c}' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'>
  <circle cx='22' cy='24' r='9'/><path d='M18 23h.01M26 23h.01M18 28q4 3 8 0'/>
  <path d='M70 14l4 8 9 1-6.5 6 1.6 9-8.1-4.3-8.1 4.3 1.6-9-6.5-6 9-1z'/>
  <path d='M120 18h22v15h-14l-6 5v-5h-2z'/>
  <path d='M16 78c0-8 12-8 12 0 0-8 12-8 12 0 0 7-12 14-12 14S16 85 16 78z'/>
  <rect x='64' y='68' width='22' height='16' rx='3'/><circle cx='75' cy='76' r='4.5'/>
  <path d='M118 90V70l18-4v20'/><circle cx='114' cy='90' r='4'/><circle cx='132' cy='86' r='4'/>
  <path d='M14 132c8-10 18-10 26 0M18 140h18'/>
  <path d='M70 124l14 14M84 124l-14 14'/>
  <circle cx='128' cy='130' r='12'/><path d='M128 122v8l5 4'/>
  </g></svg>`)}")`;

const CLS = { time: 'wa-date', system: 'wa-date sys', unread: 'wa-unread' };

export default function WhatsApp({ chat, items, byId, onTap }) {
  const dark = chat.dark;
  const ios = chat.waStyle === 'ios';
  const g = groupInfo(items, chat.group);
  const last = items[items.length - 1];
  const typing = last?.kind === 'typing' && last.from !== 'me';
  const shown = typing && !chat.group ? items.slice(0, -1) : items;
  const tickGrey = dark ? 'rgba(233,237,239,.6)' : '#8696a0';
  const sub = typing && !chat.group ? 'mengetik...' : chat.group && typing
    ? `${(chat.participants.find(p => p.id === last.sender) || chat.participants[0] || {}).name || ''} mengetik...`
    : chat.group ? chat.contact.status || chat.participants.map(p => p.name).concat('Anda').join(', ') : chat.contact.status;
  const shownItems = chat.group && typing ? items.slice(0, -1) : shown;
  const bg = wallpaperStyle(chat, { backgroundImage: doodle(dark ? 'rgba(255,255,255,.045)' : 'rgba(84,101,111,.09)'), backgroundSize: '160px 160px' });
  return (
    <div className={'shot wa ' + (dark ? 'dark' : 'light') + (ios ? ' ios' : '')} style={{ '--ts': chat.textScale || 1 }}>
      {ios ? (
        <div className="wa-head ios">
          {chat.showStatusBar !== false && <StatusBar android={sbAndroid(chat, false)} time={chat.clock} battery={chat.battery} charging={chat.charging} color={dark ? '#fff' : '#000'} />}
          <div className="wa-head-row">
            <span className="wa-iback"><ChevronLeft size={32} strokeWidth={2.2} />{chat.contact.unread ? <b>{chat.contact.unread}</b> : null}</span>
            <Avatar contact={chat.contact} size={40} personIcon={chat.contact.avatar ? null : { bg: dark ? '#6a7175' : '#dfe5e7', fg: dark ? '#cfd4d6' : '#fff' }} />
            <div className="wa-who">
              <div className="wa-name">{chat.contact.name || 'Unknown'}{chat.verified && <Verified size={15} color="#25d366" />}</div>
              {sub && <div className="wa-sub">{sub}</div>}
            </div>
            <Video size={27} strokeWidth={1.7} />
            <Phone size={22} strokeWidth={1.8} />
          </div>
        </div>
      ) : (
      <div className="wa-head">
        {chat.showStatusBar !== false && <StatusBar android={sbAndroid(chat, true)} time={chat.clock} battery={chat.battery} charging={chat.charging} color="#fff" />}
        <div className="wa-head-row">
          <ArrowLeft size={24} strokeWidth={2.2} />
          <Avatar contact={chat.contact} size={40} personIcon={chat.contact.avatar ? null : { bg: dark ? '#6a7175' : '#dfe5e7', fg: dark ? '#cfd4d6' : '#fff' }} />
          <div className="wa-who">
            <div className="wa-name">{chat.contact.name || 'Unknown'}{chat.verified && <Verified size={15} color="#25d366" />}</div>
            {sub && <div className="wa-sub">{sub}</div>}
          </div>
          <Video size={24} strokeWidth={2} />
          <Phone size={21} strokeWidth={2} />
          <MoreVertical size={22} strokeWidth={2.2} />
        </div>
      </div>
      )}
      <PinBar chat={chat} />
      <div className="msgs wa-msgs" style={bg}>
        {shownItems.map((it, i) => {
          const tap = () => onTap?.(it._i);
          if (!['msg', 'typing'].includes(it.kind)) return <NonBubble key={it.id} it={it} onTap={tap} cls={CLS} />;
          const side = it.from === 'me' ? 'me' : 'them';
          const first = ios ? g[i].last : g[i].first;
          if (it.kind === 'typing') {
            return (
              <div key={it.id} className={`wa-row ${side} ${first ? 'first' : ''}`} onClick={tap}>
                <div className={`wa-b ${side} ${first ? 'tail' : ''}`}><span className="wa-typing">mengetik...</span></div>
              </div>
            );
          }
          const t = typeOf(it);
          const big = bigEmoji(it);
          const meta = (
            <>
              {it.edited && <span className="wa-ed">Diedit</span>}
              {it.time}
              {side === 'me' && t !== 'deleted' && <Ticks status={it.status || 'sent'} color={it.status === 'read' ? '#53bdeb' : tickGrey} />}
            </>
          );
          return (
            <div key={it.id} className={`wa-row ${side} ${first ? 'first' : ''} ${it.reaction ? 'has-react' : ''}`} onClick={tap}>
              <div className={`wa-b ${side} k-${big ? 'emoji' : t} ${first && !big ? 'tail' : ''}`} style={big ? { fontSize: 50 - big * 6 } : null}>
                {first && !big && (
                  ios ? (
                    <svg className="wa-tailsvg bottom" width="12" height="16" viewBox="0 0 12 16">
                      {side === 'me' ? <path d="M0 0c0 7 1.5 11.6 11.2 15.4.5.2.4.6-.1.6C6 16 2 14.5 0 12z" /> : <path d="M12 0c0 7-1.5 11.6-11.2 15.4-.5.2-.4.6.1.6C6 16 10 14.5 12 12z" />}
                    </svg>
                  ) : (
                  <svg className="wa-tailsvg" width="8" height="13" viewBox="0 0 8 13">
                    {side === 'me' ? <path d="M0 0h6.4c1.2 0 1.9 1.4 1.1 2.4L0 13z" /> : <path d="M8 0H1.6C.4 0-.3 1.4.5 2.4L8 13z" />}
                  </svg>
                  )
                )}
                <Content it={it} chat={chat} byId={byId} showName={chat.group && side === 'them' && g[i].first} />
                {t !== 'call' && <span className="wa-meta-space">{meta}</span>}
                <span className="wa-meta">{meta}</span>
                <Reaction it={it} />
              </div>
            </div>
          );
        })}
      </div>
      {chat.showInput !== false && ios && (
        <div className="wa-input ios">
          <Plus size={28} strokeWidth={1.7} />
          <span className="wa-field"><span className="wa-ph"><Draft chat={chat} placeholder="" /></span><StickyNote size={22} strokeWidth={1.7} /></span>
          <Camera size={26} strokeWidth={1.7} />
          <Mic size={25} strokeWidth={1.7} />
        </div>
      )}
      {chat.showInput !== false && !ios && (
        <div className="wa-input">
          <span className="wa-field">
            <Smile size={23} strokeWidth={1.8} />
            <span className="wa-ph"><Draft chat={chat} placeholder="Ketik pesan" /></span>
            <Paperclip size={21} strokeWidth={1.8} />
            <Camera size={22} strokeWidth={1.8} />
          </span>
          <span className="wa-mic"><Mic size={22} strokeWidth={2} /></span>
        </div>
      )}
      <Keyboard chat={chat} android={!ios} />
    </div>
  );
}
