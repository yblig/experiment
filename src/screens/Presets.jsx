import { motion } from 'framer-motion';
import { PRESETS, presetToChat } from '../presets.js';
import { useStore, blankChat, TEMPLATES } from '../store.js';
import { Mini, toast } from '../components/ui.jsx';
import Shot from '../templates/Shot.jsx';
import { fx } from '../fx.js';

let k = 0;
const fake = () => 'p' + k++;
const PREVIEWS = PRESETS.map(p => ({ ...blankChat(p.template), ...presetToChat(p, fake), frame: 'auto', showInput: false }));

export default function Presets({ onOpen }) {
  const fromPreset = useStore(s => s.fromPreset);
  return (
    <>
      <div className="topbar">
        <div>
          <div className="brand"><h1>Preset</h1></div>
          <p className="subtitle">Cerita siap pakai, tinggal edit & simpan</p>
        </div>
      </div>
      <div className="scroll page-pad">
        <div className="preset-grid" style={{ marginTop: 8 }}>
          {PRESETS.map((p, i) => {
            const chat = PREVIEWS[i];
            const t = TEMPLATES[p.template];
            return (
              <motion.button key={p.key} className="card preset press" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { fx.send(); const id = fromPreset(p); toast(`"${p.title}" ditambahkan`); onOpen(id); }}>
                <div className="pv"><Mini width={158}><Shot chat={chat} upto={7} /></Mini></div>
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
                <span className="badge" style={{ background: t.color + '22', color: t.color, margin: '0 4px 4px' }}><i style={{ background: t.color }} />{t.label}</span>
              </motion.button>
            );
          })}
        </div>
        <p className="note" style={{ marginTop: 16 }}>Preset disalin ke "Chat Saya", jadi aslinya tetap utuh. Ganti nama, foto profil, dan template sesukamu.</p>
      </div>
    </>
  );
}
