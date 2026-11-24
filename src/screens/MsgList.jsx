// Message list view: drag to reorder (grip handle), tap to edit, select mode for bulk actions.
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Check } from 'lucide-react';
import { quoteText } from '../templates/parts.jsx';
import { fx } from '../fx.js';

function Row({ m, i, label, chatL, selecting, selected, onTap, onToggle }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={m} dragListener={false} dragControls={controls} className={'li' + (selected ? ' sel' : '')} as="div"
      whileDrag={{ scale: 1.02, boxShadow: '0 12px 30px rgba(0,0,0,.35)', zIndex: 5 }}
      onClick={() => (selecting ? onToggle(m.id) : onTap(i))}>
      {selecting && <span className={'li-ck' + (selected ? ' on' : '')}>{selected && <Check size={14} strokeWidth={3} />}</span>}
      <span className={'who ' + (['time', 'system', 'unread'].includes(m.kind) ? 'time' : m.from)}>{label}</span>
      <span className="txt">
        {m.kind === 'typing' ? <i style={{ color: 'var(--sub)' }}>sedang mengetik…</i> : m.kind === 'msg' ? (m.reaction ? m.reaction + ' ' : '') + (quoteText(m, chatL) || '') : m.text}
      </span>
      {m.kind === 'msg' && <span className="tm">{m.time}</span>}
      <span className="li-grip" onPointerDown={e => { e.stopPropagation(); fx.tap(); controls.start(e); }} onClick={e => e.stopPropagation()} aria-label="Seret">
        <GripVertical size={20} />
      </span>
    </Reorder.Item>
  );
}

export default function MsgList({ msgs, chatL, nameOf, onReorder, onTap, selecting, sel, onToggle }) {
  return (
    <Reorder.Group axis="y" values={msgs} onReorder={onReorder} as="div">
      {msgs.map((m, i) => {
        const label = m.kind === 'time' ? 'WAKTU' : m.kind === 'system' ? 'INFO' : m.kind === 'unread' ? 'BARU' : nameOf(m).toUpperCase().slice(0, 8);
        return <Row key={m.id} m={m} i={i} label={label} chatL={chatL} selecting={selecting} selected={sel.has(m.id)} onTap={onTap} onToggle={onToggle} />;
      })}
    </Reorder.Group>
  );
}
