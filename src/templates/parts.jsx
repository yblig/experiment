// Shared pieces for the phone-screen templates.
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing, Ban, Play, Mic, Pin, MessageCircle, Delete, ArrowBigUp, CornerDownLeft, Forward, Star, FileText } from 'lucide-react';
import { mediaUrl } from '../media.js';

// ---- in-chat language (Indonesia / English) ----
const EN_BASE = { callBack: 'Tap to call back', mins: '2 min', deleted: 'You unsent a message', deletedThem: 'This message was unsent', edited: 'Edited', you: 'You', voice: 'Voice call', video: 'Video call', missed: 'Missed voice call', missedVideo: 'Missed video call', unread: 'Unread messages', photo: 'Photo', vn: 'Voice message' };
const ID_BASE = { callBack: 'Ketuk untuk menelepon balik', mins: '2 menit', deleted: 'Anda menghapus pesan ini', deletedThem: 'Pesan ini telah dihapus', edited: 'Diedit', you: 'Anda', voice: 'Panggilan suara', video: 'Panggilan video', missed: 'Panggilan suara tak terjawab', missedVideo: 'Panggilan video tak terjawab', unread: 'Pesan belum dibaca', photo: 'Foto', vn: 'Pesan suara' };
const EN_TPL = {
  imessage: { voice: 'Voice Call', video: 'FaceTime Video', missed: 'Missed Call', missedVideo: 'Missed FaceTime', unread: 'Unread Messages', vn: 'Audio Message' },
  whatsapp: { deleted: 'You deleted this message', deletedThem: 'This message was deleted', unread: '1 UNREAD MESSAGE' },
  telegram: { deleted: 'Message deleted', deletedThem: 'Message deleted', edited: 'edited', voice: 'Outgoing call' },
  instagram: { deletedThem: 'Message unsent', voice: 'Audio call', video: 'Video chat', missed: 'Missed audio call', missedVideo: 'Missed video chat', unread: 'Unread' },
  x: { deleted: 'You deleted this message', deletedThem: 'This message was deleted', voice: 'Audio call', missed: 'Missed audio call' },
  sms: { deleted: 'You deleted this message', deletedThem: 'This message was deleted', unread: 'New messages' },
  lock: { deleted: 'Message deleted', deletedThem: 'Message deleted', unread: 'New' }
};
const ID_TPL = {
  imessage: { deleted: 'Anda membatalkan pengiriman pesan', deletedThem: 'Pesan ini dibatalkan', voice: 'Panggilan Suara', video: 'Video FaceTime', missed: 'Panggilan Tak Terjawab', missedVideo: 'FaceTime Tak Terjawab', unread: 'Pesan Belum Dibaca', vn: 'Pesan Audio' },
  whatsapp: { unread: '1 PESAN BELUM DIBACA' },
  telegram: { deleted: 'Pesan dihapus', deletedThem: 'Pesan dihapus', edited: 'diedit', voice: 'Panggilan keluar', missed: 'Panggilan tak terjawab' },
  instagram: { deleted: 'Anda membatalkan pengiriman pesan', deletedThem: 'Pesan dibatalkan', voice: 'Panggilan audio', video: 'Obrolan video', missed: 'Panggilan audio tak terjawab', missedVideo: 'Obrolan video tak terjawab', unread: 'Belum dibaca' },
  sms: { deletedThem: 'Pesan ini dihapus', missed: 'Panggilan tak terjawab', unread: 'Pesan baru' },
  lock: { deleted: 'Pesan dihapus', deletedThem: 'Pesan dihapus', missed: 'Panggilan tak terjawab', unread: 'Baru' }
};
export const chatLang = chat => (typeof chat === 'object' && chat?._lang) || 'id';
export function labels(chatOrTpl) {
  const tpl = typeof chatOrTpl === 'string' ? chatOrTpl : chatOrTpl?.template;
  const en = chatLang(chatOrTpl) === 'en';
  return { ...(en ? EN_BASE : ID_BASE), ...((en ? EN_TPL : ID_TPL)[tpl] || {}) };
}
// Kept for callers that only know the template (defaults to Indonesian).
export const LABELS = new Proxy({}, { get: (_, k) => labels(String(k)) });

