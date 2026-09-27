const video = document.getElementById('camera-video');
const faceBoxes = document.getElementById('face-boxes');
const stage = document.getElementById('camera-stage');
const idleState = document.getElementById('stage-idle');
const loadingState = document.getElementById('stage-loading');
const cameraState = document.getElementById('camera-state');
const cameraResolution = document.getElementById('camera-resolution');
const cameraToggle = document.getElementById('camera-toggle');
const cameraSelect = document.getElementById('camera-select');
const mirrorToggle = document.getElementById('mirror-toggle');
const mirrorLabel = document.getElementById('mirror-label');
const buttonLabel = document.getElementById('button-label');
const statusMessage = document.getElementById('status-message');
const faceResults = document.getElementById('face-results');
const faceCount = document.getElementById('face-count');
const resultCount = document.getElementById('result-count');
const liveIndicator = document.getElementById('live-indicator');

const modelUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
const expressionNames = {
  neutral: 'Netral', happy: 'Senang', sad: 'Sedih', angry: 'Marah',
  fearful: 'Takut', disgusted: 'Jijik', surprised: 'Terkejut'
};

let stream;
let isRunning = false;
let isDetecting = false;
let animationFrame;
let faceAnimationFrame;
let previousFaceFrame = 0;
let modelsLoaded = false;
let faceTracks = [];
let nextFaceId = 1;

async function refreshCameraOptions(preferredDeviceId = cameraSelect.value) {
  if (!navigator.mediaDevices?.enumerateDevices) {
    cameraSelect.disabled = true;
    return;
  }

  try {
    const cameras = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'videoinput');
    const options = [new Option('Otomatis (kamera utama)', '')];
    cameras.forEach((camera, index) => {
      options.push(new Option(camera.label || `Kamera ${index + 1}`, camera.deviceId));
    });
    cameraSelect.replaceChildren(...options);
    cameraSelect.value = cameras.some((camera) => camera.deviceId === preferredDeviceId) ? preferredDeviceId : '';
    cameraSelect.disabled = cameras.length === 0;
  } catch (error) {
    cameraSelect.disabled = true;
    console.warn('Daftar kamera tidak dapat dimuat.', error);
  }
}

function setMessage(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
}

function setCameraActive(active) {
  isRunning = active;
  cameraToggle.classList.toggle('is-stop', active);
  buttonLabel.textContent = active ? 'Hentikan kamera' : 'Aktifkan kamera';
  cameraToggle.querySelector('.button-icon').textContent = active ? '■' : '▷';
  cameraToggle.querySelector('.button-arrow').textContent = active ? '' : '↗';
  cameraState.textContent = active ? 'DETEKSI AKTIF' : 'KAMERA NONAKTIF';
  liveIndicator.classList.toggle('active', active);
  stage.classList.toggle('scanning', active);
}

function clearResults() {
  faceTracks.forEach((track) => {
    track.element.remove();
    track.card.remove();
  });
  faceTracks = [];
  nextFaceId = 1;
  faceBoxes.replaceChildren();
  faceResults.innerHTML = '<div class="empty-result"><span aria-hidden="true">＋</span><p>Belum ada wajah terdeteksi</p></div>';
  faceCount.textContent = '0 WAJAH';
  resultCount.textContent = '00';
}

async function loadModels() {
  if (modelsLoaded) return;
  if (!window.faceapi) throw new Error('Pustaka deteksi wajah tidak berhasil dimuat. Periksa koneksi internet lalu muat ulang halaman.');

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
    faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
    faceapi.nets.ageGenderNet.loadFromUri(modelUrl)
  ]);
  modelsLoaded = true;
}

function getTopExpression(expressions) {
  const [name, confidence] = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0];
  return { key: name, name: expressionNames[name] || name, confidence };
}

function createFaceTrack(detection, box, now) {
  const element = document.createElement('div');
  const label = document.createElement('p');
  const card = document.createElement('article');
  const cardTop = document.createElement('div');
  const title = document.createElement('span');
  const confidence = document.createElement('span');
  const meta = document.createElement('div');
  const expression = document.createElement('span');
  const age = document.createElement('span');
  const initialExpression = getTopExpression(detection.expressions);

  element.className = 'face-box';
  label.className = 'face-tag';
  element.style.width = `${box.width}px`;
  element.style.height = `${box.height}px`;
  element.style.transform = `translate3d(${box.x}px, ${box.y}px, 0)`;
  element.append(label);
  faceBoxes.append(element);

  card.className = 'face-card';
  cardTop.className = 'face-card-top';
  title.className = 'face-card-title';
  confidence.className = 'face-confidence';
  meta.className = 'face-card-meta';
  expression.className = 'expression-value';
  age.className = 'age-value';
  cardTop.append(title, confidence);
  meta.append(expression, age);
  card.append(cardTop, meta);
  faceResults.append(card);

  const track = {
    id: nextFaceId++, element, label, card, title, confidence, expression, age,
    box: { ...box },
    targetBox: { ...box },
    smoothedAge: detection.age,
    displayedAge: Math.round(detection.age),
    expressionKey: initialExpression.key,
    expressionScores: { ...detection.expressions },
    detectionConfidence: detection.detection.score,
    lastSeen: now
  };
  title.textContent = `Wajah ${track.id}`;
  return track;
}

