import { Sheet } from '../components/ui.jsx';
import { useStore, TEMPLATES } from '../store.js';
import { fx } from '../fx.js';

// Small hand-drawn phone illustrations, one per template.
function MiniArt({ k }) {
  const c = {
    imessage: { bg: '#000', head: '#1c1c1e', them: '#3a3a3c', me: '#0a84ff', r: 7 },
    whatsapp: { bg: '#0b141a', head: '#1f2c34', them: '#202c33', me: '#005c4b', r: 3 },
    x: { bg: '#000', head: '#000', them: '#2f3336', me: '#1d9bf0', r: 8 },
    telegram: { bg: '#0e1621', head: '#212d3b', them: '#182533', me: '#2b5278', r: 6 },
    instagram: { bg: '#000', head: '#000', them: '#262626', me: '#7a3cf5', r: 8 },
    sms: { bg: '#121316', head: '#121316', them: '#33353a', me: '#0b57d0', r: 8 },
    lock: { bg: '#2a2160', head: '#2a2160', them: 'rgba(255,255,255,.35)', me: 'rgba(255,255,255,.35)', r: 4 }
  }[k];
  return (
    <svg width="58" height="74" viewBox="0 0 58 74">
      <rect width="58" height="74" rx="12" fill={c.bg} />
      <rect width="58" height="18" fill={c.head} />
      <circle cx={k === 'imessage' ? 29 : 13} cy="9" r="5" fill="#8e8e93" />
      {k !== 'imessage' && <rect x="21" y="6" width="18" height="3" rx="1.5" fill="#e9edef" />}
      <rect x="6" y="25" width="28" height="9" rx={c.r / 2 + 1} fill={c.them} />
      <rect x="24" y="38" width="28" height="9" rx={c.r / 2 + 1} fill={c.me} />
      <rect x="6" y="51" width="20" height="9" rx={c.r / 2 + 1} fill={c.them} />
      <rect x="30" y="64" width="22" height="6" rx="3" fill={c.me} opacity=".7" />
      {k === 'whatsapp' && <circle cx="49" cy="66" r="4" fill="#00a884" />}
    </svg>
  );
}

export default function NewChatSheet({ open, onClose, onCreated }) {
  const newChat = useStore(s => s.newChat);
  return (
    <Sheet open={open} onClose={onClose} title="Pilih template">
      <div className="tpl-pick">
        {Object.entries(TEMPLATES).map(([k, t]) => (
          <button key={k} className="tpl-card press" onClick={() => { fx.send(); onCreated(newChat(k)); }}>
            <div className="mini"><MiniArt k={k} /></div>
            <div>
              <b>Gaya {t.label}</b>
              <span>{t.note}</span>
            </div>
          </button>
        ))}
      </div>
      <p className="note" style={{ marginTop: 14 }}>Template bisa diganti kapan saja di editor, isi chat tetap sama.</p>
    </Sheet>
  );
}
