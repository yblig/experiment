import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, SlidersHorizontal, Download, Send, Plus, Moon, Sun, ChevronUp, ChevronDown, Trash2, Copy, Undo2, Redo2, Play,
  Clock3, MoreHorizontal, Eraser, ArrowLeftRight, Camera, ImageOff, Share2, Film, Check, Image as ImageIcon, Mic, Phone, Ban,
  Type, Info, BellDot, FileText, Reply, X, Users, UserPlus, ClipboardCopy, Frame, MapPin, Sticker, Contact, BookmarkPlus, List, MoreVertical, ChevronDown as Caret, Minus, LayoutGrid, Clapperboard, Volume2
} from 'lucide-react';
import { useStore, TEMPLATES, uid, addMinutes, PCOLORS } from '../store.js';
import { Sheet, Seg, Switch, toast, useBack } from '../components/ui.jsx';
import Shot, { FRAMES } from '../templates/Shot.jsx';
import TplGrid, { TplIcon } from '../components/TplGrid.jsx';
import Player from './Player.jsx';
import { to12, LABELS, quoteText } from '../templates/parts.jsx';
import { renderPng, savePng, sharePngs, fileBase, frame916, FRAME_BGS, saveVideo, shareVideo } from '../exporter.js';
import { exportVideo, videoSupported } from '../video.js';
import { putImage, fileToDataUrl, pickFile, mediaUrl } from '../media.js';
import { parseScript, applyScript, chatToScript } from '../script.js';
import { fx } from '../fx.js';
import { playChatSound, soundUrl } from '../chatSounds.js';

const timeLabel = (tpl, clock) => (tpl === 'imessage' ? `Today ${to12(clock)}` : tpl === 'whatsapp' ? 'HARI INI' : tpl === 'telegram' ? 'Hari ini' : tpl === 'instagram' ? `Today ${to12(clock)}` : tpl === 'sms' || tpl === 'lock' ? 'Hari ini' : 'Today');
const isAutoLabel = (txt, clock) => Object.keys(TEMPLATES).some(t => timeLabel(t, clock) === txt) || /^Today( \d|$)/.test(txt) || txt === 'HARI INI' || txt === 'Hari ini';
const statusOpts = [['sent', 'Terkirim'], ['delivered', 'Diterima'], ['read', 'Dibaca']];
const REACTS = ['❤️', '😂', '😮', '😢', '🙏', '👍', '🔥', '💀'];
const TYPES = [['text', 'Teks', Type], ['image', 'Foto', ImageIcon], ['sticker', 'Stiker', Sticker], ['voice', 'Suara', Mic], ['call', 'Telepon', Phone], ['location', 'Lokasi', MapPin], ['contact', 'Kontak', Contact], ['deleted', 'Dihapus', Ban]];
const CALLS = [['missed-voice', 'Tak terjawab'], ['missed-video', 'Video tak terjawab'], ['voice', 'Suara'], ['video', 'Video']];
const SIZES = [
  ['916', 'TikTok', 'TikTok / Reels / Shorts', '9:16 · 1080×1920', [18, 32]],
  ['45', 'IG 4:5', 'Instagram feed', '4:5 · 1080×1350', [22, 27]],
  ['11', 'Kotak', 'Kotak', '1:1 · 1080×1080', [24, 24]],
  ['phone', 'Layar HP', 'Layar HP penuh', 'Seperti screenshot asli', [15, 32]],
  ['auto', 'Panjang', 'Panjang (semua pesan)', 'Tinggi mengikuti isi chat', [14, 34]]
];
const WALL_COLORS = ['#0b141a', '#1b2b34', '#3b2a4d', '#1f3b2c', '#efeae2', '#d9e7f2', '#fde2e4', '#fff3c4'];

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fallback below */ }
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  const ok = document.execCommand('copy'); ta.remove();
  return ok;
}

