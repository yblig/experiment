import { useState } from 'react';
import { Palette, Volume2, Vibrate, LayoutTemplate, ImageDown, Trash2, Info } from 'lucide-react';
import { useStore, TEMPLATES } from '../store.js';
import { Switch, Seg, Sheet, toast } from '../components/ui.jsx';
import { fx } from '../fx.js';

const Ic = ({ c, children }) => <span className="ic" style={{ background: c + '22', color: c }}>{children}</span>;

export default function Settings() {
  const { settings, setSettings, clearAll, chats } = useStore();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <div className="topbar"><div className="brand"><h1>Pengaturan</h1></div></div>
      <div className="scroll page-pad">
        <div className="section-title">Tampilan</div>
        <div className="card group">
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <Ic c="#7c6cff"><Palette size={19} /></Ic>
            <span className="lbl">Tema aplikasi</span>
            <div style={{ width: '100%' }}>
              <Seg value={settings.theme} onChange={v => setSettings({ theme: v })} options={[['system', 'Ikuti HP'], ['light', 'Terang'], ['dark', 'Gelap']]} />
            </div>
          </div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <Ic c="#1d9bf0"><LayoutTemplate size={19} /></Ic>
            <span className="lbl">Template default<small>Untuk chat baru dari tombol +</small></span>
            <div style={{ width: '100%' }}>
              <Seg value={settings.defaultTemplate} onChange={v => setSettings({ defaultTemplate: v })}
                options={Object.entries(TEMPLATES).map(([k, t]) => [k, t.label])} />
            </div>
          </div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <Ic c="#2fd6a3"><ImageDown size={19} /></Ic>
            <span className="lbl">Resolusi gambar<small>{settings.exportScale === 3 ? '1170 px lebar, paling tajam' : '780 px lebar, file lebih kecil'}</small></span>
            <div style={{ width: '100%' }}>
              <Seg value={settings.exportScale} onChange={v => setSettings({ exportScale: v })} options={[[2, 'Sedang (2×)'], [3, 'Tajam (3×)']]} />
            </div>
          </div>
        </div>

        <div className="section-title">Suara & getar</div>
        <div className="card group">
          <div className="row"><Ic c="#ffc145"><Volume2 size={19} /></Ic><span className="lbl">Efek suara</span>
            <Switch on={settings.sound} onChange={v => setSettings({ sound: v })} /></div>
          <div className="row"><Ic c="#ff6b9a"><Vibrate size={19} /></Ic><span className="lbl">Getar</span>
            <Switch on={settings.haptics} onChange={v => setSettings({ haptics: v })} /></div>
        </div>

        <div className="section-title">Data</div>
        <div className="card group">
          <button className="row press" onClick={() => { fx.tap(); setConfirm(true); }} disabled={!chats.length}>
            <Ic c="#ff6b6b"><Trash2 size={19} /></Ic>
            <span className="lbl" style={{ color: 'var(--danger)' }}>Hapus semua chat<small>{chats.length} chat tersimpan di HP ini</small></span>
          </button>
        </div>

        <div className="section-title">Tentang</div>
        <div className="card group">
          <div className="row"><Ic c="#9aa0b4"><Info size={19} /></Ic>
            <span className="lbl">ChatSim 1.0<small>Semua dibuat & disimpan offline di HP kamu</small></span></div>
        </div>
        <p className="note">ChatSim dibuat untuk cerita fiksi, video, komik, dan meme. Jangan dipakai untuk menipu, memfitnah, atau mengaku-ngaku chat asli orang lain. Template hanya meniru gaya tampilan dan tidak berafiliasi dengan aplikasi mana pun.</p>
      </div>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Hapus semua chat?">
        <p className="note" style={{ padding: '0 2px 16px' }}>Semua {chats.length} chat akan dihapus permanen dari HP ini. Preset tetap ada.</p>
        <div className="grid2">
          <button className="btn ghost press" onClick={() => { fx.tap(); setConfirm(false); }}>Batal</button>
          <button className="btn danger press" onClick={() => { fx.del(); clearAll(); setConfirm(false); toast('Semua chat dihapus'); }}>Hapus</button>
        </div>
      </Sheet>
    </>
  );
}
