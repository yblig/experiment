import { ArrowLeft, Phone, Video, PlusCircle, Camera, Image, Mic, Smile, ThumbsUp } from 'lucide-react';
import { Avatar, StatusBar, groupInfo, Dots, Content, Reaction, NonBubble, bigEmoji, typeOf, senderOf, Verified, PinBar, Draft, Keyboard, sbAndroid , tx, labels } from './parts.jsx';

const CLS = { time: 'ms-time', system: 'ms-time', unread: 'ms-time' };

export default function Messenger({ chat, items, byId, onTap }) {
  const dark = chat.dark;
  const g = groupInfo(items, chat.group);
  const lastMeIdx = items.map(x => x.kind === 'msg' && x.from === 'me').lastIndexOf(true);
  const online = chat.contact.status === 'online';
  return (
    <div className={'shot ms ' + (dark ? 'dark' : 'light')} style={{ '--ts': chat.textScale || 1 }}>
      <div className="ms-head">
        {chat.showStatusBar !== false && <StatusBar cfg={chat} android={sbAndroid(chat, false)} time={chat.clock} battery={chat.battery} charging={chat.charging} color={dark ? '#fff' : '#000'} />}
        <div className="ms-head-row">
          <ArrowLeft size={25} strokeWidth={2.2} className="ms-blue" />
          <div className="ms-avwrap"><Avatar contact={chat.contact} size={38} flat />{online && <i className="ms-dot" />}</div>
          <div className="ms-who">
            <div className="ms-name">{chat.contact.name || 'Unknown'}{chat.verified && <Verified size={14} color="#0a7cff" />}</div>
            <div className="ms-sub">{chat.group ? chat.participants.map(p => p.name).join(', ') : online ? tx(chat).activeNow : chat.contact.status}</div>
          </div>
          <Phone size={23} className="ms-blue" fill="currentColor" strokeWidth={0} />
          <Video size={27} className="ms-blue" fill="currentColor" strokeWidth={0} />
        </div>
      </div>
      <PinBar chat={chat} />
      <div className="msgs ms-msgs">
        {items.map((it, i) => {
          const tap = () => onTap?.(it._i);
          if (!['msg', 'typing'].includes(it.kind)) return <NonBubble key={it.id} it={it} onTap={tap} cls={CLS} chat={chat} />;
          const side = it.from === 'me' ? 'me' : 'them';
          const { first, last } = g[i];
          const big = it.kind === 'msg' && bigEmoji(it);
          const t = typeOf(it);
          return (
            <div key={it.id} className={`ms-row ${side} ${first ? 'first' : ''} ${it.reaction ? 'has-react' : ''}`} onClick={tap}>
              {chat.group && side === 'them' && first && <div className="ms-sender">{senderOf(it, chat).name}</div>}
              {it.edited && <div className="ms-edited">{labels(chat).edited}</div>}
              <div className="ms-line">
                {side === 'them' && <div className="ms-avslot">{last && <Avatar contact={senderOf(it, chat)} size={28} flat />}</div>}
                <div className={`ms-b ${side} ${first ? 'first' : ''} ${last ? 'last' : ''} ${it.kind === 'typing' ? 'typing' : ''} k-${big ? 'emoji' : t}`} style={big ? { fontSize: 50 - big * 6 } : null}>
                  {it.kind === 'typing' ? <Dots color={dark ? '#b0b3b8' : '#8a8d91'} /> : <Content it={it} chat={chat} byId={byId} />}
                  <Reaction it={it} />
                </div>
              </div>
              {i === lastMeIdx && it.status === 'read' && <div className="ms-seen"><Avatar contact={chat.contact} size={14} flat /></div>}
              {i === lastMeIdx && it.status === 'delivered' && <div className="ms-seen txt">{tx(chat).delivered}</div>}
            </div>
          );
        })}
      </div>
      {chat.showInput !== false && (
        <div className="ms-input ms-blue">
          <PlusCircle size={25} fill="currentColor" stroke={dark ? '#000' : '#fff'} strokeWidth={2} />
          <Camera size={25} strokeWidth={2} />
          <Image size={25} strokeWidth={2} />
          <Mic size={25} strokeWidth={2} />
          <span className="ms-field"><span className="ms-ph"><Draft chat={chat} placeholder="Aa" /></span><Smile size={22} strokeWidth={2} /></span>
          <ThumbsUp size={25} fill="currentColor" strokeWidth={0} />
        </div>
      )}
      <Keyboard chat={chat} />
    </div>
  );
}
