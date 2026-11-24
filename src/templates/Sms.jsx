import { ArrowLeft, Phone, Video, MoreVertical, PlusCircle, Smile, Image, Mic } from 'lucide-react';
import { Avatar, StatusBar, groupInfo, Dots, Content, Reaction, NonBubble, bigEmoji, typeOf, senderOf, Verified, PinBar, Draft, Keyboard , sbAndroid } from './parts.jsx';

const CLS = { time: 'sm-time', system: 'sm-time', unread: 'sm-unread' };
const ST = { sent: 'Terkirim', delivered: 'Terkirim', read: 'Dibaca' };

export default function Sms({ chat, items, byId, onTap }) {
  const dark = chat.dark;
  const g = groupInfo(items, chat.group);
  const lastMeIdx = items.map(x => x.kind === 'msg' && x.from === 'me').lastIndexOf(true);
  return (
    <div className={'shot sm ' + (dark ? 'dark' : 'light')} style={{ '--ts': chat.textScale || 1 }}>
      <div className="sm-head">
        {chat.showStatusBar !== false && <StatusBar android={sbAndroid(chat, true)} time={chat.clock} battery={chat.battery} charging={chat.charging} color={dark ? '#e3e2e6' : '#1b1b1f'} />}
        <div className="sm-head-row">
          <ArrowLeft size={24} strokeWidth={2} />
          <Avatar contact={chat.contact} size={38} flat />
          <div className="sm-who">
            <div className="sm-name">{chat.contact.name || 'Unknown'}{chat.verified && <Verified size={15} color="#4c8df6" />}</div>
            {chat.group && <div className="sm-sub">{chat.participants.map(p => p.name).join(', ')}</div>}
          </div>
          <Phone size={22} strokeWidth={1.9} />
          <Video size={24} strokeWidth={1.8} />
          <MoreVertical size={22} strokeWidth={2} />
        </div>
      </div>
      <PinBar chat={chat} />
      <div className="msgs sm-msgs">
        {items.map((it, i) => {
          const tap = () => onTap?.(it._i);
          if (!['msg', 'typing'].includes(it.kind)) return <NonBubble key={it.id} it={it} onTap={tap} cls={CLS} />;
          const side = it.from === 'me' ? 'me' : 'them';
          const { first, last } = g[i];
          const big = it.kind === 'msg' && bigEmoji(it);
          const t = typeOf(it);
          return (
            <div key={it.id} className={`sm-row ${side} ${first ? 'first' : ''} ${it.reaction ? 'has-react' : ''}`} onClick={tap}>
              {chat.group && side === 'them' && first && <div className="sm-sender">{senderOf(it, chat).name}</div>}
              <div className="sm-line">
                {side === 'them' && <div className="sm-avslot">{last && <Avatar contact={senderOf(it, chat)} size={32} flat />}</div>}
                <div className={`sm-b ${side} ${first ? 'first' : ''} ${last ? 'last' : ''} ${it.kind === 'typing' ? 'typing' : ''} k-${big ? 'emoji' : t}`} style={big ? { fontSize: 50 - big * 6 } : null}>
                  {it.kind === 'typing' ? <Dots color={dark ? '#c4c6d0' : '#74777f'} /> : <Content it={it} chat={chat} byId={byId} />}
                  <Reaction it={it} />
                </div>
              </div>
              {last && it.kind === 'msg' && (
                <div className="sm-meta">{it.time}{it.edited ? ' · Diedit' : ''}{i === lastMeIdx && it.status ? ' · ' + ST[it.status] : ''}</div>
              )}
            </div>
          );
        })}
      </div>
      {chat.showInput !== false && (
        <div className="sm-input">
          <PlusCircle size={26} strokeWidth={1.7} />
          <span className="sm-field">
            <Smile size={22} strokeWidth={1.8} />
            <span className="sm-ph"><Draft chat={chat} placeholder="Pesan teks" /></span>
            <Image size={22} strokeWidth={1.8} />
          </span>
          <span className="sm-mic"><Mic size={22} strokeWidth={2} /></span>
        </div>
      )}
      <Keyboard chat={chat} android />
    </div>
  );
}