function findMatchingTrack(box, usedTracks, now) {
  let bestTrack;
  let bestDistance = Infinity;

  faceTracks.forEach((track) => {
    if (usedTracks.has(track) || now - track.lastSeen > 850) return;
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const previousBox = track.targetBox || track.box;
    const previousCenterX = previousBox.x + previousBox.width / 2;
    const previousCenterY = previousBox.y + previousBox.height / 2;
    const size = Math.max(24, Math.min(box.width, box.height, previousBox.width, previousBox.height));
    const distance = Math.hypot(centerX - previousCenterX, centerY - previousCenterY) / size;
    const sizeRatio = box.width / previousBox.width;

    if (distance < 1.25 && sizeRatio > 0.45 && sizeRatio < 2.2 && distance < bestDistance) {
      bestTrack = track;
      bestDistance = distance;
    }
  });

  return bestTrack;
}

function updateFaceTrack(track, detection, targetBox, now) {
  track.targetBox = { ...targetBox };
  track.element.classList.remove('is-stale');
  track.card.classList.remove('is-stale');

  track.smoothedAge = track.smoothedAge * 0.96 + detection.age * 0.04;
  if (Math.abs(track.smoothedAge - track.displayedAge) >= 1.35) {
    track.displayedAge = Math.round(track.smoothedAge);
  }

  Object.entries(detection.expressions).forEach(([key, score]) => {
    track.expressionScores[key] = track.expressionScores[key] * 0.8 + score * 0.2;
  });
  const expression = getTopExpression(track.expressionScores);
  const currentExpressionScore = track.expressionScores[track.expressionKey] || 0;
  if (expression.key === track.expressionKey || expression.confidence > currentExpressionScore + 0.12) {
    track.expressionKey = expression.key;
  }
  const stableExpression = expressionNames[track.expressionKey] || track.expressionKey;

  track.detectionConfidence = track.detectionConfidence * 0.8 + detection.detection.score * 0.2;
  track.label.textContent = `Wajah ${track.id} · ${track.displayedAge} th · ${stableExpression}`;
  track.confidence.textContent = `${Math.round(track.detectionConfidence * 100)}% yakin`;
  track.expression.textContent = stableExpression;
  track.age.textContent = `Estimasi ${track.displayedAge} tahun`;
  track.lastSeen = now;
}

function animateFaceTracks(now) {
  const elapsed = previousFaceFrame ? Math.min(now - previousFaceFrame, 100) : 16;
  const smoothing = 1 - Math.exp(-elapsed / 90);
  previousFaceFrame = now;

  faceTracks.forEach((track) => {
    ['x', 'y', 'width', 'height'].forEach((key) => {
      track.box[key] += (track.targetBox[key] - track.box[key]) * smoothing;
    });
    track.element.style.transform = `translate3d(${track.box.x}px, ${track.box.y}px, 0)`;
    track.element.style.width = `${track.box.width}px`;
    track.element.style.height = `${track.box.height}px`;
    track.label.style.top = track.box.y > 28 ? '-25px' : '2px';
  });

  if (isRunning) faceAnimationFrame = requestAnimationFrame(animateFaceTracks);
}

function renderResults(detections) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  const stageWidth = stage.clientWidth;
  const stageHeight = stage.clientHeight;
  const scale = Math.min(stageWidth / width, stageHeight / height);
  const offsetX = (stageWidth - width * scale) / 2;
  const offsetY = (stageHeight - height * scale) / 2;
  const now = performance.now();
  const usedTracks = new Set();

  detections.forEach((detection) => {
    const sourceBox = detection.detection.box;
    const box = {
      x: stage.classList.contains('is-unmirrored')
        ? stageWidth - offsetX - (sourceBox.x + sourceBox.width) * scale
        : offsetX + sourceBox.x * scale,
      y: offsetY + sourceBox.y * scale,
      width: sourceBox.width * scale,
      height: sourceBox.height * scale
    };
    let track = findMatchingTrack(box, usedTracks, now);
    if (!track) {
      track = createFaceTrack(detection, box, now);
      faceTracks.push(track);
    }
    usedTracks.add(track);
    updateFaceTrack(track, detection, box, now);
  });

  faceTracks = faceTracks.filter((track) => {
    const age = now - track.lastSeen;
    if (age > 850) {
      track.element.remove();
      track.card.remove();
      return false;
    }
    track.element.classList.toggle('is-stale', age > 280);
    track.card.classList.toggle('is-stale', age > 280);
    return true;
  });

  const emptyResult = faceResults.querySelector('.empty-result');
  if (detections.length === 0 && !emptyResult) {
    faceResults.insertAdjacentHTML('afterbegin', '<div class="empty-result"><span aria-hidden="true">＋</span><p>Belum ada wajah terdeteksi</p></div>');
  } else if (detections.length > 0 && emptyResult) {
    emptyResult.remove();
  }

  faceCount.textContent = `${detections.length} WAJAH`;
  resultCount.textContent = String(detections.length).padStart(2, '0');
}