const TX = {
  id: { read: 'Dibaca', delivered: 'Terkirim', sent: 'Terkirim', seen: 'Dilihat', typing: 'mengetik...', typingL: 'sedang mengetik…', isTyping: n => `${n} mengetik...`, isTypingL: n => `${n} sedang mengetik…`,
    members: n => `${n} anggota`, people: n => `${n} orang`, lastSeen: 'terakhir dilihat baru saja', activeNow: 'Aktif sekarang', opened: 'Dibuka', meLabel: 'SAYA',
    waPh: 'Ketik pesan', tgPh: 'Pesan', smsPh: 'Pesan teks', igPh: 'Kirim pesan...', xPh: 'Mulai pesan', snapPh: 'Kirim obrolan', tinderPh: 'Ketik pesan', sendBtn: 'KIRIM',
    pinned: 'Pesan disematkan', now: 'sekarang', minAgo: d => `${d} mnt lalu`, noNotif: 'Tidak ada notifikasi', newMsg: 'Pesan baru', myLoc: 'Lokasi saya', tapMap: 'Ketuk untuk membuka peta',
    forwarded: 'Diteruskan', viewOnce: 'Foto · Sekali lihat', onceOpened: 'Dibuka', pollHint: 'Pilih satu atau lebih', votes: 'suara', viewVotes: 'Lihat suara', video: 'Video', file: 'Dokumen', pages: 'hlm',
    msgBtn: 'Kirim pesan', sticker: 'Stiker', location: 'Lokasi', contact: 'Kontak', kbSpace: 'spasi', kbSpaceA: 'Indonesia', kbSugg: ['aku', 'iya', 'oke'], appName: 'Pesan',
    days: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], months: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'] },
  en: { read: 'Read', delivered: 'Delivered', sent: 'Sent', seen: 'Seen', typing: 'typing...', typingL: 'typing…', isTyping: n => `${n} is typing...`, isTypingL: n => `${n} is typing…`,
    members: n => `${n} members`, people: n => `${n} people`, lastSeen: 'last seen recently', activeNow: 'Active now', opened: 'Opened', meLabel: 'ME',
    waPh: 'Message', tgPh: 'Message', smsPh: 'Text message', igPh: 'Message...', xPh: 'Start a message', snapPh: 'Send a chat', tinderPh: 'Type a message', sendBtn: 'SEND',
    pinned: 'Pinned message', now: 'now', minAgo: d => `${d}m ago`, noNotif: 'No notifications', newMsg: 'New message', myLoc: 'My location', tapMap: 'Tap to open the map',
    forwarded: 'Forwarded', viewOnce: 'Photo · View once', onceOpened: 'Opened', pollHint: 'Select one or more', votes: 'votes', viewVotes: 'View votes', video: 'Video', file: 'Document', pages: 'pages',
    msgBtn: 'Message', sticker: 'Sticker', location: 'Location', contact: 'Contact', kbSpace: 'space', kbSpaceA: 'English', kbSugg: ['I', 'the', 'okay'], appName: 'Messages',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] }
};
export const tx = chat => TX[chatLang(chat)] || TX.id;

// Built-in divider texts ("Today", "HARI INI", "Today 7:32 PM"…) follow the chat language.
const TODAY_RX = /^(today|hari ini)(\s+(\d{1,2})[:.](\d{2})(\s*[ap]m)?)?$/i;
export function dividerText(text, chat) {
  const m = (text || '').trim().match(TODAY_RX);
  if (!m) return text;
  const en = chatLang(chat) === 'en';
  const upper = text.trim() === text.trim().toUpperCase();
  let word = en ? 'Today' : (chat.template === 'imessage' ? 'Hari Ini' : 'Hari ini');
  let time = '';
  if (m[2]) {
    let h = +m[3]; const mm = m[4];
    if (m[5]) { const pm = /p/i.test(m[5]); h = (h % 12) + (pm ? 12 : 0); }
    time = en ? ' ' + to12(`${h}:${mm}`) : ` ${String(h).padStart(2, '0')}.${mm}`;
  }
  const out = word + time;
  return upper ? out.toUpperCase() : out;
}

export const typeOf = m => m.type || 'text';
const RUN_KINDS = new Set(['msg', 'typing']);
export const runKey = (it, group) => (it && RUN_KINDS.has(it.kind) ? (it.from === 'me' ? 'me' : 'them:' + (group ? it.sender || '' : '')) : null);

