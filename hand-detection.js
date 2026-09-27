(() => {
  const video = document.getElementById('camera-video');
  const stage = document.getElementById('camera-stage');
  const handCount = document.getElementById('hand-count');
  const handStatus = document.getElementById('hand-status');
  const objects = window.sceneObjects;

  const taskVisionUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';
  const wasmUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
  const handModelUrl = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
  const pinchFrames = new Map();
  let handLandmarker;
  let tracking = false;
  let trackingSession = 0;
  let animationFrame;
  let lastVideoTime = -1;
  let lastDetectionTime = 0;
  let grabbedObjects = new Map();
  let resizeGesture;
  let pendingGesture = '';
  let pendingGestureFrames = 0;
  let gestureReleaseFrames = 0;
  let gestureArmed = true;
  let lastGestureTime = 0;
  let gestureFeedback = '';
  let gestureFeedbackUntil = 0;

  function setStatus(message, isError = false) {
    handStatus.textContent = message;
    handStatus.classList.toggle('is-error', isError);
  }

  async function loadHandLandmarker() {
    if (handLandmarker) return handLandmarker;

    const { FilesetResolver, HandLandmarker } = await import(taskVisionUrl);
    const files = await FilesetResolver.forVisionTasks(wasmUrl);
    const options = {
      baseOptions: { modelAssetPath: handModelUrl, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.45,
      minHandPresenceConfidence: 0.45,
      minTrackingConfidence: 0.45
    };

    try {
      handLandmarker = await HandLandmarker.createFromOptions(files, options);
    } catch (error) {
      handLandmarker = await HandLandmarker.createFromOptions(files, {
        ...options,
        baseOptions: { modelAssetPath: handModelUrl, delegate: 'CPU' }
      });
    }
    return handLandmarker;
  }

  function toStagePoint(landmark) {
    const scale = Math.min(stage.clientWidth / video.videoWidth, stage.clientHeight / video.videoHeight);
    const offsetX = (stage.clientWidth - video.videoWidth * scale) / 2;
    const offsetY = (stage.clientHeight - video.videoHeight * scale) / 2;
    const rawX = offsetX + landmark.x * video.videoWidth * scale;
    return {
      x: stage.classList.contains('is-unmirrored') ? stage.clientWidth - rawX : rawX,
      y: offsetY + landmark.y * video.videoHeight * scale
    };
  }

  function refreshGrabbedObjects() {
    const grabbed = new Set(Array.from(grabbedObjects.values(), (grab) => grab.object));
    objects.getAll().forEach((object) => object.element.classList.toggle('is-grabbed', grabbed.has(object)));
  }

  function setGrabbedObject(handIndex, grab) {
    if (grab) {
      grabbedObjects.set(handIndex, grab);
      objects.select(grab.object);
    } else {
      grabbedObjects.delete(handIndex);
    }
    refreshGrabbedObjects();
  }

  function clearGrabbedObjects() {
    grabbedObjects.clear();
    refreshGrabbedObjects();
  }

  function setResizeGesture(gesture) {
    if (resizeGesture?.object) resizeGesture.object.element.classList.remove('is-resizing');
    resizeGesture = gesture;
    if (resizeGesture?.object) {
      objects.select(resizeGesture.object);
      resizeGesture.object.element.classList.add('is-resizing');
    }
  }

  function findResizePair(candidates) {
    const selected = objects.getSelected();
    if (candidates.length < 2 || !selected) return undefined;

    for (let firstIndex = 0; firstIndex < candidates.length - 1; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < candidates.length; secondIndex += 1) {
        const first = candidates[firstIndex];
        const second = candidates[secondIndex];
        const deltaX = second.point.x - first.point.x;
        const deltaY = second.point.y - first.point.y;
        const midpoint = { x: (first.point.x + second.point.x) / 2, y: (first.point.y + second.point.y) / 2 };
        const nearObject = Math.abs(midpoint.x - selected.x) <= selected.width / 2 + 120
          && Math.abs(midpoint.y - selected.y) <= selected.height / 2 + 120;
        if (!nearObject) continue;

        if (Math.abs(deltaX) >= Math.abs(deltaY) * 1.2
          && deltaX * (first.point.x - selected.x) < 0
          && deltaX * (second.point.x - selected.x) > 0
          && Math.abs(deltaY) <= selected.height / 2 + 100) {
          return { first, second, object: selected, axis: 'x', midpoint, distance: Math.abs(deltaX) };
        }

        if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2
          && deltaY * (first.point.y - selected.y) < 0
          && deltaY * (second.point.y - selected.y) > 0
          && Math.abs(deltaX) <= selected.width / 2 + 100) {
          return { first, second, object: selected, axis: 'y', midpoint, distance: Math.abs(deltaY) };
        }
      }
    }

    return undefined;
  }

  function startResizeGesture(pair, now) {
    clearGrabbedObjects();
    setResizeGesture({
      object: pair.object,
      axis: pair.axis,
      handIndices: [pair.first.handIndex, pair.second.handIndex],
      startDistance: pair.distance,
      startWidth: pair.object.width,
      startHeight: pair.object.height,
      lastActive: now
    });
  }

  function updateResizeGesture(pair, now) {
    const width = pair.axis === 'x'
      ? resizeGesture.startWidth + pair.distance - resizeGesture.startDistance
      : resizeGesture.startWidth;
    const height = pair.axis === 'y'
      ? resizeGesture.startHeight + pair.distance - resizeGesture.startDistance
      : resizeGesture.startHeight;
    objects.resize(resizeGesture.object, width, height, pair.midpoint.x, pair.midpoint.y);
    resizeGesture.lastActive = now;
  }

  function updateGravity(now) {
    objects.tick(now, Boolean(grabbedObjects.size || resizeGesture));
  }

  function distance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function classifyGesture(points) {
    const wrist = points[0];
    const extended = [
      distance(points[4], wrist) > distance(points[3], wrist) * 1.12,
      distance(points[8], wrist) > distance(points[6], wrist) * 1.12,
      distance(points[12], wrist) > distance(points[10], wrist) * 1.12,
      distance(points[16], wrist) > distance(points[14], wrist) * 1.12,
      distance(points[20], wrist) > distance(points[18], wrist) * 1.12
    ];
    const [thumb, index, middle, ring, pinky] = extended;

    if (thumb && !index && !middle && !ring && !pinky && points[4].y < points[3].y - stage.clientHeight * 0.035) return 'thumbs-up';
    if (extended.every(Boolean)) return 'open-palm';
    if (!thumb && index && middle && !ring && !pinky) return 'peace';
    if (!thumb && index && !middle && !ring && pinky) return 'rock-on';
    if (!thumb && index && !middle && !ring && !pinky) return 'point';
    return '';
  }

  function fireGesture(gesture, point, now) {
    if (gesture === 'point') {
      gestureFeedback = objects.hitTest(point) ? 'TELUNJUK · OBJEK DIPILIH' : 'TELUNJUK · TIDAK ADA OBJEK';
    }
    if (gesture === 'peace') {
      gestureFeedback = objects.selectNext() ? 'PEACE · PILIH OBJEK BERIKUT' : 'PEACE · BELUM ADA OBJEK';
    }
    if (gesture === 'thumbs-up') {
      gestureFeedback = objects.launchSelected() ? 'THUMBS-UP · OBJEK DILEMPAR' : 'THUMBS-UP · BELUM ADA OBJEK';
    }
    if (gesture === 'open-palm') {
      gestureFeedback = objects.selectPrevious() ? 'TELAPAK TERBUKA · PILIH OBJEK SEBELUMNYA' : 'TELAPAK TERBUKA · BELUM ADA OBJEK';
    }
    if (gesture === 'rock-on') {
      gestureFeedback = objects.removeSelected() ? 'ROCK-ON · OBJEK DIHAPUS' : 'ROCK-ON · BELUM ADA OBJEK';
    }
    gestureFeedbackUntil = now + 1100;
  }

  function updateGesture(observations, now) {
    const observation = observations.find((item) => item.gesture);
    if (observation) {
      gestureReleaseFrames = 0;
      if (pendingGesture === observation.gesture) {
        pendingGestureFrames += 1;
      } else {
        pendingGesture = observation.gesture;
        pendingGestureFrames = 1;
      }

      if (pendingGestureFrames >= 5 && gestureArmed && now - lastGestureTime > 900) {
        fireGesture(observation.gesture, observation.point, now);
        gestureArmed = false;
        lastGestureTime = now;
      }
      return;
    }

    pendingGesture = '';
    pendingGestureFrames = 0;
    if (!gestureArmed && ++gestureReleaseFrames >= 4) {
      gestureArmed = true;
      gestureReleaseFrames = 0;
    }
  }

  function renderHands(result, now) {
    const hands = result.landmarks || [];
    const pinchCandidates = [];
    const gestureObservations = [];
    handCount.textContent = `${hands.length} TANGAN`;

    hands.forEach((landmarks, index) => {
      const points = landmarks.map(toStagePoint);
      gestureObservations.push({ gesture: classifyGesture(points), point: points[8] });

      const thumbTip = points[4];
      const indexTip = points[8];
      const palmWidth = Math.hypot(points[5].x - points[17].x, points[5].y - points[17].y);
      const pinchRatio = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y) / Math.max(palmWidth, 1);
      const pinchState = pinchFrames.get(index) || { frames: 0, isClosed: false };
      if (!pinchState.isClosed && pinchRatio < 0.52) {
        pinchState.frames += 1;
        if (pinchState.frames >= 2) pinchState.isClosed = true;
      } else if (pinchState.isClosed && pinchRatio > 0.68) {
        pinchState.isClosed = false;
        pinchState.frames = 0;
      } else if (!pinchState.isClosed) {
        pinchState.frames = 0;
      }
      pinchFrames.set(index, pinchState);

      if (pinchState.isClosed) {
        pinchCandidates.push({
          handIndex: index,
          point: { x: (thumbTip.x + indexTip.x) / 2, y: (thumbTip.y + indexTip.y) / 2 }
        });
      }
    });
    updateGesture(gestureObservations, now);

    if (resizeGesture) {
      const [firstIndex, secondIndex] = resizeGesture.handIndices;
      const first = pinchCandidates.find((candidate) => candidate.handIndex === firstIndex);
      const second = pinchCandidates.find((candidate) => candidate.handIndex === secondIndex);
      if (first && second) {
        const midpoint = { x: (first.point.x + second.point.x) / 2, y: (first.point.y + second.point.y) / 2 };
        const distance = resizeGesture.axis === 'x'
          ? Math.abs(first.point.x - second.point.x)
          : Math.abs(first.point.y - second.point.y);
        updateResizeGesture({ axis: resizeGesture.axis, midpoint, distance }, now);
      } else if (now - resizeGesture.lastActive > 180) {
        setResizeGesture(null);
      }
    }

    if (!resizeGesture && pinchCandidates.length > 1) {
      const pair = findResizePair(pinchCandidates);
      if (pair) startResizeGesture(pair, now);
    }

    if (!resizeGesture) {
      for (const [handIndex, grab] of grabbedObjects) {
        const candidate = pinchCandidates.find((pinch) => pinch.handIndex === handIndex);
        if (candidate && objects.getAll().includes(grab.object)) {
          objects.moveTo(grab.object, candidate.point.x + grab.offsetX, candidate.point.y + grab.offsetY, now);
          grab.lastActive = now;
        } else if (!objects.getAll().includes(grab.object) || now - grab.lastActive > 180) {
          setGrabbedObject(handIndex, null);
        }
      }

      const occupiedObjects = new Set(Array.from(grabbedObjects.values(), (grab) => grab.object));
      pinchCandidates.forEach((candidate) => {
        if (grabbedObjects.has(candidate.handIndex)) return;
        const object = objects.hitTest(candidate.point);
        if (!object || occupiedObjects.has(object)) return;
        occupiedObjects.add(object);
        setGrabbedObject(candidate.handIndex, {
          object,
          offsetX: object.x - candidate.point.x,
          offsetY: object.y - candidate.point.y,
          lastActive: now
        });
      });
    }

    if (now < gestureFeedbackUntil) {
      setStatus(gestureFeedback);
    } else if (resizeGesture) {
      setStatus(resizeGesture.axis === 'x' ? 'UBAH LEBAR KOTAK' : 'UBAH TINGGI KOTAK');
    } else if (grabbedObjects.size) {
      setStatus(`${grabbedObjects.size} OBJEK · DICUBIT`);
    } else if (hands.length) {
      setStatus(`${hands.length} TANGAN TERDETEKSI`);
    } else {
      setStatus('MENUNGGU TANGAN');
    }
  }

  function resetHandState() {
    pinchFrames.clear();
    handCount.textContent = '0 TANGAN';
    setResizeGesture(null);
    clearGrabbedObjects();
  }

  async function startTracking() {
    const session = ++trackingSession;
    tracking = true;
    pendingGesture = '';
    pendingGestureFrames = 0;
    gestureReleaseFrames = 0;
    gestureArmed = true;
    setStatus('MEMUAT MODEL TANGAN...');

    try {
      await loadHandLandmarker();
      if (!tracking || session !== trackingSession) return;
      lastVideoTime = -1;
      lastDetectionTime = 0;
      animationFrame = requestAnimationFrame((now) => detectFrame(now, session));
    } catch (error) {
      tracking = false;
      setStatus('MODEL TANGAN GAGAL DIMUAT', true);
      console.error('Hand tracking could not start.', error);
    }
  }

  function detectFrame(now, session) {
    if (!tracking || session !== trackingSession) return;
    updateGravity(now);

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      && video.currentTime !== lastVideoTime
      && now - lastDetectionTime >= 65) {
      lastVideoTime = video.currentTime;
      lastDetectionTime = now;
      try {
        renderHands(handLandmarker.detectForVideo(video, now), now);
      } catch (error) {
        tracking = false;
        resetHandState();
        setStatus('DETEKSI TANGAN TERHENTI', true);
        console.error('Hand tracking failed.', error);
        return;
      }
    }

    animationFrame = requestAnimationFrame((nextTime) => detectFrame(nextTime, session));
  }

  function stopTracking() {
    tracking = false;
    trackingSession += 1;
    cancelAnimationFrame(animationFrame);
    resetHandState();
    pendingGesture = '';
    pendingGestureFrames = 0;
    gestureArmed = true;
    setStatus('SIAP SAAT KAMERA AKTIF');
  }

  document.addEventListener('camera:started', startTracking);
  document.addEventListener('camera:stopped', stopTracking);
})();