async function detectFrame() {
  if (!isRunning || isDetecting) return;
  isDetecting = true;

  try {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 }))
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();
    if (isRunning) renderResults(detections);
  } catch (error) {
    setMessage('Analisis terhenti. Coba mulai ulang kamera.', true);
    stopCamera();
    console.error(error);
    return;
  } finally {
    isDetecting = false;
  }

  if (isRunning) animationFrame = requestAnimationFrame(detectFrame);
}

function stopCamera() {
  isRunning = false;
  cancelAnimationFrame(animationFrame);
  cancelAnimationFrame(faceAnimationFrame);
  previousFaceFrame = 0;
  if (stream) stream.getTracks().forEach((track) => track.stop());
  stream = undefined;
  video.srcObject = null;
  video.classList.remove('ready');
  idleState.hidden = false;
  loadingState.hidden = true;
  cameraResolution.textContent = '-- : --';
  setCameraActive(false);
  clearResults();
  document.dispatchEvent(new Event('camera:stopped'));
}

async function startCamera() {
  cameraToggle.disabled = true;
  idleState.hidden = true;
  loadingState.hidden = false;
  setMessage('Meminta izin kamera dan menyiapkan model...');

  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Kamera memerlukan localhost atau HTTPS. Buka halaman melalui server lokal, bukan file langsung.');
    }

    await loadModels();
    const videoConstraints = cameraSelect.value
      ? { deviceId: { exact: cameraSelect.value } }
      : { facingMode: 'user' };
    stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
    const activeDeviceId = stream.getVideoTracks()[0].getSettings().deviceId;
    await refreshCameraOptions(activeDeviceId);
    video.srcObject = stream;
    await new Promise((resolve) => { video.onloadedmetadata = resolve; });
    await video.play();

    stage.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
    cameraResolution.textContent = `${video.videoWidth} : ${video.videoHeight}`;
    video.classList.add('ready');
    loadingState.hidden = true;
    setCameraActive(true);
    document.dispatchEvent(new Event('camera:started'));
    setMessage('Sesi aktif. Analisis diproses di perangkat ini.');
    previousFaceFrame = 0;
    faceAnimationFrame = requestAnimationFrame(animateFaceTracks);
    animationFrame = requestAnimationFrame(detectFrame);
  } catch (error) {
    stopCamera();
    setMessage(error.name === 'NotAllowedError'
      ? 'Izin kamera ditolak. Izinkan akses kamera lalu coba lagi.'
      : error.message || 'Kamera tidak dapat diakses. Periksa perangkat dan izinnya.', true);
  } finally {
    cameraToggle.disabled = false;
  }
}

cameraToggle.addEventListener('click', () => {
  if (isRunning) {
    stopCamera();
    setMessage('Kamera dihentikan.');
  } else {
    startCamera();
  }
});

cameraSelect.addEventListener('change', () => {
  if (isRunning) {
    stopCamera();
    startCamera();
    return;
  }

  const selectedLabel = cameraSelect.selectedOptions[0]?.textContent || 'Kamera';
  setMessage(`${selectedLabel} dipilih.`);
});

mirrorToggle.addEventListener('click', () => {
  const isCorrected = stage.classList.toggle('is-unmirrored');
  mirrorToggle.setAttribute('aria-pressed', String(isCorrected));
  mirrorToggle.title = isCorrected ? 'Koreksi mirror aktif' : 'Koreksi mirror nonaktif';
  mirrorLabel.textContent = isCorrected ? 'ASLI' : 'MIRROR';
});

navigator.mediaDevices?.addEventListener('devicechange', () => {
  const activeDeviceId = stream?.getVideoTracks()[0].getSettings().deviceId;
  refreshCameraOptions(activeDeviceId || cameraSelect.value);
});

refreshCameraOptions();
window.addEventListener('pagehide', stopCamera);
