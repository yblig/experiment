import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, SlidersHorizontal, Download, Send, Plus, Moon, Sun, ChevronUp, ChevronDown, Trash2, Copy,
  Clock3, MoreHorizontal, Eraser, ArrowLeftRight, Camera, ImageOff, Share2, Film, Check
} from 'lucide-react';
import { useStore, TEMPLATES, uid } from '../store.js';
import { Sheet, Seg, Switch, toast, useBack } from '../components/ui.jsx';
import Shot from '../templates/Shot.jsx';
import { to12 } from '../templates/parts.jsx';
import { renderPng, savePng, sharePngs, fileBase } from '../exporter.js';
import { fx } from '../fx.js';

const timeLabel = (tpl, clock) => (tpl === 'imessage' ? `Today ${to12(clock)}` : tpl === 'whatsapp' ? 'HARI INI' : 'Today');
const isAutoLabel = (txt, clock) => ['imessage', 'whatsapp', 'x'].some(t => timeLabel(t, clock) === txt) || /^Today \d/.test(txt) || txt === 'HARI INI' || txt === 'Today';
const statusOpts = [['sent', 'Terkirim'], ['delivered', 'Diterima'], ['read', 'Dibaca']];

async function resizeImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const s = 320, c = document.createElement('canvas');
    c.width = c.height = s;
    const ctx = c.getContext('2d');
    const m = Math.min(img.width, img.height);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, s, s);
    ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
    return c.toDataURL('image/jpeg', 0.86);
  } finally { URL.revokeObjectURL(url); }
}

