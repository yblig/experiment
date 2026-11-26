// Web (iPhone/iPad) printing: Safari cannot talk to Bluetooth printers, so a receipt
// is printed with AirPrint (window.print) or shared as an image (WhatsApp, printer app).
import { Printer, Share2, Info } from 'lucide-react';
import { usePrinter } from '../lib/printer.js';
import { useStore } from '../store.js';
import { shareCanvas } from '../lib/share.js';
import { toast } from '../ui.js';
import { fx } from '../lib/fx.js';
import { Sheet } from './ui.jsx';

export function airPrint(url, paper) {
  let el = document.getElementById('print-area');
  if (!el) { el = document.createElement('div'); el.id = 'print-area'; document.body.appendChild(el); }
  el.innerHTML = '';
  const img = new Image();
  img.src = url; img.style.width = paper === 80 ? '72mm' : '48mm';
  el.appendChild(img);
  img.onload = () => setTimeout(() => window.print(), 60);
}

export default function WebPrintHost() {
  const job = usePrinter(p => p.webJob);
  const paper = useStore(s => s.settings.paper);
  const close = () => usePrinter.setState({ webJob: null });
  return (
    <Sheet open={!!job} onClose={close} title="Cetak struk" full
      footer={<div className="col gap8">
        <button className="btn primary lg block" onClick={() => { fx('print'); airPrint(job.url, paper); }}><Printer size={21} /> Cetak (AirPrint)</button>
        <button className="btn soft block" onClick={async () => { try { await shareCanvas(job.canvas, `${job.name}.png`, ''); fx('success'); } catch (e) { if (e?.name !== 'AbortError') toast('Gagal membagikan', { type: 'error' }); } }}><Share2 size={20} /> Bagikan gambar (WA, dll)</button>
      </div>}>
      {job && <>
        <div style={{ background: 'var(--bg2)', borderRadius: 20, padding: '18px 14px' }}>
          <div className="paper-wrap"><div className={'paper' + (paper === 80 ? ' wide' : '')}><img src={job.url} alt="Struk" /></div></div>
        </div>
        <div className="card flat row mt12" style={{ alignItems: 'flex-start', gap: 10 }}>
          <Info size={20} color="var(--info)" style={{ flex: 'none', marginTop: 2 }} />
          <div className="small muted" style={{ lineHeight: 1.5 }}>Di iPhone/iPad, printer struk Bluetooth tidak bisa disambung langsung dari browser. Pakai <b>AirPrint</b> untuk printer Wi-Fi, atau <b>Bagikan gambar</b> lalu pilih aplikasi bawaan printer thermal Anda untuk mencetaknya. Bisa juga dikirim ke pelanggan lewat WhatsApp.</div>
        </div>
      </>}
    </Sheet>
  );
}