export function groupInfo(items, group) {
  return items.map((it, i) => {
    const s = runKey(it, group);
    return { first: s !== runKey(items[i - 1], group), last: s !== runKey(items[i + 1], group) };
  });
}

const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter() : null;
export function bigEmoji(m) {
  if (typeOf(m) !== 'text' || m.replyTo) return 0;
  const t = (m.text || '').replace(/\s/g, '');
  if (!t || /[\p{L}\p{N}]/u.test(t)) return 0;
  if (!/^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|‍|️|⃣)+$/u.test(t)) return 0;
  const n = seg ? [...seg.segment(t)].length : [...t].length;
  return n <= 3 ? n : 0;
}

export function initials(name = '?') {
  const clean = name.replace(/[^\p{L}\p{N} ]/gu, ' ').trim();
  if (!clean) return '#';
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, parts[0].length <= 3 ? 3 : 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AV_COLORS = ['#8e8e93', '#ff9f0a', '#30b0c7', '#5e5ce6', '#ff375f', '#34c759', '#bf5af2', '#64d2ff'];
export function avatarColor(name = '') {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}

export function Avatar({ contact, size, flat, color, personIcon }) {
  const st = { width: size, height: size, minWidth: size };
  if (contact?.avatar) return <div className="t-av" style={st}><img src={mediaUrl(contact.avatar)} alt="" /></div>;
  if (personIcon && !contact?.emoji) {
    return (
      <div className="t-av" style={{ ...st, background: personIcon.bg }}>
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <circle cx="20" cy="15.5" r="7.2" fill={personIcon.fg} />
          <path d="M6.5 35c1.8-7.2 7-10.6 13.5-10.6S31.7 27.8 33.5 35z" fill={personIcon.fg} />
        </svg>
      </div>
    );
  }
  const bg = flat ? (color || contact?.color || avatarColor(contact?.name)) : 'linear-gradient(180deg,#a5a5ab,#858589)';
  if (contact?.emoji) return <div className="t-av" style={{ ...st, background: flat || personIcon ? (contact.color || avatarColor(contact.name)) : bg, fontSize: size * 0.56 }}>{contact.emoji}</div>;
  const txt = initials(contact?.name);
  return <div className="t-av" style={{ ...st, background: bg, fontSize: size * (txt.length > 2 ? 0.34 : 0.42) }}>{txt}</div>;
}

export function Verified({ color = '#1d9bf0', size = 16, check = '#fff' }) {
  return (
    <svg className="t-verified" width={size} height={size} viewBox="0 0 24 24">
      <path fill={color} d="M12 1.6l2.5 1.9 3.1-.3.9 3 2.7 1.6-1 3 1 3-2.7 1.6-.9 3-3.1-.3L12 22.4l-2.5-1.9-3.1.3-.9-3-2.7-1.6 1-3-1-3 2.7-1.6.9-3 3.1.3z" />
      <path d="M7.6 12.3l3 3 5.8-6.2" fill="none" stroke={check} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const sbAndroid = (chat, def) => (chat.sbStyle === 'ios' ? false : chat.sbStyle === 'android' ? true : def);

export function StatusBar({ time, battery = 76, color = '#fff', android = false, charging = false, cfg = {} }) {
  const lvl = Math.max(4, Math.min(100, battery));
  const bars = cfg.signal ?? 4;
  const air = !!cfg.airplane;
  time = fmtTime(time, cfg);
  return (
    <div className={'t-sb' + (android ? ' android' : '')} style={{ color }}>
      <span className="t-sb-time">{time}</span>
      <span className="t-sb-icons">
        {air ? (
          <svg width="16" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
        ) : (
          <>
            {cfg.network && <span className="t-sb-net">{cfg.network}</span>}
            <svg width="18" height="12" viewBox="0 0 18 12">
              {[0, 1, 2, 3].map(i => <rect key={i} x={i * 4.6} y={9 - i * 2.8} width="3.2" height={3 + i * 2.8} rx="0.9" fill="currentColor" opacity={i < bars ? 1 : 0.28} />)}
            </svg>
          </>
        )}
        {cfg.wifi !== false && !air && (
          <svg width="16" height="12" viewBox="0 0 16 12">
            <path d="M8 11.4 5.6 8.9a3.4 3.4 0 0 1 4.8 0z" fill="currentColor" />
            <path d="M3.6 6.9a6.3 6.3 0 0 1 8.8 0l-1.3 1.3a4.5 4.5 0 0 0-6.2 0z" fill="currentColor" />
            <path d="M1.4 4.7a9.4 9.4 0 0 1 13.2 0l-1.3 1.3a7.6 7.6 0 0 0-10.6 0z" fill="currentColor" />
          </svg>
        )}
        {android && <span className="t-sb-pct">{battery}%</span>}
        <span className="t-bat">
          <span className="t-bat-body">
            <span className="t-bat-lvl" style={{ width: lvl + '%', background: charging ? '#34c759' : lvl <= 20 ? '#ff453a' : 'currentColor' }} />
            {charging && (
              <svg className="t-bolt" width="9" height="11" viewBox="0 0 9 11"><path d="M5.3 0 0 6.3h3.6L3 11l6-6.6H5.3z" fill={color} stroke={color === '#fff' ? '#000' : '#fff'} strokeWidth=".6" /></svg>
            )}
          </span>
          <span className="t-bat-cap" />
        </span>
      </span>
    </div>
  );
}

export function Ticks({ status, color }) {
  if (status === 'sent') {
    return (
      <svg className="wa-tick" width="12" height="11" viewBox="0 0 12 11">
        <path d="M1.5 6l3 3 6-7" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="wa-tick" width="16" height="11" viewBox="0 0 16 11">
      <path d="M1.2 6l3 3 6-7" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.4 8.2l.8.8 6-7" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function to12(t = '') {
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h)) return t;
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function Dots({ color }) {
  return <span className="t-dots"><i style={{ background: color }} /><i style={{ background: color }} /><i style={{ background: color }} /></span>;
}

function hash(s = '') { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
function Wave({ id, n = 30 }) {
  let h = hash(id);
  const bars = Array.from({ length: n }, () => { h = (h * 1103515245 + 12345) >>> 0; return 4 + (h % 17); });
  return <span className="c-wave">{bars.map((b, i) => <i key={i} style={{ height: b }} />)}</span>;
}

export function senderOf(m, chat) {
  if (m.from === 'me') return { name: labels(chat).you };
  if (chat.group) return chat.participants.find(p => p.id === m.sender) || chat.participants[0] || { name: chat.contact.name };
  return chat.contact;
}

export function quoteText(m, chat) {
  const L = labels(chat);
  const X = tx(chat);
  const t = typeOf(m);
  if (t === 'image') return (m.text ? '📷 ' + m.text : '📷 ' + L.photo);
  if (t === 'voice') return '🎤 ' + L.vn + (m.duration ? ` (${m.duration})` : '');
  if (t === 'call') return L.voice;
  if (t === 'deleted') return L.deletedThem;
  if (t === 'sticker') return '🖼️ ' + X.sticker;
  if (t === 'location') return '📍 ' + (m.place || X.location);
  if (t === 'contact') return '👤 ' + (m.cname || X.contact);
  if (t === 'viewonce') return '①  ' + X.viewOnce;
  if (t === 'poll') return '📊 ' + (m.text || 'Poll');
  if (t === 'file') return '📄 ' + (m.fname || X.file);
  if (t === 'videomsg') return '🎥 ' + (m.text || X.video);
  return m.text;
}

// Everything that goes inside a bubble (sender name, quote, photo, voice note, call, text).
export function Content({ it, chat, byId, showName }) {
  const L = labels(chat);
  const t = typeOf(it);
  const q = it.replyTo ? byId[it.replyTo] : null;
  const snd = senderOf(it, chat);
  const qs = q ? senderOf(q, chat) : null;
  const link = t === 'text' ? (it.text || '').match(URL_RE)?.[0] : null;
  return (
    <>
      {showName && <div className="c-name" style={{ color: snd.color }}>{snd.name}</div>}
      {it.forwarded && <div className="c-fwd"><Forward size={13} /> {tx(chat).forwarded}</div>}
      {q && (
        <div className="c-quote" style={{ '--qc': q.from === 'me' ? 'var(--q-me)' : qs.color || 'var(--q-them)' }}>
          <b>{q.from === 'me' ? L.you : qs.name}</b>
          <span>{quoteText(q, chat)}</span>
        </div>
      )}
      {t === 'image' && it.image && <img className="c-img" src={mediaUrl(it.image)} alt="" />}
      {t === 'voice' && (
        <span className="c-voice">
          <span className="c-play"><Play size={16} fill="currentColor" strokeWidth={0} /></span>
          <Wave id={it.id} />
          <span className="c-dur">{it.duration || '0:12'}</span>
          {chat.template === 'whatsapp' && <span className="c-vav"><Mic size={13} /></span>}
        </span>
      )}
      {t === 'call' && <CallRow it={it} L={L} />}
      {t === 'deleted' && <span className="c-del"><Ban size={15} /> {it.from === 'me' ? L.deleted : L.deletedThem}</span>}
      {t === 'sticker' && it.image && <img className="c-sticker" src={mediaUrl(it.image)} alt="" />}
      {t === 'location' && <LocationCard it={it} X={tx(chat)} />}
      {t === 'contact' && <ContactCard it={it} X={tx(chat)} />}
      {t === 'text' && link && <LinkCard url={link} title={it.linkTitle} />}
      {t === 'videomsg' && (
        <span className="c-vid">
          {it.image ? <img className="c-img" src={mediaUrl(it.image)} alt="" /> : <span className="c-img c-vid-ph" />}
          <span className="c-vid-play"><Play size={24} fill="#fff" strokeWidth={0} /></span>
          <span className="c-vid-dur"><Video size={12} /> {it.duration || '0:15'}</span>
        </span>
      )}
      {t === 'viewonce' && (
        <span className="c-once"><span className={'c-once-ic' + (it.onceOpened ? ' done' : '')}>1</span>{it.onceOpened ? tx(chat).onceOpened : tx(chat).viewOnce}</span>
      )}
      {t === 'file' && <FileCard it={it} X={tx(chat)} />}
      {t === 'poll' && <PollCard it={it} X={tx(chat)} />}
      {(t === 'text' || ((t === 'image' || t === 'videomsg') && it.text)) && <span className="c-text">{rich(it.text, chat, link)}</span>}
      {it.starred && <span className="c-star"><Star size={11} fill="currentColor" strokeWidth={0} /></span>}
    </>
  );
}

function CallRow({ it, L }) {
  const missed = it.call?.startsWith('missed');
  const video = it.call?.includes('video');
  const Icon = missed ? PhoneMissed : video ? Video : it.from === 'me' ? PhoneOutgoing : PhoneIncoming;
  const title = missed ? (video ? L.missedVideo : L.missed) : video ? L.video : L.voice;
  return (
    <span className={'c-call' + (missed ? ' missed' : '')}>
      <span className="c-call-ic"><Icon size={18} strokeWidth={2.2} /></span>
      <span className="c-call-tx"><b>{title}</b><small>{missed ? L.callBack : it.duration || L.mins}</small></span>
      <span className="c-call-r">{video ? <Video size={18} /> : <Phone size={17} />}</span>
    </span>
  );
}

export function Reaction({ it }) {
  if (!it.reaction) return null;
  return <span className="c-react">{it.reaction}</span>;
}

// Rows that are not bubbles.
export function NonBubble({ it, onTap, cls, chat }) {
  if (it.kind === 'unread') {
    const auto = [...Object.values(ID_TPL), ...Object.values(EN_TPL), ID_BASE, EN_BASE].some(v => v.unread === it.text);
    return <div className={cls.unread} onClick={onTap}><span>{auto && chat ? labels(chat).unread : it.text}</span></div>;
  }
  if (it.kind === 'system') return <div className={cls.system} onClick={onTap}><span>{it.text}</span></div>;
  return <div className={cls.time} onClick={onTap}><span>{chat ? dividerText(it.text, chat) : it.text}</span></div>;
}

export function wallpaperStyle(chat, fallback) {
  const w = chat.wallpaper || {};
  if (w.type === 'color' && w.value) return { background: w.value };
  if (w.type === 'image' && w.value) return { backgroundImage: `url("${mediaUrl(w.value)}")`, backgroundSize: 'cover', backgroundPosition: 'center' };
  return fallback;
}

const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+\.[a-z]{2,}[^\s]*)/i;
function linkify(text) {
  const parts = text.split(/(https?:\/\/[^\s]+|www\.[^\s]+\.[a-z]{2,}[^\s]*)/i);
  return parts.map((p, i) => (i % 2 ? <span key={i} className="c-link">{p}</span> : p));
}
function LinkCard({ url, title }) {
  let host = url;
  try { host = new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace(/^www\./, ''); } catch { /* keep */ }
  const hue = [...host].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span className="c-linkcard">
      <span className="c-linkimg" style={{ background: `linear-gradient(135deg,hsl(${hue} 70% 55%),hsl(${(hue + 50) % 360} 70% 45%))` }}>
        <b>{host.split('.')[0].slice(0, 1).toUpperCase()}</b>
      </span>
      <span className="c-linktx"><b>{title || host}</b><small>{host}</small></span>
    </span>
  );
}
function LocationCard({ it, X }) {
  return (
    <span className="c-loc">
      <svg className="c-map" viewBox="0 0 260 130" preserveAspectRatio="xMidYMid slice">
        <rect width="260" height="130" fill="#e8eef0" />
        <path d="M0 40h260M0 95h260M60 0v130M170 0v130M0 10l260 110" stroke="#fff" strokeWidth="9" />
        <path d="M0 40h260M0 95h260M60 0v130M170 0v130" stroke="#f6d38a" strokeWidth="3" />
        <rect x="80" y="52" width="70" height="30" rx="4" fill="#cfe7c4" /><rect x="190" y="8" width="55" height="22" rx="4" fill="#cfe7c4" />
        <path d="M130 30c-12 0-21 9-21 21 0 16 21 37 21 37s21-21 21-37c0-12-9-21-21-21z" fill="#ea4335" stroke="#fff" strokeWidth="3" />
        <circle cx="130" cy="51" r="7" fill="#fff" />
      </svg>
      <span className="c-loctx"><b>{it.place || X.myLoc}</b><small>{it.address || X.tapMap}</small></span>
    </span>
  );
}
function ContactCard({ it, X }) {
  return (
    <span className="c-contact">
      <span className="c-contact-top">
        <span className="t-av" style={{ width: 40, height: 40, background: avatarColor(it.cname || ''), fontSize: 16 }}>{initials(it.cname || '?')}</span>
        <span><b>{it.cname || X.contact}</b><small>{it.phone || '+62 812-3456-7890'}</small></span>
      </span>
      <span className="c-contact-btn">{X.msgBtn}</span>
    </span>
  );
}

export function PinBar({ chat }) {
  if (!chat.pinnedText) return null;
  return (
    <div className="pinbar">
      <span className="pin-line" />
      <span className="pin-tx"><b>{tx(chat).pinned}</b><span>{chat.pinnedText}</span></span>
      <Pin size={17} />
    </div>
  );
}

export function Draft({ chat, placeholder }) {
  return chat.draft ? <span className="draft">{chat.draft}<i className="caret" /></span> : placeholder;
}

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
export function Keyboard({ chat, android }) {
  if (!chat.keyboard) return null;
  const X = tx(chat);
  return (
    <div className={'kb ' + (chat.dark ? 'dark' : 'light') + (android ? ' android' : '')}>
      {android && <div className="kb-sugg">{X.kbSugg.map(w => <span key={w}>{w}</span>)}</div>}
      {ROWS.map((r, i) => (
        <div className="kb-row" key={r}>
          {i === 2 && <span className="kb-k fn"><ArrowBigUp size={20} /></span>}
          {[...r].map(ch => <span className="kb-k" key={ch}>{ch}</span>)}
          {i === 2 && <span className="kb-k fn"><Delete size={19} /></span>}
        </div>
      ))}
      <div className="kb-row">
        <span className="kb-k fn wide">{android ? '?123' : '123'}</span>
        {android && <span className="kb-k fn">,</span>}
        <span className="kb-k space">{android ? X.kbSpaceA : X.kbSpace}</span>
        {android && <span className="kb-k fn">.</span>}
        <span className="kb-k fn wide"><CornerDownLeft size={18} /></span>
      </div>
      {!android && <div className="kb-bottom" />}
    </div>
  );
}

// Incoming-message banner drawn over the top of the screen.
export function NotifBanner({ chat }) {
  const n = chat.notif;
  if (!n?.on) return null;
  const lastThem = [...chat.messages].reverse().find(m => m.kind === 'msg' && m.from !== 'me');
  const from = n.from || (chat.group ? chat.contact.name : chat.contact.name) || 'Unknown';
  const text = n.text || (lastThem ? quoteText(lastThem, chat) : tx(chat).newMsg);
  return (
    <div className={'notif ' + (chat.dark ? 'dark' : 'light')}>
      <span className="notif-ic" style={{ background: n.color || '#34c759' }}><MessageCircle size={20} fill="#fff" strokeWidth={0} /></span>
      <span className="notif-tx">
        <span className="notif-top"><b>{from}</b><small>{!n.when || n.when === 'sekarang' || n.when === 'now' ? tx(chat).now : n.when}</small></span>
        <span className="notif-msg">{text}</span>
      </span>
      {chat.contact.avatar && <img className="notif-av" src={mediaUrl(chat.contact.avatar)} alt="" />}
    </div>
  );
}

// *bold* _italic_ ~strike~ `mono` and @mentions (WhatsApp-style), plus links.
const FMT_RX = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`|@[\p{L}\p{N}_.]+)/u;
function fmt(str, key) {
  return str.split(new RegExp(FMT_RX.source, 'gu')).map((p, i) => {
    if (!p) return null;
    const k = key + '-' + i;
    if (/^\*[^*]+\*$/.test(p)) return <b key={k}>{p.slice(1, -1)}</b>;
    if (/^_[^_]+_$/.test(p)) return <i key={k}>{p.slice(1, -1)}</i>;
    if (/^~[^~]+~$/.test(p)) return <s key={k}>{p.slice(1, -1)}</s>;
    if (/^`[^`]+`$/.test(p)) return <code key={k} className="c-mono">{p.slice(1, -1)}</code>;
    if (/^@/.test(p)) return <span key={k} className="c-mention">{p}</span>;
    return p;
  });
}
function rich(text = '', chat, link) {
  const parts = link ? text.split(/(https?:\/\/[^\s]+|www\.[^\s]+\.[a-z]{2,}[^\s]*)/i) : [text];
  if (chat.richText === false) return link ? linkify(text) : text;
  return parts.map((p, i) => (i % 2 ? <span key={i} className="c-link">{p}</span> : fmt(p, i)));
}

