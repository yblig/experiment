import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dices, Wand2, X, Bookmark } from 'lucide-react';
import { PRESETS, presetToChat, randomPreset } from '../presets.js';
import { useStore, blankChat, normalize, TEMPLATES } from '../store.js';
import { Mini, toast } from '../components/ui.jsx';
import Shot from '../templates/Shot.jsx';
import { fx } from '../fx.js';

let k = 0;
const fake = () => 'p' + k++;
const preview = p => normalize({ ...blankChat(p.template), ...presetToChat(p, fake), frame: 'auto', showInput: false });
const PREVIEWS = PRESETS.map(preview);

export default function Presets({ onOpen }) {
  const { fromPreset, myPresets, fromMyPreset, deleteMyPreset } = useStore();
  const [rnd, setRnd] = useState(() => randomPreset());
  const [rndChat, setRndChat] = useState(() => preview(rnd));
  const [spin, setSpin] = useState(0);
  const reroll = () => { fx.toggle(); setSpin(s => s + 1); const r = randomPreset(); setRnd(r); setRndChat(preview(r)); };
  return (
    <>
      <div className="topbar">
        <div>
          <div className="brand"><h1>Preset</h1></div>
          <p className="subtitle">Cerita siap pakai, tinggal edit & simpan</p>
        </div>
      </div>
      <div className="scroll page-pad">
        <div className="card rnd-card">
          <div className="rnd-pv"><Mini width={120}><Shot chat={rndChat} upto={6} /></Mini></div>
          <div className="rnd-info">
            <span className="badge" style={{ background: '#ffc14522', color: '#ffc145', alignSelf: 'flex-start' }}><Wand2 size={12} /> Ide acak</span>
            <h3>{rnd.title}</h3>
            <p>Gaya {TEMPLATES[rnd.template].label} · {rnd.messages.filter(x => x.kind === 'msg').length} pesan</p>
            <div className="rnd-btns">
              <motion.button className="btn ghost press" onClick={reroll} animate={{ rotate: spin * 360 }} transition={{ duration: 0.5 }} aria-label="Acak lagi" style={{ width: 50, padding: 0 }}>
                <Dices size={22} />
              </motion.button>
              <button className="btn primary press" style={{ flex: 1, padding: '0 12px' }} onClick={() => { fx.send(); const id = fromPreset(rnd); toast('Cerita acak ditambahkan'); onOpen(id); }}>Pakai</button>
            </div>
          </div>
        </div>

        {myPresets.length > 0 && (
          <>
            <div className="section-title"><span><Bookmark size={15} style={{ verticalAlign: -2, marginRight: 6 }} />Preset saya</span><small>{myPresets.length}</small></div>
            <div className="preset-grid">
              {myPresets.map(p => {
                const t = TEMPLATES[p.template] || TEMPLATES.imessage;
                return (
                  <div key={p.id} className="card preset press" role="button" style={{ position: 'relative' }}
                    onClick={() => { fx.send(); const id = fromMyPreset(p); toast(`"${p.title}" ditambahkan`); onOpen(id); }}>
                    <div className="pv"><Mini width={158}><Shot chat={{ ...p, frame: 'auto', showInput: false, keyboard: false }} upto={7} /></Mini></div>
                    <h4>{p.title}</h4>
                    <p>{p.messages.filter(m => m.kind === 'msg').length} pesan</p>
                    <span className="badge" style={{ background: t.color + '22', color: t.color, margin: '0 4px 4px' }}><i style={{ background: t.color }} />{t.label}</span>
                    <button className="icon-btn press" style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, background: 'rgba(0,0,0,.55)', color: '#fff', zIndex: 2 }}
                      onClick={e => { e.stopPropagation(); fx.del(); deleteMyPreset(p.id); toast('Preset dihapus'); }} aria-label="Hapus preset"><X size={16} /></button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="section-title">Semua preset <small>{PRESETS.length} cerita</small></div>
        <div className="preset-grid">
          {PRESETS.map((p, i) => {
            const t = TEMPLATES[p.template];
            return (
              <motion.button key={p.key} className="card preset press" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i, 8) * 0.04 }}
                onClick={() => { fx.send(); const id = fromPreset(p); toast(`"${p.title}" ditambahkan`); onOpen(id); }}>
                <div className="pv"><Mini width={158}><Shot chat={PREVIEWS[i]} upto={7} /></Mini></div>
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
                <span className="badge" style={{ background: t.color + '22', color: t.color, margin: '0 4px 4px' }}>
                  <i style={{ background: t.color }} />{t.label}{p.group ? ' · Grup' : ''}
                </span>
              </motion.button>
            );
          })}
        </div>
        <p className="note" style={{ marginTop: 16 }}>Preset disalin ke "Chat Saya", jadi aslinya tetap utuh. Ganti nama, foto profil, dan template sesukamu.</p>
      </div>
    </>
  );
}
