// Lock screen: big clock + date, incoming messages stacked as notifications (newest on top).
import { MessageCircle, Flashlight, Camera } from 'lucide-react';
import { StatusBar, senderOf, quoteText, typeOf } from './parts.jsx';
import { mediaUrl } from '../media.js';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function ago(clock, t) {
  const toMin = s => { const [h, m] = (s || '0:0').split(':').map(Number); return h * 60 + m; };
  const d = (toMin(clock) - toMin(t) + 1440) % 1440;
  if (d === 0) return 'sekarang';
  if (d < 60) return `${d} mnt lalu`;
  return t;
}

export default function Lock({ chat, items, onTap }) {
  const dark = chat.dark;
  const d = new Date();
  const date = `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const notes = items.filter(it => it.kind === 'msg' && it.from !== 'me').reverse();
  const w = chat.wallpaper || {};
  const bg = w.type === 'image' && w.value
    ? { backgroundImage: `linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.35)), url("${mediaUrl(w.value)}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : w.type === 'color' && w.value ? { background: w.value }
      : dark ? { background: 'radial-gradient(120% 80% at 20% 10%, #4b3ca8 0%, #1d1a3d 45%, #07070f 100%)' }
        : { background: 'radial-gradient(120% 80% at 20% 10%, #ffd2a8 0%, #f39ab9 45%, #8c79e8 100%)' };
  const appName = chat.lockApp || 'Pesan';
  return (
    <div className="shot lk" style={{ ...bg, '--ts': chat.textScale || 1 }}>
      {chat.showStatusBar !== false && <StatusBar time="" battery={chat.battery} charging={chat.charging} color="#fff" />}
      <div className="lk-date">{date}</div>
      <div className="lk-clock">{(chat.clock || '00:00').replace(':', '.')}</div>
      <div className="msgs lk-list">
        {notes.length === 0 && <div className="lk-empty">Tidak ada notifikasi</div>}
        {notes.slice(0, 7).map(it => {
          const snd = senderOf(it, chat);
          const title = chat.group ? `${snd.name} · ${chat.contact.name}` : chat.contact.name || 'Unknown';
          return (
            <div key={it.id} className="lk-n" onClick={() => onTap?.(it._i)}>
              <span className="lk-ic" style={{ background: chat.lockColor || '#34c759' }}><MessageCircle size={20} fill="#fff" strokeWidth={0} /></span>
              <span className="lk-tx">
                <span className="lk-top"><b>{title}</b><small>{ago(chat.clock, it.time)}</small></span>
                <span className="lk-msg">{typeOf(it) === 'text' ? it.text : quoteText(it, 'lock')}</span>
                <span className="lk-app">{appName}</span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="lk-bottom">
        <span className="lk-btn"><Flashlight size={22} /></span>
        <span className="lk-bar" />
        <span className="lk-btn"><Camera size={22} /></span>
      </div>
    </div>
  );
}