function FileCard({ it, X }) {
  const ext = ((it.fname || 'dokumen.pdf').split('.').pop() || 'pdf').toUpperCase().slice(0, 4);
  const col = { PDF: '#e5484d', DOC: '#2b7cd3', DOCX: '#2b7cd3', XLS: '#1f9d55', XLSX: '#1f9d55', PPT: '#e8743b', PPTX: '#e8743b', ZIP: '#8e6cd8', APK: '#3ddc84' }[ext] || '#7c8591';
  return (
    <span className="c-file">
      <span className="c-file-ic" style={{ background: col }}><FileText size={18} /><b>{ext}</b></span>
      <span className="c-file-tx"><b>{it.fname || 'dokumen.pdf'}</b><small>{(it.fpages ? `${it.fpages} ${X.pages} · ` : '') + (it.fsize || '1,2 MB') + ' · ' + ext}</small></span>
    </span>
  );
}
function PollCard({ it, X }) {
  const opts = (it.poll && it.poll.length ? it.poll : [{ t: 'Ya', v: 3 }, { t: 'Tidak', v: 1 }]);
  const max = Math.max(1, ...opts.map(o => +o.v || 0));
  const total = opts.reduce((a, o) => a + (+o.v || 0), 0);
  return (
    <span className="c-poll">
      <b className="c-poll-q">{it.text || 'Polling'}</b>
      <small className="c-poll-hint">{X.pollHint}</small>
      {opts.map((o, i) => (
        <span key={i} className="c-poll-opt">
          <span className={'c-poll-ck' + (o.mine ? ' on' : '')} />
          <span className="c-poll-main">
            <span className="c-poll-row"><span>{o.t}</span><span>{+o.v || 0}</span></span>
            <span className="c-poll-bar"><i style={{ width: `${((+o.v || 0) / max) * 100}%` }} /></span>
          </span>
        </span>
      ))}
      <span className="c-poll-foot">{X.viewVotes} · {total} {X.votes}</span>
    </span>
  );
}

// Message/clock time in the chat's format (auto = template habit, '12' or '24').
export function fmtTime(t, chat) {
  if (!t || !chat) return t;
  const f = chat.timeFmt || 'auto';
  if (f === '12') return to12(t).replace(/ (AM|PM)$/, chat._lang === 'en' ? ' $1' : ' $1');
  if (f === '24') return t;
  return t;
}
