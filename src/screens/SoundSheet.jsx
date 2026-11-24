// Assign sound files per template (send / receive), with multi-file import + name matching.
import { Play, RotateCcw, FolderInput, Music } from 'lucide-react';
import { Sheet, toast } from '../components/ui.jsx';
import { TplIcon } from '../components/TplGrid.jsx';
import { useStore, TEMPLATES } from '../store.js';
import { putMedia, fileToRawDataUrl, pickFile, pickFiles } from '../media.js';
import { playChatSound, clearSoundCache, guessSlot } from '../chatSounds.js';
import { fx } from '../fx.js';

const EXT = f => (f.name.split('.').pop() || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4) || 'mp3';
const short = n => (n.length > 18 ? n.slice(0, 16) + '…' : n);

async function store(f) {
  if (f.size > 3 * 1024 * 1024) throw new Error('maks 3 MB');
  return { ref: await putMedia(await fileToRawDataUrl(f), EXT(f)), name: f.name.replace(/^[0-9a-f]{8}-/, '') };
}

export default function SoundSheet({ open, onClose }) {
  const { settings, setSettings } = useStore();
  const per = settings.tplSounds || {};
  const setSlot = (tpl, kind, val) => {
    const cur = useStore.getState().settings;
    if (tpl === '*') setSettings({ [kind === 'send' ? 'sendSound' : 'recvSound']: val });
    else setSettings({ tplSounds: { ...(cur.tplSounds || {}), [tpl]: { ...((cur.tplSounds || {})[tpl] || {}), [kind]: val } } });
    clearSoundCache();
  };
  const slotOf = (tpl, kind) => (tpl === '*' ? settings[kind === 'send' ? 'sendSound' : 'recvSound'] : per[tpl]?.[kind]);

  const importMany = async () => {
    fx.tap();
    const files = await pickFiles('audio/*');
    if (!files.length) return;
    const done = [];
    for (const f of files) {
      try {
        const { tpl, kind } = guessSlot(f.name);
        setSlot(tpl || '*', kind, await store(f));
        done.push(`${tpl ? TEMPLATES[tpl].label : 'Semua aplikasi'} (${kind === 'send' ? 'kirim' : 'terima'})`);
      } catch (e) { toast(`${f.name}: ${e.message || 'gagal'}`); }
    }
    if (done.length) { fx.success(); toast('Terpasang: ' + done.join(', ')); }
  };
  const pickOne = async (tpl, kind) => {
    fx.tap();
    const f = await pickFile('audio/*');
    if (!f) return;
    try { setSlot(tpl, kind, await store(f)); setTimeout(() => playChatSound(tpl === '*' ? 'whatsapp' : tpl, kind), 60); }
    catch (e) { fx.error(); toast('File suara tidak bisa dipakai: ' + (e.message || '')); }
  };

  const Slot = ({ tpl, kind }) => {
    const v = slotOf(tpl, kind);
    const other = slotOf(tpl, kind === 'send' ? 'recv' : 'send');
    const playTpl = tpl === '*' ? settings.defaultTemplate : tpl;
    return (
      <div className={'snd-slot' + (v?.ref ? ' on' : '')}>
        <button className="snd-main press" onClick={() => pickOne(tpl, kind)}>
          <small>{kind === 'send' ? 'Kirim' : 'Terima'}</small>
          <span>{v?.ref ? <><Music size={11} /> {short(v.name)}</> : other?.ref ? <i style={{ fontWeight: 500 }}>= {short(other.name)}</i> : 'Bawaan'}</span>
        </button>
        <button className="snd-ic press" onClick={() => playChatSound(playTpl, kind)} aria-label="Dengar"><Play size={14} /></button>
        {v?.ref && <button className="snd-ic press" onClick={() => { fx.tap(); setSlot(tpl, kind, null); }} aria-label="Reset"><RotateCcw size={14} /></button>}
      </div>
    );
  };

  return (
    <Sheet open={open} onClose={onClose} title="Suara per aplikasi">
      <button className="btn primary block press" onClick={importMany}><FolderInput size={19} /> Impor file suara (bisa banyak)</button>
      <p className="note" style={{ margin: '8px 0 14px' }}>
        Pilih beberapa file sekaligus. Aplikasi menebak dari nama file: <b>whatsapp</b> → WhatsApp, <b>iphone/imessage</b> → iMessage, <b>snapchat</b> → Snapchat, dst.
        Kalau satu aplikasi cuma punya satu file, file itu dipakai untuk kirim dan terima. Ketuk kotak untuk ganti manual. File disimpan di HP ini saja.
      </p>
      <div className="snd-row">
        <span className="snd-name"><span className="tpl-ic" style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--surface2)' }}><Music size={16} /></span>Semua aplikasi</span>
        <div className="snd-slots"><Slot tpl="*" kind="send" /><Slot tpl="*" kind="recv" /></div>
      </div>
      {Object.entries(TEMPLATES).map(([k, t]) => (
        <div className="snd-row" key={k}>
          <span className="snd-name"><TplIcon k={k} size={30} />{t.label}</span>
          <div className="snd-slots"><Slot tpl={k} kind="send" /><Slot tpl={k} kind="recv" /></div>
        </div>
      ))}
    </Sheet>
  );
}
