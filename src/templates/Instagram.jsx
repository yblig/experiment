import { ArrowLeft, Phone, Video, Camera, Mic, Image, Sticker } from 'lucide-react';
import { Avatar, StatusBar, groupInfo, Dots, Content, Reaction, NonBubble, bigEmoji, typeOf, senderOf, Verified , PinBar, Draft, Keyboard , sbAndroid } from './parts.jsx';

const CLS = { time: 'ig-time', system: 'ig-time', unread: 'ig-unread' };

export default function Instagram({ chat, items, byId, onTap }) {
  const dark = chat.dark;
  const g = groupInfo(items, chat.group);
  const lastMeIdx = items.map(x => x.kind === 'msg' && x.from === 'me').lastIndexOf(true);
  const handle = (chat.contact.handle || '').replace(/^@/, '') || (chat.contact.name || 'user').toLowerCase().replace(/\s+/g, '_');
  return (
    <div className={'shot ig ' + (dark ? 'dark' : 'light')} style={{ '--ts': chat.textScale || 1 }}>
      <div className="ig-head">
        {chat.showStatusBar !== false && <StatusBar android={sbAndroid(chat, false)} time={chat.clock} battery={chat.battery} charging={chat.charging} color={dark ? '#fff' : '#000'} />}
        <div className="ig-head-row">
          <ArrowLeft size={26} strokeWidth={2} />
          <div className="ig-avwrap">
            <Avatar contact={chat.contact} size={34} flat />
            {chat.contact.status === 'online' && <i className="ig-online" />}
          </div>
          <div className="ig-who">
            <div className="ig-name">{chat.contact.name || 'Unknown'}{chat.verified && <Verified size={14} color="#0095f6" />}</div>
            <div className="ig-handle">{chat.group ? chat.participants.map(p => p.name).join(', ') : chat.contact.status === 'online' ? 'Active now' : handle}</div>
          </div>
          <Phone size={23} strokeWidth={1.9} />
          <Video size={27} strokeWidth={1.7} />
        </div>
      </div>
      <PinBar chat={chat} />
      <div className="msgs ig-msgs">
        {items.map((it, i) => {
          const tap = () => onTap?.(it._i);
          if (!['msg', 'typing'].includes(it.kind)) return <NonBubble key={it.id} it={it} onTap={tap} cls={CLS} />;
          const side = it.from === 'me' ? 'me' : 'them';
          const { first, last } = g[i];
          const big = it.kind === 'msg' && bigEmoji(it);
          const t = typeOf(it);
          return (
            <div key={it.id} className={`ig-row ${side} ${first ? 'first' : ''} ${last ? 'last' : ''} ${it.reaction ? 'has-react' : ''}`} onClick={tap}>
              {chat.group && side === 'them' && first && <div className="ig-sender">{senderOf(it, chat).name}</div>}
              {it.edited && <div className="ig-edited">Edited</div>}
              <div className="ig-line">
                {side === 'them' && <div className="ig-avslot">{last && <Avatar contact={senderOf(it, chat)} size={28} flat />}</div>}
                <div className={`ig-b ${side} ${first ? 'first' : ''} ${last ? 'last' : ''} ${it.kind === 'typing' ? 'typing' : ''} k-${big ? 'emoji' : t}`} style={big ? { fontSize: 50 - big * 6 } : null}>
                  {it.kind === 'typing' ? <Dots color={dark ? '#a8a8a8' : '#8e8e8e'} /> : <Content it={it} chat={chat} byId={byId} />}
                  <Reaction it={it} />
                </div>
              </div>
              {i === lastMeIdx && it.status === 'read' && <div className="ig-seen">Seen</div>}
            </div>
          );
        })}
      </div>
      {chat.showInput !== false && (
        <div className="ig-input">
          <span className="ig-field">
            <span className="ig-cam"><Camera size={19} strokeWidth={2.2} /></span>
            <span className="ig-ph"><Draft chat={chat} placeholder="Message..." /></span>
            <Mic size={22} strokeWidth={1.8} />
            <Image size={22} strokeWidth={1.8} />
            <Sticker size={22} strokeWidth={1.8} />
          </span>
        </div>
      )}
      <Keyboard chat={chat} />
    </div>
  );
}
