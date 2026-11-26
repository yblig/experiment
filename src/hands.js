// Camera + MediaPipe hand tracking (model and wasm are bundled → works offline),
// landmark → screen mapping and gesture analysis.
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const here = p => new URL(p, location.href).href;
let landmarker = null, loading = null;

export async function loadModel(onStatus = () => {}) {
  if (landmarker) return landmarker;
  if (loading) return loading;
  loading = (async () => {
    onStatus('Loading hand tracking…');
    const files = await FilesetResolver.forVisionTasks(here('mediapipe'));
    const opts = d => ({
      baseOptions: { modelAssetPath: here('models/hand_landmarker.task'), delegate: d },
      runningMode: 'VIDEO', numHands: 2,
      minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.45
    });
    try { landmarker = await HandLandmarker.createFromOptions(files, opts('GPU')); }
    catch { landmarker = await HandLandmarker.createFromOptions(files, opts('CPU')); }
    return landmarker;
  })();
  try { return await loading; } finally { loading = null; }
}

export class Tracker {
  constructor(video) { this.video = video; this.stream = null; this.mirror = true; this.last = -1; this.hands = []; }
  async start(facing = 'user') {
    this.stop();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: false, video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } }
    });
    this.mirror = facing === 'user';
    this.video.srcObject = this.stream;
    this.video.style.transform = this.mirror ? 'scaleX(-1)' : 'none';
    await this.video.play();
  }
  stop() { this.stream?.getTracks().forEach(t => t.stop()); this.stream = null; this.video.srcObject = null; }
  get live() { return !!this.stream && this.video.readyState >= 2; }
  // returns hands in screen pixels (W×H, video drawn with object-fit: cover)
  detect(W, H) {
    if (!landmarker || !this.live) return this.hands;
    const v = this.video;
    if (v.currentTime === this.last) return this.hands;
    this.last = v.currentTime;
    let res;
    try { res = landmarker.detectForVideo(v, performance.now()); } catch { return this.hands; }
    const vw = v.videoWidth, vh = v.videoHeight, s = Math.max(W / vw, H / vh);
    const ox = (W - vw * s) / 2, oy = (H - vh * s) / 2;
    this.hands = (res.landmarks || []).map(lm => analyze(lm.map(p => ({
      x: ox + (this.mirror ? 1 - p.x : p.x) * vw * s, y: oy + p.y * vh * s
    }))));
    return this.hands;
  }
}

const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// pts: 21 screen points → gesture info
export function analyze(pts) {
  const w = pts[0];
  const palm = (d(w, pts[9]) + d(pts[5], pts[17]) * 0.9) / 2 || 1;
  const ext = [
    d(pts[4], pts[17]) > d(pts[3], pts[17]) * 1.08 && d(pts[4], pts[5]) > palm * 0.42,
    ...[[8, 6], [12, 10], [16, 14], [20, 18]].map(([t, p]) => d(pts[t], w) > d(pts[p], w) * 1.12)
  ];
  const count = ext.filter(Boolean).length;
  const cx = (w.x + pts[5].x + pts[9].x + pts[13].x + pts[17].x) / 5;
  const cy = (w.y + pts[5].y + pts[9].y + pts[13].y + pts[17].y) / 5;
  const pinch = [8, 12, 16, 20].map(t => d(pts[4], pts[t]) / palm);
  return { pts, palm, ext, count, cx, cy, pinch };
}

// Synthetic hand for previews, demos and the how-to page.
// ext = [thumb, index, middle, ring, pinky]; pinchTo = finger index 1..4 touching the thumb
export function fakeHand(cx, cy, size, ext = [1, 1, 1, 1, 1], tilt = 0, left = false, pinchTo = 0) {
  const sgn = left ? -1 : 1, P = [];
  const rot = (x, y) => { const c = Math.cos(tilt), s = Math.sin(tilt); return { x: cx + (x * c - y * s), y: cy + (x * s + y * c) }; };
  P[0] = rot(0, size * 0.55);
  const bases = [[-0.33, 0.25], [-0.2, -0.22], [-0.02, -0.26], [0.15, -0.22], [0.3, -0.14]];
  const lens = [0.42, 0.58, 0.64, 0.6, 0.48];
  for (let f = 0; f < 5; f++) {
    const [bx, by] = bases[f]; const bxs = bx * sgn * -1;
    const ang = f === 0 ? -2.3 * (sgn > 0 ? 1 : -1) * -1 : -Math.PI / 2 + (f - 2.4) * 0.13 * -sgn;
    let a = f === 0 ? (sgn > 0 ? -2.4 : -0.74) : ang;
    const L = lens[f] * size;
    const pts = [rot(bxs * size, by * size)];
    if (pinchTo && (f === 0 || f === pinchTo)) {
      const tipX = (bases[pinchTo][0] * sgn * -1 * 0.6 - 0.05 * sgn) * size, tipY = -0.62 * size;
      const s0 = { x: bxs * size, y: by * size };
      for (let j = 1; j <= 3; j++) { const t = j / 3; pts.push(rot(s0.x + (tipX - s0.x) * t + Math.sin(t * Math.PI) * 0.08 * size * (f ? sgn : -sgn), s0.y + (tipY - s0.y) * t)); }
    } else if (ext[f]) {
      for (let j = 1; j <= 3; j++) pts.push(rot(bxs * size + Math.cos(a) * L * j / 3, by * size + Math.sin(a) * L * j / 3));
    } else {
      const s0 = { x: bxs * size, y: by * size };
      const curl = f === 0 ? [[0.12, 0.1], [0.22, 0.16], [0.3, 0.14]] : [[0, -0.16], [0.02, -0.02], [0.01, 0.1]];
      for (const [qx, qy] of curl) pts.push(rot(s0.x + qx * size * (f === 0 ? -sgn * -1 : 1) * (f === 0 ? 1 : 1), s0.y + qy * size));
    }
    P.push(...pts);
  }
  return analyze(P);
}
