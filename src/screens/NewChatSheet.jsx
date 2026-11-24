import { Sheet } from '../components/ui.jsx';
import TplGrid from '../components/TplGrid.jsx';
import { useStore } from '../store.js';
import { fx } from '../fx.js';

export default function NewChatSheet({ open, onClose, onCreated }) {
  const newChat = useStore(s => s.newChat);
  return (
    <Sheet open={open} onClose={onClose} title="Pilih aplikasi">
      <TplGrid value={null} onPick={k => { fx.send(); onCreated(newChat(k)); }} />
      <p className="note">Template bisa diganti kapan saja lewat tombol pengaturan di editor, isi chat tetap sama.</p>
    </Sheet>
  );
}
