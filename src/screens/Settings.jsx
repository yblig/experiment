import { useState } from 'react';
import { Palette, Volume2, Vibrate, LayoutTemplate, ImageDown, Trash2, Info, DatabaseBackup, FolderInput, Send, BellRing, Play, Music, RotateCcw } from 'lucide-react';
import { playChatSound, clearSoundCache } from '../chatSounds.js';
import { putMedia, fileToRawDataUrl } from '../media.js';
import { shareTextFile } from '../exporter.js';
import SoundSheet from './SoundSheet.jsx';
import { pickFile } from '../media.js';

const EXT = f => (f.name.split('.').pop() || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4) || 'mp3';
import { useStore, TEMPLATES } from '../store.js';
import { Switch, Seg, Sheet, toast } from '../components/ui.jsx';
import { fx } from '../fx.js';

const Ic = ({ c, children }) => <span className="ic" style={{ background: c + '22', color: c }}>{children}</span>;

export default function Settings() {
  const { settings, setSettings, clearAll, chats, exportAll, importAll } = useStore();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);
  const backup = async () => {
    if (busy) return;
    fx.tap(); setBusy(true);
    try {
      const d = new Date(), p = n => String(n).padStart(2, '0');
      const msg = await shareTextFile(`ChatSim-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`, await exportAll());
      fx.success(); toast(msg);
    } catch (e) { fx.error(); toast('Gagal mencadangkan: ' + (e?.message || e)); } finally { setBusy(false); }
  };
  const pickSound = async key => {
    fx.tap();
    const f = await pickFile('audio/*');
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) { fx.error(); toast('File terlalu besar (maks 3 MB)'); return; }
    try {
      const ref = await putMedia(await fileToRawDataUrl(f), EXT(f));
      setSettings({ [key]: { ref, name: f.name } });
      clearSoundCache();
      setTimeout(() => playChatSound(settings.defaultTemplate, key === 'sendSound' ? 'send' : 'recv'), 50);
      toast('Suara diganti: ' + f.name);
    } catch { fx.error(); toast('File suara tidak bisa dibuka'); }
  };
  const resetSound = key => { fx.tap(); setSettings({ [key]: null }); clearSoundCache(); toast('Kembali ke suara bawaan template'); };
  const restore = async () => {
    fx.tap();
    const f = await pickFile('application/json,.json,text/plain');
    if (!f) return;
    setBusy(true);
    try { const n = await importAll(await f.text()); fx.success(); toast(`${n} chat dipulihkan`); }
    catch (e) { fx.error(); toast('File tidak valid: ' + (e?.message || e)); } finally { setBusy(false); }
  };
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
              <div className="mini-row">
                {Object.entries(TEMPLATES).map(([k, t]) => (
                  <button key={k} className={'chip press' + (settings.defaultTemplate === k ? ' on' : '')} style={{ '--c': t.color }}
                    onClick={() => { fx.tap(); setSettings({ defaultTemplate: k }); }}><i />{t.label}</button>
                ))}
              </div>
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
          <button className="row press" onClick={() => { fx.tap(); setSoundOpen(true); }}>
            <Ic c="#2fd6a3"><Music size={18} /></Ic>
            <span className="lbl">Suara per aplikasi<small>{(() => { const n = Object.values(settings.tplSounds || {}).reduce((a, v) => a + (v?.send?.ref ? 1 : 0) + (v?.recv?.ref ? 1 : 0), 0) + (settings.sendSound?.ref ? 1 : 0) + (settings.recvSound?.ref ? 1 : 0); return n ? `${n} suara pilihanmu terpasang` : 'Bawaan · impor suaramu sendiri'; })()}</small></span>
            <span style={{ color: 'var(--sub)', fontSize: 20 }}>›</span>
          </button>
          <div className="row"><Ic c="#ff6b9a"><Vibrate size={19} /></Ic><span className="lbl">Getar</span>
            <Switch on={settings.haptics} onChange={v => setSettings({ haptics: v })} /></div>
        </div>

        <p className="note" style={{ marginTop: -4, marginBottom: 6 }}>Tiap template punya suara kirim/terima khasnya sendiri, dipakai di editor, Mode Putar, dan video MP4. Mau pakai suara lain? Pilih file suaramu sendiri (mp3/ogg/wav/m4a).</p>
        <div className="section-title">Data</div>
        <div className="card group">
          <button className="row press" onClick={backup} disabled={!chats.length || busy}>
            <Ic c="#2fd6a3"><DatabaseBackup size={19} /></Ic>
            <span className="lbl">Cadangkan semua chat<small>Simpan file .json (termasuk foto) untuk dipindah ke HP lain</small></span>
          </button>
          <button className="row press" onClick={restore} disabled={busy}>
            <Ic c="#4dabf7"><FolderInput size={19} /></Ic>
            <span className="lbl">Pulihkan dari file<small>Chat dari cadangan ditambahkan, yang ada tetap aman</small></span>
          </button>
          <button className="row press" onClick={() => { fx.tap(); setConfirm(true); }} disabled={!chats.length}>
            <Ic c="#ff6b6b"><Trash2 size={19} /></Ic>
            <span className="lbl" style={{ color: 'var(--danger)' }}>Hapus semua chat<small>{chats.length} chat tersimpan di HP ini</small></span>
          </button>
        </div>

        <div className="section-title">Tentang</div>
        <div className="card group">
          <div className="row"><Ic c="#9aa0b4"><Info size={19} /></Ic>
            <span className="lbl">ChatSim 1.5<small>Semua dibuat & disimpan offline di HP kamu</small></span></div>
        </div>
        <p className="note">ChatSim dibuat untuk cerita fiksi, video, komik, dan meme. Jangan dipakai untuk menipu, memfitnah, atau mengaku-ngaku chat asli orang lain. Template hanya meniru gaya tampilan dan tidak berafiliasi dengan aplikasi mana pun.</p>
      </div>
      <SoundSheet open={soundOpen} onClose={() => setSoundOpen(false)} />
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
