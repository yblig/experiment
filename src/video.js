// MP4 export: renders each chat "scene" to an image, animates them on a canvas (typing dots,
// cross-fades), encodes H.264 + AAC with WebCodecs and muxes into an .mp4 — all on the phone.
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { buildFrames } from './screens/Player.jsx';
import { FRAME_BGS } from './exporter.js';
import { leadIn, loadBytes } from './chatSounds.js';

export let W = 1080, H = 1920, FPS = 30;
export const videoSupported = () => typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoFrame' in window;

async function pickVideoCodec() {
  for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42e028', 'avc1.64002a', 'avc1.640033']) {
    const r = await VideoEncoder.isConfigSupported({ codec, width: W, height: H, bitrate: 7e6, framerate: FPS }).catch(() => null);
    if (r?.supported) return codec;
  }
  return null;
}
async function pickAudio() {
  if (!('AudioEncoder' in window)) return null;
  for (const a of [{ codec: 'mp4a.40.2', mux: 'aac', sr: 44100 }, { codec: 'opus', mux: 'opus', sr: 48000 }]) {
    const r = await AudioEncoder.isConfigSupported({ codec: a.codec, sampleRate: a.sr, numberOfChannels: 2, bitrate: 128000 }).catch(() => null);
    if (r?.supported) return a;
  }
  return null;
}

async function mixAudio(events, seconds, sr, bgm) {
  const ctx = new OfflineAudioContext(2, Math.ceil(sr * seconds), sr);
  if (bgm) {
    try {
      const mb = await ctx.decodeAudioData(await loadBytes(bgm.src));
      const src = ctx.createBufferSource(); src.buffer = mb; src.loop = true;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(bgm.vol, 0.6);
      g.gain.setValueAtTime(bgm.vol, Math.max(0.7, seconds - 1.6)); g.gain.linearRampToValueAtTime(0, seconds);
      src.connect(g).connect(ctx.destination); src.start(0);
    } catch (e) { console.warn('music', e); }
  }
  const names = [...new Set(events.map(e => e.name))];
  const bufs = {};
  for (const n of names) {
    try { bufs[n] = await ctx.decodeAudioData(await loadBytes(n)); } catch (e) { console.warn('sound', n, e); }
  }
  for (const e of events) {
    if (!bufs[e.name]) continue;
    const s = ctx.createBufferSource();
    s.buffer = bufs[e.name];
    const g = ctx.createGain(); g.gain.value = e.vol ?? 1;
    s.connect(g).connect(ctx.destination);
    s.start(e.t, leadIn(bufs[e.name]));
  }
  return ctx.startRendering();
}

const toBitmap = async url => createImageBitmap(await (await fetch(url)).blob());
const ease = t => 1 - Math.pow(1 - t, 3);

