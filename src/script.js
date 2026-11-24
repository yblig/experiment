// Plain-text chat scripts: "Aku: halo" / "Dimas: hai" <-> messages.
import { uid, addMinutes, PCOLORS } from './store.js';
import { quoteText } from './templates/parts.jsx';

const ME = new Set(['aku', 'saya', 'me', 'gue', 'gw', 'i', 'a']);
const LINE = /^([\p{L}\p{N} ._'()-]{1,24}):\s+(.+)$/u;

export function parseScript(text, chat) {
  const out = [];
  const names = [];
  let clock = chat.messages.filter(m => m.time).slice(-1)[0]?.time || chat.clock;
  let last = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { last = null; continue; }
    if (/^(---|#)/.test(line)) { out.push({ kind: 'time', text: line.replace(/^(---+|#+)\s*/, '') || 'Today' }); last = null; continue; }
    if (/^\*\s*/.test(line)) { out.push({ kind: 'system', text: line.replace(/^\*\s*/, '') }); last = null; continue; }
    let from = null, name = null, body = line;
    if (line.startsWith('>')) { from = 'me'; body = line.slice(1).trim(); }
    else {
      const mm = line.match(LINE);
      if (mm) {
        const who = mm[1].trim();
        body = mm[2];
        if (ME.has(who.toLowerCase())) from = 'me';
        else { from = 'them'; name = who; if (!names.includes(who)) names.push(who); }
      }
    }
    if (!from) {
      if (last) { last.text += '\n' + body; continue; }
      from = 'me';
    }
    if (body === '...' || body === '…') { out.push({ kind: 'typing', from, _name: name }); last = null; continue; }
    clock = addMinutes(clock, out.length ? 1 : 0);
    last = { kind: 'msg', from, text: body, time: clock, status: from === 'me' ? 'read' : 'sent', _name: name };
    out.push(last);
  }
  return { items: out, names, clock };
}

export function applyScript(chat, parsed, replace) {
  const { items, names } = parsed;
  const dia = new Set(['dia', 'them', 'b', 'teman']);
  const realNames = names.filter(n => !dia.has(n.toLowerCase()));
  let group = chat.group;
  let participants = [...chat.participants];
  let contact = chat.contact;
  if (realNames.length > 1 || (group && realNames.length)) {
    group = true;
    realNames.forEach(n => {
      if (!participants.find(p => p.name.toLowerCase() === n.toLowerCase())) {
        participants.push({ id: uid(), name: n, color: PCOLORS[participants.length % PCOLORS.length], avatar: null });
      }
    });
  } else if (realNames.length === 1 && !group) {
    contact = { ...contact, name: realNames[0] };
  }
  const pid = n => participants.find(p => p.name.toLowerCase() === (n || '').toLowerCase())?.id || participants[0]?.id;
  const msgs = items.map(({ _name, ...m }) => ({ ...m, id: uid(), ...(group && m.from === 'them' ? { sender: pid(_name) } : {}) }));
  return { ...chat, group, participants, contact, messages: replace ? msgs : [...chat.messages, ...msgs] };
}

export function chatToScript(chat) {
  const nameOf = m => (m.from === 'me' ? 'Aku' : chat.group ? (chat.participants.find(p => p.id === m.sender)?.name || 'Dia') : chat.contact.name || 'Dia');
  return chat.messages.map(m => {
    if (m.kind === 'time') return `--- ${m.text}`;
    if (m.kind === 'system' || m.kind === 'unread') return `* ${m.text}`;
    if (m.kind === 'typing') return `${nameOf(m)}: ...`;
    const t = m.type || 'text';
    const body = t === 'text' ? m.text : `[${quoteText(m, chat)}]`;
    return `${nameOf(m)}: ${body}`;
  }).join('\n');
}
