import { FolderInput } from 'lucide-react';
import { Sheet, toast } from '../components/ui.jsx';
import { pickFile } from '../media.js';
import TplGrid from '../components/TplGrid.jsx';
import { useStore } from '../store.js';
import { fx } from '../fx.js';

export default function NewChatSheet({ open, onClose, onCreated }) {
  const newChat = useStore(s => s.newChat);
  const importAll = useStore(s => s.importAll);
  return (
    <Sheet open={open} onClose={onClose} title="Pilih aplikasi">
      <TplGrid value={null} onPick={k => { fx.send(); onCreated(newChat(k)); }} />
      <p className="note">Template bisa diganti kapan saja lewat tombol pengaturan di editor, isi chat tetap sama.</p>
      <button className="btn ghost block press" style={{ marginTop: 12 }} onClick={async () => {
        fx.tap(); const f = await pickFile('application/json,.json,text/plain'); if (!f) return;
        try { const n = await importAll(await f.text()); fx.success(); toast(`${n} chat ditambahkan`); onClose(); } catch (e) { fx.error(); toast('File tidak valid: ' + (e?.message || e)); }
      }}><FolderInput size={18} /> Impor file chat (.json)</button>
    </Sheet>
  );
}
