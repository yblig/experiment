import { ChevronLeft, ChevronRight, Video, Plus, Mic } from 'lucide-react';
import { Avatar, StatusBar, groupInfo, Dots } from './parts.jsx';

export default function IMessage({ chat, items, onTap }) {
  const dark = chat.dark;
  const g = groupInfo(items);
  const lastMeIdx = items.map(x => x.kind === 'msg' && x.from === 'me').lastIndexOf(true);
  const st = { '--me': chat.meColor || '#0a84ff' };
  return (
    <div className={'shot im ' + (dark ? 'dark' : 'light')} style={st}>
      <div className="im-head">
        {chat.showStatusBar !== false && <StatusBar time={chat.clock} battery={chat.battery} color={dark ? '#fff' : '#000'} />}
        <div className="im-head-row">
          <div className="im-back">
            <ChevronLeft size={34} strokeWidth={2.4} />
            {chat.contact.unread ? <span className="im-badge">{chat.contact.unread}</span> : null}
          </div>
          <div className="im-contact">
            <Avatar contact={chat.contact} size={52} />
            <div className="im-name">{chat.contact.name || 'Unknown'}<ChevronRight size={12} strokeWidth={3} /></div>
          </div>
          <Video className="im-video" size={30} strokeWidth={1.8} />
        </div>
      </div>
      <div className="msgs im-msgs">
        {items.map((it, i) => {
          const tap = () => onTap?.(it._i);
          if (it.kind === 'time') return <div key={it.id} className="im-time" onClick={tap}>{it.text}</div>;
          const side = it.from === 'me' ? 'me' : 'them';
          const cls = `im-row ${side} ${g[i].first ? 'first' : ''}`;
          if (it.kind === 'typing') {
            return (
              <div key={it.id} className={cls} onClick={tap}>
                <div className={`im-b ${side} typing tail`}><Dots color={dark ? '#8d8d93' : '#8e8e93'} /></div>
              </div>
            );
          }
          return (
            <div key={it.id} className={cls} onClick={tap}>
              <div className={`im-b ${side} ${g[i].last ? 'tail' : ''}`}>{it.text}</div>
              {i === lastMeIdx && it.status && it.status !== 'sent' && (
                <div className="im-status">{it.status === 'read' ? 'Read' : 'Delivered'}</div>
              )}
            </div>
          );
        })}
      </div>
      {chat.showInput !== false && (
        <div className="im-input">
          <span className="im-plus"><Plus size={22} strokeWidth={2.2} /></span>
          <span className="im-field">iMessage<Mic size={19} strokeWidth={2} /></span>
        </div>
      )}
    </div>
  );
}
