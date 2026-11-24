import { ArrowLeft, Video, Phone, MoreVertical, Smile, Paperclip, Camera, Mic } from 'lucide-react';
import { Avatar, StatusBar, groupInfo, Ticks } from './parts.jsx';

// Original doodle wallpaper (drawn for this app), tiled behind the messages.
const doodle = (c) => `url("data:image/svg+xml,${encodeURIComponent(
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

export default function WhatsApp({ chat, items, onTap }) {
  const dark = chat.dark;
  const g = groupInfo(items);
  const last = items[items.length - 1];
  const typing = last?.kind === 'typing' && last.from !== 'me';
  const shown = typing ? items.slice(0, -1) : items;
  const headTxt = '#fff';
  const tickGrey = dark ? 'rgba(233,237,239,.6)' : '#8696a0';
  return (
    <div className={'shot wa ' + (dark ? 'dark' : 'light')}>
      <div className="wa-head">
        {chat.showStatusBar !== false && <StatusBar time={chat.clock} battery={chat.battery} color={headTxt} android />}
        <div className="wa-head-row">
          <ArrowLeft size={24} strokeWidth={2.2} />
          <Avatar contact={chat.contact} size={40} personIcon={{ bg: dark ? '#6a7175' : '#dfe5e7', fg: dark ? '#cfd4d6' : '#fff' }} />
          <div className="wa-who">
            <div className="wa-name">{chat.contact.name || 'Unknown'}</div>
            {(typing || chat.contact.status) && <div className="wa-sub">{typing ? 'mengetik...' : chat.contact.status}</div>}
          </div>
          <Video size={24} strokeWidth={2} />
          <Phone size={21} strokeWidth={2} />
          <MoreVertical size={22} strokeWidth={2.2} />
        </div>
      </div>
      <div className="msgs wa-msgs" style={{ backgroundImage: doodle(dark ? 'rgba(255,255,255,.045)' : 'rgba(84,101,111,.09)') }}>
        {shown.map((it, i) => {
          const tap = () => onTap?.(it._i);
          if (it.kind === 'time') return <div key={it.id} className="wa-date" onClick={tap}><span>{it.text}</span></div>;
          if (it.kind === 'typing') {
            const side = it.from === 'me' ? 'me' : 'them';
            return (
              <div key={it.id} className={`wa-row ${side} ${g[i].first ? 'first' : ''}`} onClick={tap}>
                <div className={`wa-b ${side} ${g[i].first ? 'tail' : ''}`}><span className="wa-typing">mengetik...</span></div>
              </div>
            );
          }
          const side = it.from === 'me' ? 'me' : 'them';
          const meta = (
            <>
              {it.time}
              {side === 'me' && <Ticks status={it.status || 'sent'} color={it.status === 'read' ? '#53bdeb' : tickGrey} />}
            </>
          );
          return (
            <div key={it.id} className={`wa-row ${side} ${g[i].first ? 'first' : ''}`} onClick={tap}>
              <div className={`wa-b ${side} ${g[i].first ? 'tail' : ''}`}>
                {g[i].first && (
                  <svg className="wa-tailsvg" width="8" height="13" viewBox="0 0 8 13">
                    {side === 'me'
                      ? <path d="M0 0h6.4c1.2 0 1.9 1.4 1.1 2.4L0 13z" />
                      : <path d="M8 0H1.6C.4 0-.3 1.4.5 2.4L8 13z" />}
                  </svg>
                )}
                <span className="wa-text">{it.text}</span>
                <span className="wa-meta-space">{meta}</span>
                <span className="wa-meta">{meta}</span>
              </div>
            </div>
          );
        })}
      </div>
      {chat.showInput !== false && (
        <div className="wa-input">
          <span className="wa-field">
            <Smile size={23} strokeWidth={1.8} />
            <span className="wa-ph">Ketik pesan</span>
            <Paperclip size={21} strokeWidth={1.8} />
            <Camera size={22} strokeWidth={1.8} />
          </span>
          <span className="wa-mic"><Mic size={22} strokeWidth={2} /></span>
        </div>
      )}
    </div>
  );
}