export default function Editor({ id, onClose }) {
  const chat = useStore(s => s.chats.find(c => c.id === id));
  const updateChat = useStore(s => s.updateChat);
  const settings = useStore(s => s.settings);
  const [view, setView] = useState('preview');
  const [side, setSide] = useState('me');
  const [text, setText] = useState('');
  const [sheet, setSheet] = useState(null); // 'settings' | 'plus' | 'export' | {edit: index}
  const [box, setBox] = useState({ w: 360, h: 500 });
  const [shotH, setShotH] = useState(844);
  const stageRef = useRef(null);
  const shotRef = useRef(null);
  const offRef = useRef(null);
  const [offUpto, setOffUpto] = useState(null);
  const [busy, setBusy] = useState(null);

  useBack(!sheet, onClose);
  useEffect(() => { if (!chat) onClose(); }, [chat, onClose]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);
  useLayoutEffect(() => { if (shotRef.current) setShotH(shotRef.current.offsetHeight); });

  const phone = chat ? chat.frame !== 'auto' : true;
  const count = chat?.messages.length ?? 0;
  useEffect(() => {
    if (stageRef.current && (!phone || view === 'list')) stageRef.current.scrollTo({ top: 1e6, behavior: 'smooth' });
  }, [count, phone, view]);

  if (!chat) return null;
  const up = fn => updateChat(id, fn);
  const msgs = chat.messages;
  const scale = phone ? Math.min((box.w - 28) / 390, (box.h - 20) / 844) : Math.min((box.w - 28) / 390, 1);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    const m = { id: uid(), kind: 'msg', from: side, text: t, time: chat.clock, status: side === 'me' ? 'read' : 'sent' };
    up(c => {
      const list = [...c.messages];
      const last = list[list.length - 1];
      if (last?.kind === 'typing' && last.from === side) list.pop();
      return { ...c, messages: [...list, m] };
    });
    side === 'me' ? fx.send() : fx.receive();
    setText('');
  };

  const addItem = item => { up(c => ({ ...c, messages: [...c.messages, { id: uid(), ...item }] })); setSheet(null); fx.receive(); };
  const editIdx = sheet?.edit;
  const cur = editIdx != null ? msgs[editIdx] : null;
  const patchMsg = (i, p) => up(c => ({ ...c, messages: c.messages.map((m, j) => (j === i ? { ...m, ...p } : m)) }));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= msgs.length) return;
    fx.tap();
    up(c => { const l = [...c.messages]; [l[i], l[j]] = [l[j], l[i]]; return { ...c, messages: l }; });
    if (editIdx === i) setSheet({ edit: j });
  };
  const removeMsg = i => {
    const removed = msgs[i];
    fx.del();
    up(c => ({ ...c, messages: c.messages.filter((_, j) => j !== i) }));
    setSheet(null);
    toast('Pesan dihapus', { label: 'URUNGKAN', fn: () => up(c => { const l = [...c.messages]; l.splice(i, 0, removed); return { ...c, messages: l }; }) });
  };
  const openEdit = i => { fx.tap(); setSheet({ edit: i }); };

  // ---------- export ----------
  const waitFrames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 60))));
  const shoot = async upto => {
    setOffUpto(upto);
    await waitFrames();
    return renderPng(offRef.current, settings.exportScale, chat.template);
  };
  const doExport = async mode => {
    if (busy) return;
    const base = fileBase(chat.title);
    try {
      if (mode === 'steps') {
        const stops = msgs.map((m, i) => (m.kind !== 'time' ? i + 1 : null)).filter(Boolean);
        if (!stops.length) { fx.error(); toast('Tambahkan pesan dulu'); return; }
        const urls = [];
        for (let k = 0; k < stops.length; k++) {
          setBusy({ label: `Membuat gambar ${k + 1} dari ${stops.length}`, p: k / stops.length });
          urls.push(await shoot(stops[k]));
        }
        setBusy({ label: 'Menyimpan…', p: 1 });
        let where = '';
        for (let k = 0; k < urls.length; k++) where = await savePng(urls[k], `${String(k + 1).padStart(2, '0')}`, base);
        fx.success();
        toast(`${urls.length} gambar · ${where}`);
      } else {
        setBusy({ label: 'Membuat gambar…', p: 0.4 });
        const url = await shoot(null);
        setBusy({ label: mode === 'share' ? 'Membuka bagikan…' : 'Menyimpan…', p: 0.9 });
        if (mode === 'share') await sharePngs([url], base);
        else { const where = await savePng(url, base); fx.success(); toast(where); }
      }
      setSheet(null);
    } catch (e) {
      if (!String(e?.message || e).toLowerCase().includes('cancel')) { fx.error(); toast('Gagal: ' + (e?.message || e)); }
    } finally { setBusy(null); setOffUpto(null); }
  };

  const tplColor = TEMPLATES[chat.template].color;
  const sideName = chat.contact.name || 'Dia';

  return (
    <>
      <div className="ed-top">
        <button className="icon-btn press" onClick={() => { fx.tap(); onClose(); }} aria-label="Kembali"><ArrowLeft size={24} /></button>
        <button className="ed-title press" onClick={() => { fx.tap(); setSheet('settings'); }}>{chat.title}</button>
        <button className="icon-btn tinted press" onClick={() => { fx.tap(); setSheet('settings'); }} aria-label="Atur chat"><SlidersHorizontal size={20} /></button>
        <button className="ed-export press" onClick={() => { fx.tap(); setSheet('export'); }}><Download size={18} /> Simpan</button>
      </div>

      <div className="chips">
        {Object.entries(TEMPLATES).map(([k, t]) => (
          <button key={k} className={'chip press' + (chat.template === k ? ' on' : '')} style={{ '--c': t.color }}
            onClick={() => { fx.toggle(); up(c => ({ ...c, template: k, messages: c.messages.map(m => (m.kind === 'time' && isAutoLabel(m.text, c.clock) ? { ...m, text: timeLabel(k, c.clock) } : m)) })); }}><i />{t.label}</button>
        ))}
        <button className="chip press" style={{ '--c': '#ffc145' }} onClick={() => { fx.toggle(); up(c => ({ ...c, dark: !c.dark })); }}>
          {chat.dark ? <Moon size={15} /> : <Sun size={15} />}{chat.dark ? 'Gelap' : 'Terang'}
        </button>
      </div>
      <div style={{ padding: '0 14px 8px' }}>
        <Seg value={view} onChange={setView} options={[['preview', 'Pratinjau'], ['list', `Daftar pesan (${msgs.length})`]]} />
      </div>

      {view === 'preview' ? (
        <div className={'stage' + (phone ? '' : ' scrolly')} ref={stageRef}>
          <div style={{ width: 390 * scale, height: shotH * scale, margin: '4px auto 14px', flexShrink: 0 }}>
            <motion.div className="stage-inner frame" style={{ width: 390, transform: `scale(${scale})`, transformOrigin: 'top left' }}
              key={chat.template} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
              <Shot ref={shotRef} chat={chat} onTap={openEdit} />
            </motion.div>
          </div>
          {msgs.length < 4 && <div className="hint">{msgs.length ? 'Ketuk gelembung untuk mengedit' : 'Tulis pesan pertama di bawah ↓'}</div>}
        </div>
      ) : (
        <div className="scroll list" ref={stageRef}>
          {msgs.length === 0 && <p className="note" style={{ textAlign: 'center', padding: 30 }}>Belum ada pesan. Tulis di bawah, lalu tekan kirim.</p>}
          {msgs.map((m, i) => (
            <motion.div layout key={m.id} className="li press" onClick={() => openEdit(i)} transition={{ duration: 0.2 }}>
              <span className={'who ' + (m.kind === 'time' ? 'time' : m.from)}>
                {m.kind === 'time' ? 'WAKTU' : m.from === 'me' ? 'AKU' : 'DIA'}
              </span>
              <span className="txt">{m.kind === 'typing' ? <i style={{ color: 'var(--sub)' }}>sedang mengetik…</i> : m.text}</span>
              {m.kind === 'msg' && <span className="tm">{m.time}</span>}
              <span className="mv" onClick={e => e.stopPropagation()}>
                <button onClick={() => move(i, -1)} aria-label="Naik"><ChevronUp size={18} /></button>
                <button onClick={() => move(i, 1)} aria-label="Turun"><ChevronDown size={18} /></button>
              </span>
            </motion.div>
          ))}
        </div>
      )}

      <div className="composer">
        <button className={'side-btn press ' + side} onClick={() => { fx.toggle(); setSide(s => (s === 'me' ? 'them' : 'me')); }}>
          <ArrowLeftRight size={15} />{side === 'me' ? 'Aku' : sideName.length > 7 ? 'Dia' : sideName}
        </button>
        <textarea className="comp-field" rows={1} value={text} placeholder={side === 'me' ? 'Pesan dari aku…' : `Pesan dari ${sideName}…`}
          onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(120, e.target.scrollHeight) + 'px'; }} />
        {text.trim()
          ? <button className="send-btn press" onClick={send} aria-label="Kirim"><Send size={20} /></button>
          : <button className="plus-btn press" onClick={() => { fx.tap(); setSheet('plus'); }} aria-label="Tambah"><Plus size={22} /></button>}
      </div>

      {/* hidden full-size render used for export */}
      <div className="offscreen" aria-hidden>
        {offUpto !== null || busy ? <Shot ref={offRef} chat={chat} upto={offUpto ?? undefined} /> : null}
      </div>

      {/* + menu */}
      <Sheet open={sheet === 'plus'} onClose={() => setSheet(null)} title="Tambah">
        <button className="menu-item press" onClick={() => addItem({ kind: 'time', text: timeLabel(chat.template, chat.clock) })}><Clock3 size={20} /> Pembatas waktu</button>
        <button className="menu-item press" onClick={() => addItem({ kind: 'typing', from: 'them' })}><MoreHorizontal size={20} /> {sideName} sedang mengetik…</button>
        <button className="menu-item press" onClick={() => addItem({ kind: 'typing', from: 'me' })}><MoreHorizontal size={20} /> Aku sedang mengetik…</button>
        <button className="menu-item press" onClick={() => { fx.toggle(); up(c => ({ ...c, messages: c.messages.map(m => (m.from ? { ...m, from: m.from === 'me' ? 'them' : 'me' } : m)) })); setSheet(null); }}>
          <ArrowLeftRight size={20} /> Tukar semua sisi (aku ↔ dia)
        </button>
        <button className="menu-item danger press" disabled={!msgs.length} onClick={() => {
          const old = msgs; fx.del(); up(c => ({ ...c, messages: [] })); setSheet(null);
          toast('Semua pesan dihapus', { label: 'URUNGKAN', fn: () => up(c => ({ ...c, messages: old })) });
        }}><Eraser size={20} /> Hapus semua pesan</button>
      </Sheet>

      {/* edit message */}
      <Sheet open={!!cur} onClose={() => setSheet(null)} title={cur?.kind === 'time' ? 'Edit pembatas waktu' : cur?.kind === 'typing' ? 'Indikator mengetik' : 'Edit pesan'}>
        {cur && (
          <>
            {cur.kind !== 'typing' && (
              <div className="field">
                <label>{cur.kind === 'time' ? 'Teks' : 'Isi pesan'}</label>
                {cur.kind === 'time'
                  ? <input className="input" value={cur.text} onChange={e => patchMsg(editIdx, { text: e.target.value })} />
                  : <textarea className="input" value={cur.text} onChange={e => patchMsg(editIdx, { text: e.target.value })} />}
              </div>
            )}
            {cur.kind !== 'time' && (
              <div className="field">
                <label>Dikirim oleh</label>
                <Seg value={cur.from} onChange={v => patchMsg(editIdx, { from: v })} options={[['me', 'Aku (kanan)'], ['them', `${sideName} (kiri)`]]} />
              </div>
            )}
            {cur.kind === 'msg' && (
              <div className="grid2">
                <div className="field">
                  <label>Jam</label>
                  <input className="input" type="time" value={cur.time || ''} onChange={e => patchMsg(editIdx, { time: e.target.value })} />
                </div>
                {cur.from === 'me' && (
                  <div className="field">
                    <label>Status</label>
                    <select className="input" value={cur.status || 'sent'} onChange={e => patchMsg(editIdx, { status: e.target.value })}>
                      {statusOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}
            <div className="grid2" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 4 }}>
              <button className="btn ghost press" onClick={() => move(editIdx, -1)}><ChevronUp size={18} /> Naik</button>
              <button className="btn ghost press" onClick={() => move(editIdx, 1)}><ChevronDown size={18} /> Turun</button>
              <button className="btn ghost press" onClick={() => { fx.tap(); up(c => { const l = [...c.messages]; l.splice(editIdx + 1, 0, { ...cur, id: uid() }); return { ...c, messages: l }; }); setSheet({ edit: editIdx + 1 }); }}><Copy size={17} /> Salin</button>
            </div>
            <div className="grid2" style={{ marginTop: 10 }}>
              <button className="btn danger press" onClick={() => removeMsg(editIdx)}><Trash2 size={18} /> Hapus</button>
              <button className="btn primary press" onClick={() => { fx.tap(); setSheet(null); }}><Check size={18} /> Selesai</button>
            </div>
          </>
        )}
      </Sheet>

      {/* chat settings */}
      <Sheet open={sheet === 'settings'} onClose={() => setSheet(null)} title="Atur chat">
        <div className="field">
          <label>Judul (hanya di aplikasi)</label>
          <input className="input" value={chat.title} onChange={e => up(c => ({ ...c, title: e.target.value }))} />
        </div>
        <div className="field">
          <label>Foto profil</label>
          <div className="avatar-pick">
            <div className="av">{chat.contact.avatar ? <img src={chat.contact.avatar} alt="" /> : <Camera size={24} />}</div>
            <label className="btn ghost press" style={{ height: 44, margin: 0 }}>
              <Camera size={17} /> Pilih foto
              <input type="file" accept="image/*" hidden onChange={async e => {
                const f = e.target.files?.[0]; e.target.value = '';
                if (!f) return;
                try { const a = await resizeImage(f); up(c => ({ ...c, contact: { ...c.contact, avatar: a } })); fx.success(); }
                catch { fx.error(); toast('Foto tidak bisa dibuka'); }
              }} />
            </label>
            {chat.contact.avatar && (
              <button className="icon-btn tinted press" onClick={() => { fx.del(); up(c => ({ ...c, contact: { ...c.contact, avatar: null } })); }} aria-label="Hapus foto"><ImageOff size={18} /></button>
            )}
          </div>
        </div>
        <div className="field">
          <label>Nama kontak</label>
          <input className="input" value={chat.contact.name} onChange={e => up(c => ({ ...c, contact: { ...c.contact, name: e.target.value } }))} />
        </div>
        {chat.template === 'whatsapp' && (
          <div className="field">
            <label>Status di bawah nama</label>
            <input className="input" value={chat.contact.status} placeholder="online / terakhir dilihat hari ini 19.30"
              onChange={e => up(c => ({ ...c, contact: { ...c.contact, status: e.target.value } }))} />
          </div>
        )}
        {chat.template === 'x' && (
          <div className="field">
            <label>Username</label>
            <input className="input" value={chat.contact.handle} onChange={e => up(c => ({ ...c, contact: { ...c.contact, handle: e.target.value.startsWith('@') ? e.target.value : '@' + e.target.value } }))} />
          </div>
        )}
        {chat.template === 'imessage' && (
          <>
            <div className="field">
              <label>Angka di tombol kembali (pesan belum dibaca)</label>
              <input className="input" inputMode="numeric" value={chat.contact.unread} onChange={e => up(c => ({ ...c, contact: { ...c.contact, unread: e.target.value.replace(/\D/g, '').slice(0, 4) } }))} />
            </div>
            <div className="field">
              <label>Warna gelembung aku</label>
              <div className="swatches">
                {['#0a84ff', '#30d158', '#bf5af2', '#ff375f', '#ff9f0a', '#5e5ce6'].map(col => (
                  <button key={col} className={'sw press' + (chat.meColor === col ? ' on' : '')} style={{ background: col }} onClick={() => { fx.tap(); up(c => ({ ...c, meColor: col })); }} aria-label={col} />
                ))}
              </div>
            </div>
          </>
        )}
        <div className="grid2">
          <div className="field">
            <label>Jam di status bar</label>
            <input className="input" type="time" value={chat.clock} onChange={e => up(c => ({ ...c, clock: e.target.value || c.clock }))} />
          </div>
          <div className="field">
            <label>Baterai: {chat.battery ?? 76}%</label>
            <input type="range" min="1" max="100" value={chat.battery ?? 76} style={{ width: '100%', height: 48, accentColor: tplColor }}
              onChange={e => up(c => ({ ...c, battery: +e.target.value }))} />
          </div>
        </div>
        <div className="field">
          <label>Ukuran gambar</label>
          <Seg value={chat.frame || 'phone'} onChange={v => up(c => ({ ...c, frame: v }))} options={[['phone', 'Layar HP (pas)'], ['auto', 'Panjang (semua pesan)']]} />
        </div>
        <div className="card group" style={{ boxShadow: 'none', background: 'var(--surface2)' }}>
          <div className="row"><span className="lbl">Tampilkan status bar</span><Switch on={chat.showStatusBar !== false} onChange={v => up(c => ({ ...c, showStatusBar: v }))} /></div>
          <div className="row"><span className="lbl">Tampilkan kolom ketik</span><Switch on={chat.showInput !== false} onChange={v => up(c => ({ ...c, showInput: v }))} /></div>
        </div>
      </Sheet>

      {/* export */}
      <Sheet open={sheet === 'export'} onClose={() => !busy && setSheet(null)} title="Simpan gambar">
        {busy ? (
          <div style={{ padding: '6px 0 20px' }}>
            <b>{busy.label}</b>
            <div className="progress"><i style={{ width: Math.round(busy.p * 100) + '%' }} /></div>
            <p className="note">Jangan tutup aplikasi dulu ya.</p>
          </div>
        ) : (
          <>
            <button className="menu-item press" onClick={() => doExport('save')}><Download size={20} />
              <span>Simpan ke galeri<br /><small className="note" style={{ padding: 0 }}>1 gambar PNG {chat.frame === 'auto' ? 'panjang' : 'seukuran layar HP'}</small></span></button>
            <button className="menu-item press" onClick={() => doExport('share')}><Share2 size={20} />
              <span>Bagikan<br /><small className="note" style={{ padding: 0 }}>Kirim ke WhatsApp, TikTok, CapCut, dll.</small></span></button>
            <button className="menu-item press" onClick={() => doExport('steps')}><Film size={20} />
              <span>Ekspor bertahap untuk video<br /><small className="note" style={{ padding: 0 }}>1 gambar tiap pesan baru ({msgs.filter(m => m.kind !== 'time').length} gambar)</small></span></button>
            <p className="note">Resolusi: {settings.exportScale === 3 ? '1170' : '780'} px lebar. Ubah di Pengaturan.</p>
          </>
        )}
      </Sheet>
    </>
  );
}
