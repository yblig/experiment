import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Clock, Copy, Trash2, Sparkles, Plus } from 'lucide-react';
import { useStore, TEMPLATES } from '../store.js';
import { BrandMark, Mini, Sheet, toast, useNow } from '../components/ui.jsx';
import Shot from '../templates/Shot.jsx';
import { fx } from '../fx.js';

function ago(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'baru saja';
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  const d = new Date(ts);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function lastLine(c) {
  const m = [...c.messages].reverse().find(x => x.kind === 'msg');
  if (!m) return 'Belum ada pesan';
  return (m.from === 'me' ? 'Kamu: ' : (c.contact.name || 'Dia') + ': ') + m.text;
}

function EmptyArt() {
  return (
    <svg width="190" height="150" viewBox="0 0 190 150">
      <defs>
        <linearGradient id="ea1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a99dff" /><stop offset="1" stopColor="#5d4be6" /></linearGradient>
        <linearGradient id="ea2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5ff0c4" /><stop offset="1" stopColor="#1fb68a" /></linearGradient>
      </defs>
      <ellipse cx="95" cy="140" rx="64" ry="7" fill="currentColor" opacity=".08" />
      <rect x="54" y="8" width="82" height="126" rx="16" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
      <rect x="62" y="22" width="44" height="16" rx="8" fill="var(--surface2)" />
      <rect x="82" y="44" width="46" height="16" rx="8" fill="url(#ea1)" />
      <rect x="62" y="66" width="36" height="16" rx="8" fill="var(--surface2)" />
      <rect x="90" y="88" width="38" height="16" rx="8" fill="url(#ea1)" />
      <g transform="translate(14 54) rotate(-10)">
        <rect width="46" height="30" rx="12" fill="url(#ea2)" />
        <circle cx="14" cy="15" r="3" fill="#fff" /><circle cx="23" cy="15" r="3" fill="#fff" /><circle cx="32" cy="15" r="3" fill="#fff" />
      </g>
      <g transform="translate(140 22) rotate(12)">
        <rect width="38" height="28" rx="11" fill="#ffc145" />
        <path d="M12 14h14M19 8v12" stroke="#5a3c00" strokeWidth="3.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export default function Home({ onOpen, onNew, goPresets }) {
  useNow();
  const { chats, deleteChat, duplicateChat, restoreChat } = useStore();
  const [menu, setMenu] = useState(null);

  const del = c => {
    fx.del();
    deleteChat(c.id);
    setMenu(null);
    toast('Chat dihapus', { label: 'URUNGKAN', fn: () => { fx.tap(); restoreChat(c); } });
  };

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <BrandMark />
          <div>
            <h1>ChatSim</h1>
            <p className="subtitle">Bikin chat buat cerita, video & meme</p>
          </div>
        </div>
      </div>
      <div className="scroll page-pad">
        {chats.length === 0 ? (
          <motion.div className="empty" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <EmptyArt />
            <h2>Belum ada chat</h2>
            <p>Tulis percakapan, pilih gaya iMessage, WhatsApp atau X, lalu simpan jadi screenshot.</p>
            <div style={{ display: 'grid', gap: 10, maxWidth: 300, margin: '0 auto' }}>
              <button className="btn primary press" onClick={() => { fx.tap(); onNew(); }}><Plus size={20} /> Buat chat baru</button>
              <button className="btn ghost press" onClick={() => { fx.tap(); goPresets(); }}><Sparkles size={18} /> Pakai preset cerita</button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="section-title">Chat kamu <small>{chats.length} chat</small></div>
            {chats.map((c, i) => {
              const t = TEMPLATES[c.template];
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                  <div className="card chat-card press" role="button" onClick={() => { fx.tap(); onOpen(c.id); }}>
                    <div className="thumb"><Mini width={74}><Shot chat={{ ...c, showInput: false }} /></Mini></div>
                    <div className="info">
                      <span className="badge" style={{ background: t.color + '22', color: t.color }}><i style={{ background: t.color }} />{t.label}</span>
                      <h3>{c.title}</h3>
                      <p>{lastLine(c)}</p>
                      <div className="when"><Clock size={12} /> {ago(c.updatedAt)} · {c.messages.filter(m => m.kind === 'msg').length} pesan</div>
                    </div>
                    <button className="more-btn press" onClick={e => { e.stopPropagation(); fx.tap(); setMenu(c); }} aria-label="Menu"><MoreVertical size={20} /></button>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </div>
      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.title}>
        <button className="menu-item press" onClick={() => { fx.tap(); duplicateChat(menu.id); setMenu(null); toast('Chat diduplikat'); }}><Copy size={20} /> Duplikat</button>
        <button className="menu-item danger press" onClick={() => del(menu)}><Trash2 size={20} /> Hapus</button>
      </Sheet>
    </>
  );
}