// renderScene(viewChat, phase|null) -> PNG data URL of the phone screen (1080 px wide)
export async function exportVideo({ chat, renderScene, onProgress = () => {}, speed = 1, sound = true, bgIdx = 0, sounds = {}, music = 'none', musicVol = 0.45, keys = true, title = '', titleStyle = 'box', quality = '1080', fps = 30 }) {
  if (!videoSupported()) throw new Error('HP ini belum mendukung pembuatan video');
  [W, H] = quality === '720' ? [720, 1280] : [1080, 1920];
  FPS = fps === 60 ? 60 : 30;
  const codec = await pickVideoCodec();
  if (!codec) throw new Error('Encoder H.264 tidak tersedia di HP ini');
  const ac = sound ? await pickAudio() : null;
  const withAudio = !!ac;

  // ---- timeline ----
  const scenes = buildFrames(chat).map(s => ({ ...s, ms: Math.max(350, s.ms * speed) }));
  scenes[0].ms = Math.min(scenes[0].ms, 700);
  scenes[scenes.length - 1].ms += 1800;
  let t = 0;
  const events = [];
  scenes.forEach((s, i) => {
    s.start = t;
    if (s.sound) events.push({ t: t / 1000, name: sounds[s.sound] || `audio/${s.sound}.wav`, vol: 0.9 });
    if (keys && scenes[i + 1]?.keys) events.push({ t: Math.max(0, (t + s.ms - 750) / 1000), name: 'audio/chat/keys.wav', vol: 0.7 });
    t += s.ms;
  });
  const total = t;

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target, fastStart: 'in-memory', firstTimestampBehavior: 'offset',
    video: { codec: 'avc', width: W, height: H, frameRate: FPS },
    ...(withAudio ? { audio: { codec: ac.mux, numberOfChannels: 2, sampleRate: ac.sr } } : {})
  });

  // ---- audio ----
  if (withAudio && (events.length || music !== 'none')) {
    onProgress('Menyiapkan suara…', 0.02);
    const sr = ac.sr;
    const buf = await mixAudio(events, total / 1000 + 0.3, sr, music !== 'none' ? { src: `audio/music/${music}.ogg`, vol: musicVol } : null);
    let aerr = null;
    const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { aerr = e; } });
    aenc.configure({ codec: ac.codec, sampleRate: sr, numberOfChannels: 2, bitrate: 128000 });
    const L = buf.getChannelData(0), R = buf.getChannelData(1), N = 1024;
    for (let off = 0; off < buf.length; off += N) {
      const n = Math.min(N, buf.length - off);
      const data = new Float32Array(n * 2);
      data.set(L.subarray(off, off + n), 0); data.set(R.subarray(off, off + n), n);
      const ad = new AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((off / sr) * 1e6), data });
      aenc.encode(ad); ad.close();
    }
    await aenc.flush(); aenc.close();
    if (aerr) throw aerr;
  }

  // ---- video ----
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { alpha: false });
  const fill = chat.frame === '916';
  const bg = document.createElement('canvas');
  bg.width = W; bg.height = H;
  if (!fill) {
    const b = bg.getContext('2d');
    const [c1, c2] = FRAME_BGS[bgIdx] || FRAME_BGS[0];
    const gr = b.createLinearGradient(0, 0, W, H); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    b.fillStyle = gr; b.fillRect(0, 0, W, H);
  }
  const draw = (img, alpha = 1) => {
    ctx.globalAlpha = alpha;
    if (fill) { ctx.drawImage(img, 0, 0, W, H); ctx.globalAlpha = 1; return; }
    const k = Math.min((W * 0.88) / img.width, (H * 0.9) / img.height);
    const w = img.width * k, h = img.height * k, x = (W - w) / 2, y = (H - h) / 2;
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 44); ctx.clip(); ctx.drawImage(img, x, y, w, h); ctx.restore();
    ctx.globalAlpha = 1;
  };

  let verr = null;
  const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { verr = e; } });
  venc.configure({ codec, width: W, height: H, bitrate: 7e6, framerate: FPS, latencyMode: 'quality' });

  const view = s => {
    const msgs = chat.messages.slice(0, s.upto);
    return { ...chat, frame: chat.frame === 'auto' ? 'phone' : chat.frame, messages: s.extra ? [...msgs, s.extra] : msgs };
  };
  let frameNo = 0, prev = null;
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    onProgress(`Membuat adegan ${i + 1} dari ${scenes.length}`, 0.05 + 0.85 * (i / scenes.length));
    const v = view(s);
    const lastItem = v.messages[v.messages.length - 1];
    const typing = lastItem?.kind === 'typing';
    const imgs = [];
    for (const ph of typing ? [0, 1, 2] : [null]) imgs.push(await toBitmap(await renderScene(v, ph)));
    const endFrame = Math.round(((s.start + s.ms) / 1000) * FPS);
    while (frameNo < endFrame) {
      const local = Math.max(0, (frameNo / FPS) * 1000 - s.start);
      const img = typing ? imgs[Math.floor(local / 220) % 3] : imgs[0];
      if (!fill) ctx.drawImage(bg, 0, 0);
      draw(img);
      if (title) drawTitle(ctx, title, titleStyle);
      const vf = new VideoFrame(canvas, { timestamp: Math.round((frameNo * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
      venc.encode(vf, { keyFrame: frameNo % (FPS * 2) === 0 });
      vf.close();
      frameNo++;
      while (venc.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 4));
      if (verr) throw verr;
    }
    if (prev && !imgs.includes(prev)) prev.close?.();
    prev = imgs[0];
    imgs.slice(1).forEach(b => b.close?.());
  }
  onProgress('Menyelesaikan video…', 0.95);
  await venc.flush(); venc.close();
  if (verr) throw verr;
  muxer.finalize();
  return { blob: new Blob([target.buffer], { type: 'video/mp4' }), seconds: total / 1000, audio: withAudio };
}

function drawTitle(ctx, text, style) {
  const k = W / 1080;
  const fs = Math.round(54 * k);
  ctx.save();
  ctx.font = `800 ${fs}px 'Plus Jakarta Sans', 'Inter', sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lines = [];
  for (const para of text.split('\n')) {
    let cur = '';
    for (const w of para.split(' ')) { const tt = cur ? cur + ' ' + w : w; if (ctx.measureText(tt).width > W * 0.8 && cur) { lines.push(cur); cur = w; } else cur = tt; }
    lines.push(cur);
  }
  const lh = fs * 1.25, y0 = H * 0.2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((ln, i) => {
    const y = y0 + i * lh, w = ctx.measureText(ln).width;
    if (style === 'box') {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.roundRect(W / 2 - w / 2 - 22 * k, y - lh / 2, w + 44 * k, lh, 14 * k); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillText(ln, W / 2, y + 2 * k);
    } else {
      ctx.lineWidth = 10 * k; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round';
      ctx.strokeText(ln, W / 2, y); ctx.fillStyle = '#fff'; ctx.fillText(ln, W / 2, y);
    }
  });
  ctx.restore();
}