export default function Editor({ id, onClose }) {
  const chat = useStore(s => s.chats.find(c => c.id === id));
  useStore(s => s.histTick);
  const { updateChat, undo, redo, canUndo, canRedo, settings, setSettings, saveAsPreset } = useStore();
  const [view, setView] = useState('preview');
  const [side, setSide] = useState('me'); // 'me' | 'them' | participant id
  const [text, setText] = useState('');
  const [sheet, setSheet] = useState(null);
  const [box, setBox] = useState({ w: 360, h: 500 });
  const [shotH, setShotH] = useState(844);
  const [playing, setPlaying] = useState(false);
  const [script, setScript] = useState('');
  const [replying, setReplying] = useState(false);
  const stageRef = useRef(null);
  const shotRef = useRef(null);
  const offRef = useRef(null);
  const [offUpto, setOffUpto] = useState(null);
  const [busy, setBusy] = useState(null);
  const [offView, setOffView] = useState(null);
  const [vid, setVid] = useState({ speed: 1, sound: true, busy: null, result: null });

  useBack(!sheet && !playing, onClose);
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
  useEffect(() => { // keep the side valid when participants change
    if (!chat) return;
    if (chat.group && side === 'them' && chat.participants[0]) setSide(chat.participants[0].id);
    if (!chat.group && side !== 'me' && side !== 'them') setSide('them');
    if (chat.group && side !== 'me' && side !== 'them' && !chat.participants.find(p => p.id === side)) setSide('me');
  }, [chat?.group, chat?.participants, side]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!chat) return null;
  const up = (fn, rec) => updateChat(id, fn, rec);
  const msgs = chat.messages;
  const frameH = FRAMES[chat.frame || 'phone'] || 844;
  const scale = phone ? Math.min((box.w - 16) / 390, (box.h - 12) / frameH) : Math.min((box.w - 16) / 390, 1);
  const L = LABELS[chat.template] || LABELS.imessage;
  const sideFrom = side === 'me' ? 'me' : 'them';
  const sideSender = chat.group && side !== 'me' ? side : undefined;
  const sideName = side === 'me' ? 'Aku' : chat.group ? chat.participants.find(p => p.id === side)?.name || 'Dia' : chat.contact.name || 'Dia';
  const cycleSide = () => {
    fx.toggle();
    const order = chat.group ? ['me', ...chat.participants.map(p => p.id)] : ['me', 'them'];
    setSide(order[(order.indexOf(side) + 1) % order.length] || 'me');
  };
  const nextTime = () => {
    const last = [...msgs].reverse().find(m => m.time)?.time || chat.clock;
    return chat.autoTime ? addMinutes(last, 1) : (msgs.length ? last : chat.clock);
  };

  const pushMsg = m => {
    const time = nextTime();
    const msg = { id: uid(), kind: 'msg', from: sideFrom, sender: sideSender, text: '', time, status: sideFrom === 'me' ? 'read' : 'sent', ...m };
    up(c => {
      const list = [...c.messages];
      const last = list[list.length - 1];
      if (last?.kind === 'typing' && last.from === msg.from && last.sender === msg.sender) list.pop();
      return { ...c, messages: [...list, msg], clock: c.autoTime ? time : c.clock };
    });
    playChatSound(chat.template, msg.from === 'me' ? 'send' : 'recv');
  };
  const send = () => {
    const t = text.trim();
    if (!t) return;
    pushMsg({ text: t });
    setText('');
  };
  const addItem = item => { up(c => ({ ...c, messages: [...c.messages, { id: uid(), ...item }] })); setSheet(null); fx.receive(); };
  const addPhoto = async (type = 'image') => {
    setSheet(null);
    const f = await pickFile();
    if (!f) return;
    try { const ref = await putImage(await fileToDataUrl(f, type === 'sticker' ? 400 : 900)); pushMsg({ type, image: ref }); }
    catch { fx.error(); toast('Foto tidak bisa dibuka'); }
  };

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
    fx.del();
    up(c => ({ ...c, messages: c.messages.filter((_, j) => j !== i) }));
    setSheet(null);
    toast('Pesan dihapus', { label: 'URUNGKAN', fn: () => { undo(id); } });
  };
  const openEdit = i => { fx.tap(); setReplying(false); setSheet({ edit: i }); };

  // ---------- export ----------
  const waitFrames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 80))));
  const shoot = async upto => {
    setOffUpto(upto);
    await waitFrames();
    const fixed = ['916', '45', '11'].includes(chat.frame);
    const OUT = { '916': [1080, 1920], '45': [1080, 1350], '11': [1080, 1080] };
    const png = await renderPng(offRef.current, fixed ? 1080 / 390 : settings.exportScale, chat.template, fixed ? OUT[chat.frame] : null);
    return settings.frame916 ? frame916(png, settings.frameBg) : png;
  };
  const doExport = async mode => {
    if (busy) return;
    const base = fileBase(chat.title);
    try {
      if (mode === 'steps') {
        const stops = msgs.map((m, i) => (!['time', 'system', 'unread'].includes(m.kind) ? i + 1 : null)).filter(Boolean);
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

  const OUTS = { '916': [1080, 1920], '45': [1080, 1350], '11': [1080, 1080] };
  const makeVideo = async () => {
    if (vid.busy) return;
    if (!msgs.some(m => m.kind === 'msg')) { fx.error(); toast('Tambahkan pesan dulu'); return; }
    setVid(v => ({ ...v, busy: { label: 'Menyiapkan…', p: 0 }, result: null }));
    try {
      const renderScene = async (view, phase) => {
        setOffView({ chat: view, phase });
        await waitFrames();
        const fr = view.frame;
        return renderPng(offRef.current, 1080 / 390, chat.template, OUTS[fr] || null);
      };
      const res = await exportVideo({ chat, renderScene, sounds: { send: soundUrl(chat.template, 'send'), receive: soundUrl(chat.template, 'recv') }, speed: vid.speed, sound: vid.sound, bgIdx: settings.frameBg || 0,
        onProgress: (label, p) => setVid(v => ({ ...v, busy: { label, p } })) });
      setVid(v => ({ ...v, busy: { label: 'Menyimpan video…', p: 0.97 } }));
      const name = fileBase(chat.title);
      const where = await saveVideo(res.blob, name);
      fx.success();
      setVid(v => ({ ...v, busy: null, result: { ...res, name, where, url: URL.createObjectURL(res.blob) } }));
    } catch (e) {
      fx.error();
      setVid(v => ({ ...v, busy: null }));
      toast('Gagal membuat video: ' + (e?.message || e));
    } finally { setOffView(null); }
  };

  const tplColor = TEMPLATES[chat.template]?.color || '#7c6cff';
  const parsed = sheet === 'import' && script.trim() ? parseScript(script, chat) : null;
  const pickReplyable = msgs.map((m, i) => ({ m, i })).filter(({ m, i }) => m.kind === 'msg' && i !== editIdx);
  const nameOf = m => (m.from === 'me' ? 'Aku' : chat.group ? chat.participants.find(p => p.id === m.sender)?.name || 'Dia' : chat.contact.name || 'Dia');

  return (
    <>
      <div className="ed-top">
        <button className="icon-btn press" onClick={() => { fx.tap(); onClose(); }} aria-label="Kembali"><ArrowLeft size={24} /></button>
        <button className="ed-tpl press" onClick={() => { fx.tap(); setSheet('settings'); }}>
          <TplIcon k={chat.template} size={30} /><span className="t">{chat.title}</span>
        </button>
        <button className="icon-btn press" disabled={!canUndo(id)} onClick={() => { fx.tap(); undo(id); }} aria-label="Urungkan"><Undo2 size={20} /></button>
        <button className="icon-btn press" disabled={!canRedo(id)} onClick={() => { fx.tap(); redo(id); }} aria-label="Ulangi"><Redo2 size={20} /></button>
        <button className={'icon-btn press' + (view === 'list' ? ' tinted' : '')} onClick={() => { fx.toggle(); setView(v => (v === 'list' ? 'preview' : 'list')); }} aria-label="Daftar pesan">{view === 'list' ? <LayoutGrid size={20} /> : <List size={21} />}</button>
        <button className="icon-btn tinted press" onClick={() => { fx.tap(); setSheet('settings'); }} aria-label="Pengaturan"><SlidersHorizontal size={20} /></button>
        <button className="icon-btn press" onClick={() => { fx.tap(); setSheet('export'); }} aria-label="Lainnya"><MoreVertical size={21} /></button>
      </div>

      {view === 'preview' ? (
        <div className={'stage pov' + (phone ? '' : ' scrolly')} ref={stageRef}>
          <div style={{ width: 390 * scale, height: shotH * scale, margin: '2px auto 90px', flexShrink: 0 }}>
            <motion.div className="stage-inner frame" style={{ width: 390, transform: `scale(${scale})`, transformOrigin: 'top left' }}
              key={chat.template} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
              <Shot ref={shotRef} chat={chat} onTap={openEdit} />
            </motion.div>
          </div>
          {msgs.length < 4 && <div className="hint" style={{ bottom: 'auto', top: 10 }}>{msgs.length ? 'Ketuk gelembung untuk mengedit' : 'Tulis pesan pertama di bawah ↓'}</div>}
        </div>
      ) : (
        <div className="scroll list" ref={stageRef}>
          {msgs.length === 0 && <p className="note" style={{ textAlign: 'center', padding: 30 }}>Belum ada pesan. Tulis di bawah, atau impor naskah dari menu +.</p>}
          {msgs.map((m, i) => {
            const label = m.kind === 'time' ? 'WAKTU' : m.kind === 'system' ? 'INFO' : m.kind === 'unread' ? 'BARU' : nameOf(m).toUpperCase().slice(0, 8);
            return (
              <motion.div layout key={m.id} className="li press" onClick={() => openEdit(i)} transition={{ duration: 0.2 }}>
                <span className={'who ' + (['time', 'system', 'unread'].includes(m.kind) ? 'time' : m.from)}>{label}</span>
                <span className="txt">
                  {m.kind === 'typing' ? <i style={{ color: 'var(--sub)' }}>sedang mengetik…</i> : m.kind === 'msg' ? (m.reaction ? m.reaction + ' ' : '') + quoteText(m, chat.template) : m.text}
                </span>
                {m.kind === 'msg' && <span className="tm">{m.time}</span>}
                <span className="mv" onClick={e => e.stopPropagation()}>
                  <button onClick={() => move(i, -1)} aria-label="Naik"><ChevronUp size={18} /></button>
                  <button onClick={() => move(i, 1)} aria-label="Turun"><ChevronDown size={18} /></button>
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {view === 'preview' && (
        <div className="pov-fabs">
          <button className="pov-save press" onClick={() => { fx.tap(); doExport('save'); }} aria-label="Simpan" disabled={!!busy}>
            {busy ? <span className="spin" /> : <Download size={28} strokeWidth={2.2} />}
          </button>
          <button className="pov-size press" onClick={() => { fx.tap(); setSheet('size'); }}>{(SIZES.find(x => x[0] === (chat.frame || 'phone')) || SIZES[3])[1]}<Caret size={18} /></button>
          <button className="pov-play press" disabled={!msgs.length} onClick={() => { fx.tap(); setPlaying(true); }} aria-label="Putar"><Play size={20} fill="currentColor" /></button>
          <button className="pov-size press" disabled={!msgs.length} onClick={() => { fx.tap(); setVid(v => ({ ...v, result: null })); setSheet('video'); }}><Clapperboard size={19} /> Video</button>
        </div>
      )}

      <div className="composer">
        <button className={'side-btn press ' + sideFrom} onClick={cycleSide}
          style={chat.group && side !== 'me' ? { color: chat.participants.find(p => p.id === side)?.color } : null}>
          {chat.group ? <Users size={15} /> : <ArrowLeftRight size={15} />}{sideName.length > 7 ? sideName.slice(0, 6) + '…' : sideName}
        </button>
        <textarea className="comp-field" rows={1} value={text} placeholder={side === 'me' ? 'Pesan dari aku…' : `Pesan dari ${sideName}…`}
          onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(120, e.target.scrollHeight) + 'px'; }} />
        {text.trim()
          ? <button className="send-btn press" onClick={send} aria-label="Kirim"><Send size={20} /></button>
          : <button className="plus-btn press" onClick={() => { fx.tap(); setSheet('plus'); }} aria-label="Tambah"><Plus size={22} /></button>}
      </div>

      <div className="offscreen" aria-hidden>
        {offView ? <Shot ref={offRef} chat={offView.chat} phase={offView.phase} />
          : offUpto !== null || busy ? <Shot ref={offRef} chat={chat} upto={offUpto ?? undefined} /> : null}
      </div>

      <AnimatePresence>{playing && <Player key="pl" chat={chat} onClose={() => setPlaying(false)} />}</AnimatePresence>

      {/* + menu */}
      <Sheet open={sheet === 'plus'} onClose={() => setSheet(null)} title={`Tambah (dari ${sideName})`}>
        <div className="type-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 8 }}>
          <button className="press" onClick={() => addPhoto('image')}><ImageIcon size={22} />Foto</button>
          <button className="press" onClick={() => addPhoto('sticker')}><Sticker size={22} />Stiker</button>
          <button className="press" onClick={() => { setSheet(null); pushMsg({ type: 'location', place: 'Lokasi saya', address: 'Jl. Merdeka No. 17' }); }}><MapPin size={22} />Lokasi</button>
          <button className="press" onClick={() => { setSheet(null); pushMsg({ type: 'contact', cname: 'Budi Santoso', phone: '+62 812-3456-7890' }); }}><Contact size={22} />Kontak</button>
          <button className="press" onClick={() => { setSheet(null); pushMsg({ type: 'voice', duration: '0:' + String(5 + Math.floor(Math.random() * 50)).padStart(2, '0') }); }}><Mic size={22} />Voice note</button>
          <button className="press" onClick={() => { setSheet(null); pushMsg({ type: 'call', call: 'missed-voice' }); }}><Phone size={22} />Telepon</button>
          <button className="press" onClick={() => { setSheet(null); pushMsg({ type: 'deleted' }); }}><Ban size={22} />Dihapus</button>
        </div>
        <button className="menu-item press" onClick={() => addItem({ kind: 'typing', from: sideFrom, sender: sideSender })}><MoreHorizontal size={20} /> {sideName} sedang mengetik…</button>
        <button className="menu-item press" onClick={() => addItem({ kind: 'time', text: timeLabel(chat.template, chat.clock) })}><Clock3 size={20} /> Pembatas waktu</button>
        <button className="menu-item press" onClick={() => addItem({ kind: 'unread', text: L.unread })}><BellDot size={20} /> Pembatas "belum dibaca"</button>
        <button className="menu-item press" onClick={() => addItem({ kind: 'system', text: chat.group ? `${chat.participants[0]?.name || 'Dimas'} keluar` : 'Kamu memblokir kontak ini' })}><Info size={20} /> Pesan sistem</button>
        <button className="menu-item press" onClick={() => { fx.tap(); setScript(''); setSheet('import'); }}><FileText size={20} /> Impor naskah teks</button>
        <button className="menu-item press" onClick={() => { fx.toggle(); up(c => ({ ...c, messages: c.messages.map(m => (m.from ? { ...m, from: m.from === 'me' ? 'them' : 'me', sender: m.from === 'me' ? c.participants[0]?.id : undefined } : m)) })); setSheet(null); }}>
          <ArrowLeftRight size={20} /> Tukar semua sisi (aku ↔ dia)
        </button>
        <button className="menu-item danger press" disabled={!msgs.length} onClick={() => {
          fx.del(); up(c => ({ ...c, messages: [] })); setSheet(null);
          toast('Semua pesan dihapus', { label: 'URUNGKAN', fn: () => undo(id) });
        }}><Eraser size={20} /> Hapus semua pesan</button>
      </Sheet>

      {/* import script */}
      <Sheet open={sheet === 'import'} onClose={() => setSheet(null)} title="Impor naskah">
        <p className="note" style={{ padding: '0 2px 10px' }}>
          Satu baris satu pesan. <b>Aku:</b> untuk pesanmu, <b>Nama:</b> untuk lawan bicara (2 nama atau lebih otomatis jadi grup).
          <br /><b>---</b> pembatas waktu · <b>*</b> pesan sistem · <b>Dia: ...</b> sedang mengetik
        </p>
        <textarea className="input" style={{ minHeight: 180, fontFamily: 'monospace', fontSize: 13.5 }} value={script} onChange={e => setScript(e.target.value)}
          placeholder={'--- Hari ini\nDimas: bro udah bangun?\nAku: baru aja\nDimas: buruan, dosen udah dateng\nAku: HAH'} />
        <p className="note">{parsed ? `${parsed.items.length} item terbaca${parsed.names.length ? ' · ' + parsed.names.join(', ') : ''}` : 'Tempel atau ketik naskahmu di atas.'}</p>
        <div className="grid2" style={{ marginTop: 10 }}>
          <button className="btn ghost press" disabled={!parsed?.items.length} onClick={() => { up(c => applyScript(c, parsed, true)); fx.success(); setSheet(null); toast('Chat diganti dengan naskah'); }}>Ganti semua</button>
          <button className="btn primary press" disabled={!parsed?.items.length} onClick={() => { up(c => applyScript(c, parsed, false)); fx.success(); setSheet(null); toast(`${parsed.items.length} pesan ditambahkan`); }}>Tambahkan</button>
        </div>
      </Sheet>

      {/* edit message */}
      <Sheet open={!!cur} onClose={() => setSheet(null)} title={cur?.kind === 'time' ? 'Pembatas waktu' : cur?.kind === 'typing' ? 'Indikator mengetik' : cur?.kind === 'system' ? 'Pesan sistem' : cur?.kind === 'unread' ? 'Pembatas belum dibaca' : 'Edit pesan'}>
        {cur && (
          <>
            {cur.kind === 'msg' && (
              <div className="field">
                <label>Jenis</label>
                <div className="type-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                  {TYPES.map(([v, l, I]) => (
                    <button key={v} className={'press' + ((cur.type || 'text') === v ? ' on' : '')} onClick={() => { fx.tap(); patchMsg(editIdx, { type: v, ...(v === 'call' && !cur.call ? { call: 'missed-voice' } : {}), ...(v === 'voice' && !cur.duration ? { duration: '0:12' } : {}) }); }}>
                      <I size={20} />{l}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {cur.kind === 'msg' && cur.type === 'location' && (
              <div className="grid2">
                <div className="field"><label>Nama tempat</label><input className="input" value={cur.place || ''} onChange={e => patchMsg(editIdx, { place: e.target.value })} /></div>
                <div className="field"><label>Alamat</label><input className="input" value={cur.address || ''} onChange={e => patchMsg(editIdx, { address: e.target.value })} /></div>
              </div>
            )}
            {cur.kind === 'msg' && cur.type === 'contact' && (
              <div className="grid2">
                <div className="field"><label>Nama kontak</label><input className="input" value={cur.cname || ''} onChange={e => patchMsg(editIdx, { cname: e.target.value })} /></div>
                <div className="field"><label>Nomor</label><input className="input" inputMode="tel" value={cur.phone || ''} onChange={e => patchMsg(editIdx, { phone: e.target.value })} /></div>
              </div>
            )}
            {cur.kind === 'msg' && (cur.type || 'text') === 'text' && /(https?:\/\/|www\.)/i.test(cur.text || '') && (
              <div className="field"><label>Judul pratinjau link</label><input className="input" value={cur.linkTitle || ''} placeholder="Judul halaman" onChange={e => patchMsg(editIdx, { linkTitle: e.target.value })} /></div>
            )}
            {cur.kind === 'msg' && (cur.type === 'image' || cur.type === 'sticker') && (
              <div className="field">
                <label>Foto</label>
                <div className="img-pick">
                  {cur.image ? <img src={mediaUrl(cur.image)} alt="" /> : null}
                  <button className="btn ghost press" style={{ height: 44 }} onClick={async () => {
                    const f = await pickFile(); if (!f) return;
                    try { patchMsg(editIdx, { image: await putImage(await fileToDataUrl(f)) }); fx.success(); } catch { fx.error(); toast('Foto tidak bisa dibuka'); }
                  }}><Camera size={17} /> {cur.image ? 'Ganti foto' : 'Pilih foto'}</button>
                </div>
              </div>
            )}
            {(cur.kind !== 'typing' && cur.kind !== 'msg') || (cur.kind === 'msg' && ['text', 'image', undefined].includes(cur.type)) ? (
              <div className="field">
                <label>{cur.kind === 'msg' ? (cur.type === 'image' ? 'Keterangan foto (boleh kosong)' : 'Isi pesan') : 'Teks'}</label>
                {cur.kind === 'msg'
                  ? <textarea className="input" value={cur.text} onChange={e => patchMsg(editIdx, { text: e.target.value })} />
                  : <input className="input" value={cur.text} onChange={e => patchMsg(editIdx, { text: e.target.value })} />}
              </div>
            ) : null}
            {cur.kind === 'msg' && cur.type === 'voice' && (
              <div className="field"><label>Durasi</label>
                <input className="input" value={cur.duration || ''} placeholder="0:12" onChange={e => patchMsg(editIdx, { duration: e.target.value.slice(0, 6) })} /></div>
            )}
            {cur.kind === 'msg' && cur.type === 'call' && (
              <div className="field"><label>Jenis panggilan</label>
                <div className="mini-row">
                  {CALLS.map(([v, l]) => <button key={v} className={'chip press' + ((cur.call || 'missed-voice') === v ? ' on' : '')} style={{ '--c': v.startsWith('missed') ? '#ff6b6b' : '#2fd6a3' }} onClick={() => { fx.tap(); patchMsg(editIdx, { call: v }); }}><i />{l}</button>)}
                </div>
              </div>
            )}
            {(cur.kind === 'msg' || cur.kind === 'typing') && (
              <div className="field">
                <label>Dikirim oleh</label>
                {chat.group ? (
                  <div className="mini-row">
                    {[['me', 'Aku', 'var(--accent)'], ...chat.participants.map(p => [p.id, p.name, p.color])].map(([v, n, col]) => {
                      const on = v === 'me' ? cur.from === 'me' : cur.from !== 'me' && (cur.sender || chat.participants[0]?.id) === v;
                      return <button key={v} className={'chip press' + (on ? ' on' : '')} style={{ '--c': col }} onClick={() => { fx.tap(); patchMsg(editIdx, v === 'me' ? { from: 'me' } : { from: 'them', sender: v }); }}><i />{n}</button>;
                    })}
                  </div>
                ) : <Seg value={cur.from} onChange={v => patchMsg(editIdx, { from: v })} options={[['me', 'Aku (kanan)'], ['them', `${chat.contact.name || 'Dia'} (kiri)`]]} />}
              </div>
            )}
            {cur.kind === 'msg' && (
              <>
                <div className="grid2">
                  <div className="field">
                    <label>Jam</label>
                    <input className="input" type="time" value={cur.time || ''} onChange={e => patchMsg(editIdx, { time: e.target.value })} />
                  </div>
                  {cur.from === 'me' ? (
                    <div className="field">
                      <label>Status</label>
                      <select className="input" value={cur.status || 'sent'} onChange={e => patchMsg(editIdx, { status: e.target.value })}>
                        {statusOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  ) : <div />}
                </div>
                <div className="field">
                  <label>Reaksi</label>
                  <div className="emoji-row">
                    {REACTS.map(e => <button key={e} className={'press' + (cur.reaction === e ? ' on' : '')} onClick={() => { fx.tap(); patchMsg(editIdx, { reaction: cur.reaction === e ? '' : e }); }}>{e}</button>)}
                    <input className="input" style={{ width: 70, height: 44, textAlign: 'center', padding: 0 }} placeholder="lain" value={REACTS.includes(cur.reaction) ? '' : cur.reaction || ''}
                      onChange={e => patchMsg(editIdx, { reaction: e.target.value.slice(0, 8) })} />
                  </div>
                </div>
                <div className="field">
                  <label>Membalas pesan</label>
                  {cur.replyTo && msgs.find(m => m.id === cur.replyTo) ? (
                    <div className="li" style={{ marginBottom: 0 }}>
                      <Reply size={16} />
                      <span className="txt">{quoteText(msgs.find(m => m.id === cur.replyTo), chat.template)}</span>
                      <button className="icon-btn press" style={{ width: 34, height: 34 }} onClick={() => { fx.tap(); patchMsg(editIdx, { replyTo: null }); }} aria-label="Hapus balasan"><X size={16} /></button>
                    </div>
                  ) : (
                    <button className="btn ghost press block" style={{ height: 44 }} disabled={!pickReplyable.length} onClick={() => { fx.tap(); setReplying(r => !r); }}><Reply size={17} /> Pilih pesan yang dibalas</button>
                  )}
                  {replying && !cur.replyTo && (
                    <div className="reply-list" style={{ marginTop: 8 }}>
                      {pickReplyable.map(({ m }) => (
                        <button key={m.id} className="press" onClick={() => { fx.tap(); patchMsg(editIdx, { replyTo: m.id }); setReplying(false); }}>
                          <b>{nameOf(m)}:</b> {quoteText(m, chat.template)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card group" style={{ boxShadow: 'none', background: 'var(--surface2)' }}>
                  <div className="row"><span className="lbl">Tandai "diedit"</span><Switch on={!!cur.edited} onChange={v => patchMsg(editIdx, { edited: v })} /></div>
                </div>
              </>
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

      {/* video */}
      <Sheet open={sheet === 'video'} onClose={() => !vid.busy && setSheet(null)} title="Ekspor video MP4">
        {!videoSupported() ? (
          <p className="note" style={{ padding: '0 2px 16px' }}>HP ini belum mendukung pembuatan video di dalam aplikasi. Pakai <b>Mode Putar</b> + perekam layar, atau update Android System WebView di Play Store lalu coba lagi.</p>
        ) : vid.busy ? (
          <div style={{ padding: '6px 0 20px' }}>
            <b>{vid.busy.label}</b>
            <div className="progress"><i style={{ width: Math.round(vid.busy.p * 100) + '%' }} /></div>
            <p className="note">Video dibuat langsung di HP. Jangan tutup aplikasi dulu ya.</p>
          </div>
        ) : vid.result ? (
          <div style={{ paddingBottom: 12 }}>
            <video src={vid.result.url} controls playsInline style={{ width: '100%', maxHeight: 360, borderRadius: 14, background: '#000' }} />
            <p className="note">{vid.result.where} · {Math.round(vid.result.seconds)} detik · {(vid.result.blob.size / 1048576).toFixed(1)} MB{vid.result.audio ? '' : ' · tanpa suara (HP tidak mendukung)'}</p>
            <div className="grid2" style={{ marginTop: 10 }}>
              <button className="btn ghost press" onClick={() => setVid(v => ({ ...v, result: null }))}>Buat lagi</button>
              <button className="btn primary press" onClick={async () => { try { await shareVideo(vid.result.blob, vid.result.name); } catch { /* cancelled */ } }}><Share2 size={18} /> Bagikan</button>
            </div>
          </div>
        ) : (
          <>
            <p className="note" style={{ padding: '0 2px 12px' }}>Pesan muncul satu per satu, "mengetik…" muncul sebelum tiap balasan, plus suara kirim/terima. Ukuran video 1080×1920{chat.frame === '916' ? '' : ' (layar chat ditaruh di atas latar gradasi, pilih ukuran TikTok supaya penuh)'}.</p>
            <div className="field">
              <label>Kecepatan</label>
              <Seg value={vid.speed} onChange={v => setVid(x => ({ ...x, speed: v }))} options={[[1.4, 'Santai'], [1, 'Normal'], [0.7, 'Cepat']]} />
            </div>
            <div className="card group" style={{ boxShadow: 'none', background: 'var(--surface2)', marginBottom: 14 }}>
              <div className="row"><Volume2 size={19} /><span className="lbl">Suara notifikasi<small>{settings.sendSound?.ref || settings.recvSound?.ref ? 'Pakai suara pilihanmu' : `Suara khas ${TEMPLATES[chat.template]?.label}`} · ganti di Pengaturan</small></span><Switch on={vid.sound} onChange={v => setVid(x => ({ ...x, sound: v }))} /></div>
            </div>
            {chat.frame !== '916' && (
              <div className="field">
                <label>Latar</label>
                <div className="frame-bgs">
                  {FRAME_BGS.map(([a, b], i) => (
                    <button key={i} className={'press' + ((settings.frameBg || 0) === i ? ' on' : '')} style={{ background: `linear-gradient(135deg,${a},${b})` }} onClick={() => { fx.tap(); setSettings({ frameBg: i }); }} aria-label={'Latar ' + (i + 1)} />
                  ))}
                </div>
              </div>
            )}
            <button className="btn primary block press" onClick={makeVideo}><Clapperboard size={19} /> Buat video</button>
          </>
        )}
      </Sheet>

      {/* size */}
      <Sheet open={sheet === 'size'} onClose={() => setSheet(null)} title="Ukuran POV">
        {SIZES.map(([v, , name, sub, [w, h]]) => (
          <button key={v} className={'size-opt press' + ((chat.frame || 'phone') === v ? ' on' : '')} onClick={() => { fx.toggle(); up(c => ({ ...c, frame: v })); setSheet(null); }}>
            <span className="size-box"><i style={{ width: w, height: h }} /></span>
            <span style={{ flex: 1 }}><b>{name}</b><small>{sub}</small></span>
            {(chat.frame || 'phone') === v && <Check size={20} />}
          </button>
        ))}
      </Sheet>

      {/* chat settings */}
      <Sheet open={sheet === 'settings'} onClose={() => setSheet(null)} title="Pengaturan">
        <TplGrid value={chat.template} onPick={k => up(c => ({ ...c, template: k, messages: c.messages.map(m => (m.kind === 'time' && isAutoLabel(m.text, c.clock) ? { ...m, text: timeLabel(k, c.clock) } : m)) }))} />
        <div className="ref">
          <Seg value={chat.dark ? 'dark' : 'light'} onChange={v => up(c => ({ ...c, dark: v === 'dark' }))} options={[['light', 'Mode terang'], ['dark', 'Mode gelap']]} />
          {chat.template === 'whatsapp' && <Seg value={chat.waStyle || 'android'} onChange={v => up(c => ({ ...c, waStyle: v }))} options={[['ios', 'WA iPhone'], ['android', 'WA Android']]} />}
        </div>
        <div className="ref ref-row">
          <span className="ref-lbl">{chat.template === 'lock' ? 'Jam layar kunci' : 'Jam sekarang'}</span>
          <input className="ref-val" type="time" value={chat.clock} onChange={e => up(c => ({ ...c, clock: e.target.value || c.clock }))} />
        </div>
        <div className="ref">
          <span className="ref-lbl">Gaya teks</span>
          <Seg value={chat.textStyle || 'normal'} onChange={v => up(c => ({ ...c, textStyle: v }))} options={[['normal', 'Normal'], ['bold', 'Tebal'], ['italic', 'Miring'], ['bolditalic', 'Tebal miring']]} />
        </div>
        <div className="ref">
          <span className="ref-lbl">Ketebalan gelembung</span>
          <Seg value={chat.bubble || 'original'} onChange={v => up(c => ({ ...c, bubble: v }))} options={[['thin', 'Tipis'], ['original', 'Original'], ['thick', 'Tebal']]} />
        </div>
        <div className="ref">
          <input className="ref-in" inputMode="numeric" placeholder="Pesan belum dibaca" value={chat.contact.unread}
            onChange={e => up(c => ({ ...c, contact: { ...c.contact, unread: e.target.value.replace(/\D/g, '').slice(0, 4) } }))} />
        </div>
        <div className="ref ref-row">
          <input className="ref-in" style={{ flex: 1 }} placeholder="Status obrolan" disabled={chat.statusDefault} value={chat.statusDefault ? '' : chat.contact.status}
            onChange={e => up(c => ({ ...c, contact: { ...c.contact, status: e.target.value } }))} />
          <button className={'chk press' + (chat.statusDefault ? ' on' : '')} onClick={() => { fx.toggle(); up(c => ({ ...c, statusDefault: !c.statusDefault })); }}>
            <i>{chat.statusDefault && <Check size={16} strokeWidth={3} />}</i>Gunakan<br />default
          </button>
        </div>
        <div className="ref ref-row">
          <span className="ref-lbl">Bilah status baru</span>
          <Switch on={chat.sbStyle === 'ios' || (chat.sbStyle !== 'android' && !['whatsapp', 'telegram', 'sms', 'line', 'kakao'].includes(chat.template)) || (chat.sbStyle !== 'android' && chat.template === 'whatsapp' && chat.waStyle === 'ios')}
            onChange={v => up(c => ({ ...c, sbStyle: v ? 'ios' : 'android' }))} />
        </div>
        <div className="ref">
          <span className="ref-lbl">Wallpaper</span>
          <div className="wp-tiles">
            <button className={'wp-tile press' + (chat.wallpaper.type !== 'image' ? ' on' : '')} onClick={() => { fx.tap(); up(c => ({ ...c, wallpaper: { type: 'default', value: '' } })); }}>Gunakan default</button>
            <button className={'wp-tile photo press' + (chat.wallpaper.type === 'image' ? ' on' : '')} style={chat.wallpaper.type === 'image' ? { backgroundImage: `url("${mediaUrl(chat.wallpaper.value)}")` } : null}
              onClick={async () => { const f = await pickFile(); if (!f) return; try { const ref = await putImage(await fileToDataUrl(f, 1400)); up(c => ({ ...c, wallpaper: { type: 'image', value: ref } })); fx.success(); } catch { fx.error(); } }}>
              <span className="plus"><Plus size={18} /></span>Foto Anda
            </button>
          </div>
          {['whatsapp', 'telegram', 'lock', 'line', 'kakao'].includes(chat.template) && (
            <div className="swatches" style={{ marginTop: 12 }}>
              {WALL_COLORS.map(col => (
                <button key={col} className={'sw press' + (chat.wallpaper.type === 'color' && chat.wallpaper.value === col ? ' on' : '')} style={{ background: col, outline: '1px solid var(--line)' }}
                  onClick={() => { fx.tap(); up(c => ({ ...c, wallpaper: { type: 'color', value: col } })); }} aria-label={col} />
              ))}
            </div>
          )}
        </div>
        <div className="ref">
          <span className="ref-lbl">Ukuran teks</span>
          <div className="stepper">
            <button className="press" onClick={() => { fx.tap(); up(c => ({ ...c, textScale: Math.max(0.82, +((c.textScale || 1) - 0.06).toFixed(2)) })); }} aria-label="Kecilkan"><Minus size={26} /></button>
            <b>{Math.round(((chat.textScale || 1) - 1) / 0.06)}</b>
            <button className="press" onClick={() => { fx.tap(); up(c => ({ ...c, textScale: Math.min(1.36, +((c.textScale || 1) + 0.06).toFixed(2)) })); }} aria-label="Besarkan"><Plus size={26} /></button>
          </div>
        </div>

        <div className="sheet-sec">Profil</div>
        <div className="field">
          <label>Judul (hanya di aplikasi)</label>
          <input className="input" value={chat.title} onChange={e => up(c => ({ ...c, title: e.target.value }))} />
        </div>
        <div className="field">
          <label>Foto profil {chat.group ? 'grup' : ''}</label>
          <div className="avatar-pick">
            <div className="av">{chat.contact.avatar ? <img src={chat.contact.avatar} alt="" /> : <Camera size={24} />}</div>
            <button className="btn ghost press" style={{ height: 44 }} onClick={async () => {
              const f = await pickFile(); if (!f) return;
              try { const a = await fileToDataUrl(f, 320, true); up(c => ({ ...c, contact: { ...c.contact, avatar: a } })); fx.success(); }
              catch { fx.error(); toast('Foto tidak bisa dibuka'); }
            }}><Camera size={17} /> Pilih foto</button>
            {chat.contact.avatar && (
              <button className="icon-btn tinted press" onClick={() => { fx.del(); up(c => ({ ...c, contact: { ...c.contact, avatar: null } })); }} aria-label="Hapus foto"><ImageOff size={18} /></button>
            )}
          </div>
        </div>
        <div className="field">
          <label>{chat.group ? 'Nama grup' : 'Nama kontak'}</label>
          <input className="input" value={chat.contact.name} onChange={e => up(c => ({ ...c, contact: { ...c.contact, name: e.target.value } }))} />
        </div>
        {['x', 'instagram'].includes(chat.template) && (
          <div className="field">
            <label>Username</label>
            <input className="input" value={chat.contact.handle} onChange={e => up(c => ({ ...c, contact: { ...c.contact, handle: e.target.value.startsWith('@') ? e.target.value : '@' + e.target.value } }))} />
          </div>
        )}
        {chat.template === 'imessage' && (
          <div className="field">
            <label>Warna gelembung aku</label>
            <div className="swatches">
              {['#0a84ff', '#30d158', '#bf5af2', '#ff375f', '#ff9f0a', '#5e5ce6'].map(col => (
                <button key={col} className={'sw press' + (chat.meColor === col ? ' on' : '')} style={{ background: col }} onClick={() => { fx.tap(); up(c => ({ ...c, meColor: col })); }} aria-label={col} />
              ))}
            </div>
          </div>
        )}
        <div className="card group" style={{ boxShadow: 'none', background: 'var(--surface2)' }}>
          <div className="row"><span className="lbl">Chat grup<small>Banyak anggota dengan nama berwarna</small></span>
            <Switch on={chat.group} onChange={v => up(c => ({ ...c, group: v, participants: v && !c.participants.length ? [{ id: uid(), name: c.contact.name && c.contact.name !== 'Unknown' ? c.contact.name : 'Dimas', color: PCOLORS[0], avatar: null }, { id: uid(), name: 'Sari', color: PCOLORS[2], avatar: null }] : c.participants }))} /></div>
        </div>
        {chat.group && (
          <div className="field" style={{ marginTop: 12 }}>
            <label>Anggota (ketuk titik untuk ganti warna)</label>
            {chat.participants.map(p => (
              <div className="part" key={p.id}>
                <button className="dot press" style={{ background: p.color }} aria-label="Warna"
                  onClick={() => { fx.tap(); up(c => ({ ...c, participants: c.participants.map(x => (x.id === p.id ? { ...x, color: PCOLORS[(PCOLORS.indexOf(x.color) + 1) % PCOLORS.length] } : x)) })); }} />
                <input className="input" value={p.name} onChange={e => up(c => ({ ...c, participants: c.participants.map(x => (x.id === p.id ? { ...x, name: e.target.value } : x)) }))} />
                <button className="icon-btn tinted press" disabled={chat.participants.length <= 1} onClick={() => { fx.del(); up(c => ({ ...c, participants: c.participants.filter(x => x.id !== p.id) })); }} aria-label="Hapus anggota"><Trash2 size={17} /></button>
              </div>
            ))}
            <button className="btn ghost press block" style={{ height: 44 }} onClick={() => { fx.tap(); up(c => ({ ...c, participants: [...c.participants, { id: uid(), name: 'Anggota ' + (c.participants.length + 1), color: PCOLORS[c.participants.length % PCOLORS.length], avatar: null }] })); }}>
              <UserPlus size={17} /> Tambah anggota
            </button>
          </div>
        )}

        <div className="sheet-sec">Lainnya</div>
        {chat.template === 'lock' && (
          <div className="grid2">
            <div className="field"><label>Nama aplikasi di notifikasi</label><input className="input" value={chat.lockApp} onChange={e => up(c => ({ ...c, lockApp: e.target.value.slice(0, 20) }))} /></div>
            <div className="field"><label>Warna ikon</label>
              <div className="swatches">{['#34c759', '#0a84ff', '#2aabee', '#e1306c', '#ff9f0a'].map(col => (
                <button key={col} className={'sw press' + (chat.lockColor === col ? ' on' : '')} style={{ background: col, width: 30, height: 30 }} onClick={() => { fx.tap(); up(c => ({ ...c, lockColor: col })); }} aria-label={col} />))}
              </div>
            </div>
          </div>
        )}
        {chat.template !== 'lock' && (
          <>
            <div className="field">
              <label>Pesan tersemat (kosongkan untuk menyembunyikan)</label>
              <input className="input" value={chat.pinnedText} placeholder="mis. Jangan lupa bayar kas 20rb" onChange={e => up(c => ({ ...c, pinnedText: e.target.value.slice(0, 80) }))} />
            </div>
            <div className="field">
              <label>Teks draft di kolom ketik</label>
              <input className="input" value={chat.draft} placeholder="Diketik tapi belum dikirim…" onChange={e => up(c => ({ ...c, draft: e.target.value.slice(0, 60) }))} />
            </div>
            <div className="card group" style={{ boxShadow: 'none', background: 'var(--surface2)', marginBottom: 14 }}>
              <div className="row"><span className="lbl">Tampilkan keyboard</span><Switch on={chat.keyboard} onChange={v => up(c => ({ ...c, keyboard: v }))} /></div>
              <div className="row"><span className="lbl">Notifikasi pop-up<small>Banner pesan masuk di atas layar</small></span><Switch on={chat.notif.on} onChange={v => up(c => ({ ...c, notif: { ...c.notif, on: v } }))} /></div>
            </div>
            {chat.notif.on && (
              <>
                <div className="grid2">
                  <div className="field"><label>Pengirim notifikasi</label><input className="input" value={chat.notif.from} placeholder={chat.contact.name} onChange={e => up(c => ({ ...c, notif: { ...c.notif, from: e.target.value } }))} /></div>
                  <div className="field"><label>Waktu</label><input className="input" value={chat.notif.when} onChange={e => up(c => ({ ...c, notif: { ...c.notif, when: e.target.value.slice(0, 14) } }))} /></div>
                </div>
                <div className="field"><label>Isi notifikasi (kosong = pesan terakhir dia)</label><input className="input" value={chat.notif.text} onChange={e => up(c => ({ ...c, notif: { ...c.notif, text: e.target.value } }))} /></div>
              </>
            )}
          </>
        )}
        <div className="field">
          <label>{`Baterai: ${chat.battery ?? 76}%`}</label>
          <input type="range" min="1" max="100" value={chat.battery ?? 76} style={{ width: '100%', height: 40, accentColor: tplColor }}
            onChange={e => up(c => ({ ...c, battery: +e.target.value }))} />
        </div>
        <div className="field">
          <label>Watermark (kosongkan untuk mematikan)</label>
          <input className="input" value={chat.watermark} placeholder="@akunmu" onChange={e => up(c => ({ ...c, watermark: e.target.value.slice(0, 30) }))} />
        </div>
        <div className="card group" style={{ boxShadow: 'none', background: 'var(--surface2)' }}>
          <div className="row"><span className="lbl">Centang verifikasi</span><Switch on={chat.verified} onChange={v => up(c => ({ ...c, verified: v }))} /></div>
          <div className="row"><span className="lbl">Jam otomatis naik<small>Pesan baru +1 menit dari pesan sebelumnya</small></span><Switch on={chat.autoTime} onChange={v => up(c => ({ ...c, autoTime: v }))} /></div>
          <div className="row"><span className="lbl">Baterai sedang di-cas</span><Switch on={chat.charging} onChange={v => up(c => ({ ...c, charging: v }))} /></div>
          <div className="row"><span className="lbl">Tampilkan status bar</span><Switch on={chat.showStatusBar !== false} onChange={v => up(c => ({ ...c, showStatusBar: v }))} /></div>
          <div className="row"><span className="lbl">Tampilkan kolom ketik</span><Switch on={chat.showInput !== false} onChange={v => up(c => ({ ...c, showInput: v }))} /></div>
        </div>
      </Sheet>

      {/* export */}
      <Sheet open={sheet === 'export'} onClose={() => !busy && setSheet(null)} title="Simpan & lainnya">
        {busy ? (
          <div style={{ padding: '6px 0 20px' }}>
            <b>{busy.label}</b>
            <div className="progress"><i style={{ width: Math.round(busy.p * 100) + '%' }} /></div>
            <p className="note">Jangan tutup aplikasi dulu ya.</p>
          </div>
        ) : (
          <>
            <div className="card group" style={{ boxShadow: 'none', background: 'var(--surface2)', marginBottom: 6 }}>
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <Frame size={20} />
                <span className="lbl">Bingkai video 9:16<small>1080×1920 dengan latar gradasi, pas buat TikTok/Reels</small></span>
                <Switch on={!!settings.frame916} onChange={v => setSettings({ frame916: v })} />
                {settings.frame916 && (
                  <div className="frame-bgs" style={{ width: '100%', marginTop: 4 }}>
                    {FRAME_BGS.map(([a, b], i) => (
                      <button key={i} className={'press' + ((settings.frameBg || 0) === i ? ' on' : '')} style={{ background: `linear-gradient(135deg,${a},${b})` }}
                        onClick={() => { fx.tap(); setSettings({ frameBg: i }); }} aria-label={'Latar ' + (i + 1)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button className="menu-item press" onClick={() => doExport('save')}><Download size={20} />
              <span>Simpan ke galeri<br /><small className="note" style={{ padding: 0 }}>{`1 gambar PNG ${settings.frame916 ? 'berbingkai 9:16' : chat.frame === 'auto' ? 'panjang' : 'seukuran layar HP'}`}</small></span></button>
            <button className="menu-item press" onClick={() => doExport('share')}><Share2 size={20} />
              <span>Bagikan<br /><small className="note" style={{ padding: 0 }}>Kirim ke WhatsApp, TikTok, CapCut, dll.</small></span></button>
            <button className="menu-item press" onClick={() => { fx.tap(); setVid(v => ({ ...v, result: null })); setSheet('video'); }}><Clapperboard size={20} />
              <span>Ekspor video MP4<br /><small className="note" style={{ padding: 0 }}>Animasi mengetik + suara, 1080×1920, siap TikTok</small></span></button>
            <button className="menu-item press" onClick={() => doExport('steps')}><Film size={20} />
              <span>Ekspor bertahap untuk video<br /><small className="note" style={{ padding: 0 }}>{`1 gambar tiap pesan baru (${msgs.filter(m => !['time', 'system', 'unread'].includes(m.kind)).length} gambar)`}</small></span></button>
            <button className="menu-item press" onClick={() => { setSheet(null); setPlaying(true); fx.tap(); }}><Play size={20} />
              <span>Mode Putar<br /><small className="note" style={{ padding: 0 }}>Pesan muncul satu-satu, tinggal rekam layar</small></span></button>
            <button className="menu-item press" onClick={() => { saveAsPreset(id); fx.success(); toast('Tersimpan di Preset › Preset saya'); }}><BookmarkPlus size={20} />
              <span>Simpan sebagai preset saya<br /><small className="note" style={{ padding: 0 }}>Pakai lagi kapan saja dari tab Preset</small></span></button>
            <button className="menu-item press" onClick={async () => { const ok = await copyText(chatToScript(chat)); ok ? fx.success() : fx.error(); toast(ok ? 'Naskah chat disalin' : 'Gagal menyalin'); }}><ClipboardCopy size={20} />
              <span>Salin sebagai teks<br /><small className="note" style={{ padding: 0 }}>Format naskah, bisa diimpor lagi</small></span></button>
            <p className="note">{`Resolusi: ${settings.exportScale === 3 ? '1170' : '780'} px lebar. Ubah di Pengaturan.`}</p>
          </>
        )}
      </Sheet>
    </>
  );
}
