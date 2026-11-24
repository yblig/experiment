import { ChevronLeft, ChevronRight, Video, Plus, Mic } from 'lucide-react';
import { Avatar, StatusBar, groupInfo, Dots, Content, Reaction, NonBubble, bigEmoji, typeOf, senderOf, Verified , PinBar, Draft, Keyboard } from './parts.jsx';

const CLS = { time: 'im-time', system: 'im-time', unread: 'im-unread' };

export default function IMessage({ chat, items, byId, onTap }) {
  const dark = chat.dark;
  const g = groupInfo(items, chat.group);
  const lastMeIdx = items.map(x => x.kind === 'msg' && x.from === 'me').lastIndexOf(true);
  return (
    <div className={'shot im ' + (dark ? 'dark' : 'light')} style={{ '--me': chat.meColor || '#0a84ff', '--ts': chat.textScale || 1 }}>
      <div className="im-head">
        {chat.showStatusBar !== false && <StatusBar time={chat.clock} battery={chat.battery} charging={chat.charging} color={dark ? '#fff' : '#000'} />}
        <div className="im-head-row">
          <div className="im-back">
            <ChevronLeft size={34} strokeWidth={2.4} />
            {chat.contact.unread ? <span className="im-badge">{chat.contact.unread}</span> : null}
          </div>
          <div className="im-contact">
            {chat.group && !chat.contact.avatar ? (
              <div className="im-stack">
                {chat.participants.slice(0, 3).map((p, i) => <Avatar key={p.id} contact={p} size={i === 0 ? 40 : 30} flat />)}
              </div>
            ) : <Avatar contact={chat.contact} size={52} />}
            <div className="im-name">
              {chat.contact.name || 'Unknown'}
              {chat.verified && <Verified size={12} color="#0a84ff" />}
              <ChevronRight size={12} strokeWidth={3} />
            </div>
          </div>
          <Video className="im-video" size={30} strokeWidth={1.8} />
        </div>
      </div>
      <PinBar chat={chat} />
      <div className="msgs im-msgs">
        {items.map((it, i) => {
          const tap = () => onTap?.(it._i);
          if (!['msg', 'typing'].includes(it.kind)) return <NonBubble key={it.id} it={it} onTap={tap} cls={CLS} />;
          const side = it.from === 'me' ? 'me' : 'them';
          const groupThem = chat.group && side === 'them';
          const cls = `im-row ${side} ${g[i].first ? 'first' : ''} ${it.reaction ? 'has-react' : ''}`;
          const av = groupThem && <div className="im-avslot">{g[i].last && <Avatar contact={senderOf(it, chat)} size={28} flat />}</div>;
          if (it.kind === 'typing') {
            return (
              <div key={it.id} className={cls} onClick={tap}>
                <div className="im-line">{av}<div className={`im-b ${side} typing tail`}><Dots color={dark ? '#8d8d93' : '#8e8e93'} /></div></div>
              </div>
            );
          }
          const big = bigEmoji(it);
          const t = typeOf(it);
          const kind = big ? 'emoji' : t === 'image' && !it.text ? 'photo' : t;
          return (
            <div key={it.id} className={cls} onClick={tap}>
              {groupThem && g[i].first && <div className="im-sender">{senderOf(it, chat).name}</div>}
              <div className="im-line">
                {av}
                <div className={`im-b ${side} k-${kind} ${g[i].last && !big && kind !== 'photo' ? 'tail' : ''}`} style={big ? { fontSize: 50 - big * 6 } : null}>
                  <Content it={it} chat={chat} byId={byId} />
                  <Reaction it={it} />
                </div>
              </div>
              {it.edited && <div className={'im-edited ' + side}>Edited</div>}
              {i === lastMeIdx && it.status && it.status !== 'sent' && <div className="im-status">{it.status === 'read' ? 'Read' : 'Delivered'}</div>}
            </div>
          );
        })}
      </div>
      {chat.showInput !== false && (
        <div className="im-input">
          <span className="im-plus"><Plus size={22} strokeWidth={2.2} /></span>
          <span className="im-field"><Draft chat={chat} placeholder="iMessage" /><Mic size={19} strokeWidth={2} /></span>
        </div>
      )}
      <Keyboard chat={chat} />
    </div>
  );
}
