(() => {
  const stage = document.getElementById('camera-stage');
  const layer = document.getElementById('objects-layer');
  const objectCount = document.getElementById('object-count');
  const deleteButton = document.getElementById('delete-object');
  const gravityButton = document.getElementById('gravity-mode');
  const nongravityButton = document.getElementById('nongravity-mode');
  const collisionToggle = document.getElementById('collision-toggle');

  const shapeNames = {
    square: 'PERSEGI',
    circle: 'LINGKARAN',
    triangle: 'SEGITIGA',
    diamond: 'WAJIK'
  };
  const objects = [];
  let selectedObject;
  let nextId = 1;
  let gravityEnabled = true;
  let collisionsEnabled = true;
  let lastPhysicsTime = 0;

  function updateCount() {
    objectCount.textContent = `${objects.length} OBJEK`;
    deleteButton.disabled = !selectedObject;
  }

  function select(object) {
    if (!object || !objects.includes(object)) return;
    selectedObject = object;
    objects.forEach((item) => item.element.classList.toggle('is-selected', item === selectedObject));
    updateCount();
  }

  function clampObject(object, x = object.x, y = object.y) {
    const halfWidth = object.width / 2;
    const halfHeight = object.height / 2;
    return {
      x: Math.max(halfWidth, Math.min(stage.clientWidth - halfWidth, x)),
      y: Math.max(halfHeight, Math.min(stage.clientHeight - halfHeight, y))
    };
  }

  function renderObject(object) {
    const position = clampObject(object);
    object.x = position.x;
    object.y = position.y;
    object.element.style.left = `${object.x}px`;
    object.element.style.top = `${object.y}px`;
    object.element.style.width = `${object.width}px`;
    object.element.style.height = `${object.height}px`;
  }

  function add(shape = 'square', position) {
    if (!shapeNames[shape]) shape = 'square';

    const size = shape === 'triangle' ? { width: 88, height: 76 } : { width: 76, height: 76 };
    const element = document.createElement('div');
    const visual = document.createElement('div');
    const label = document.createElement('span');
    const offset = ((nextId - 1) % 5) * 22;
    const object = {
      id: nextId++, shape, width: size.width, height: size.height,
      x: position?.x ?? stage.clientWidth / 2 + offset,
      y: position?.y ?? stage.clientHeight / 2 + offset,
      vx: 0, vy: 0, lastMoveAt: 0, element
    };

    element.className = 'scene-object';
    element.dataset.shape = shape;
    element.dataset.objectId = String(object.id);
    visual.className = 'object-visual';
    label.className = 'object-label';
    label.textContent = `${shapeNames[shape]} ${object.id}`;
    element.append(visual, label);
    element.addEventListener('pointerdown', () => select(object));
    layer.append(element);
    objects.push(object);
    renderObject(object);
    select(object);
    updateCount();
    return object;
  }

  function removeSelected() {
    if (!selectedObject) return false;
    const removedIndex = objects.indexOf(selectedObject);
    selectedObject.element.remove();
    objects.splice(removedIndex, 1);
    selectedObject = objects[Math.min(removedIndex, objects.length - 1)];
    if (selectedObject) select(selectedObject);
    updateCount();
    return true;
  }

  function hitTest(point) {
    for (let index = objects.length - 1; index >= 0; index -= 1) {
      const object = objects[index];
      const inside = Math.abs(point.x - object.x) <= object.width / 2 + Math.max(36, object.width * 0.2)
        && Math.abs(point.y - object.y) <= object.height / 2 + Math.max(36, object.height * 0.2);
      if (inside) {
        select(object);
        return object;
      }
    }
    return undefined;
  }

  function moveTo(object, x, y, now) {
    if (!objects.includes(object)) return;
    const previous = { x: object.x, y: object.y };
    const position = clampObject(object, x, y);
    const elapsed = object.lastMoveAt ? Math.max((now - object.lastMoveAt) / 1000, 0.016) : 0.016;
    object.vx = (position.x - previous.x) / elapsed;
    object.vy = (position.y - previous.y) / elapsed;
    object.lastMoveAt = now;
    object.x = position.x;
    object.y = position.y;
    renderObject(object);
  }

  function resize(object, width, height, x, y) {
    if (!objects.includes(object)) return;
    object.width = Math.max(48, Math.min(stage.clientWidth - 12, width));
    object.height = Math.max(48, Math.min(stage.clientHeight - 12, height));
    object.x = x;
    object.y = y;
    object.vx = 0;
    object.vy = 0;
    renderObject(object);
  }

  function selectNext() {
    if (!objects.length) return undefined;
    const currentIndex = objects.indexOf(selectedObject);
    const nextObject = objects[(currentIndex + 1) % objects.length];
    select(nextObject);
    return nextObject;
  }

  function selectPrevious() {
    if (!objects.length) return undefined;
    const currentIndex = objects.indexOf(selectedObject);
    const previousObject = objects[(currentIndex - 1 + objects.length) % objects.length];
    select(previousObject);
    return previousObject;
  }

  function launchSelected() {
    if (!selectedObject) return false;
    selectedObject.vy = -760;
    selectedObject.lastMoveAt = 0;
    return true;
  }

  function setGravity(enabled) {
    gravityEnabled = Boolean(enabled);
    gravityButton.setAttribute('aria-pressed', String(gravityEnabled));
    nongravityButton.setAttribute('aria-pressed', String(!gravityEnabled));
    lastPhysicsTime = 0;
    if (!gravityEnabled) objects.forEach((object) => { object.vx = 0; object.vy = 0; });
  }

  function setCollisions(enabled) {
    collisionsEnabled = Boolean(enabled);
    collisionToggle.checked = collisionsEnabled;
  }

  function resolveCollisions() {
    if (!collisionsEnabled || objects.length < 2) return;

    for (let iteration = 0; iteration < 8; iteration += 1) {
      for (let firstIndex = 0; firstIndex < objects.length - 1; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < objects.length; secondIndex += 1) {
          const first = objects[firstIndex];
          const second = objects[secondIndex];
          const deltaX = second.x - first.x;
          const deltaY = second.y - first.y;
          const overlapX = (first.width + second.width) / 2 - Math.abs(deltaX);
          const overlapY = (first.height + second.height) / 2 - Math.abs(deltaY);
          if (overlapX <= 0 || overlapY <= 0) continue;

          if (overlapX < overlapY) {
            const normalX = deltaX >= 0 ? 1 : -1;
            first.x -= normalX * overlapX / 2;
            second.x += normalX * overlapX / 2;
            const relativeVelocity = (second.vx - first.vx) * normalX;
            if (relativeVelocity < 0) {
              const impulse = -(1 + 0.42) * relativeVelocity / 2;
              first.vx -= impulse * normalX;
              second.vx += impulse * normalX;
            }
            first.vy *= 0.985;
            second.vy *= 0.985;
          } else {
            const normalY = deltaY >= 0 ? 1 : -1;
            first.y -= normalY * overlapY / 2;
            second.y += normalY * overlapY / 2;
            const relativeVelocity = (second.vy - first.vy) * normalY;
            if (relativeVelocity < 0) {
              const impulse = -(1 + 0.42) * relativeVelocity / 2;
              first.vy -= impulse * normalY;
              second.vy += impulse * normalY;
            }
            first.vx *= 0.985;
            second.vx *= 0.985;
          }

          const firstPosition = clampObject(first);
          const secondPosition = clampObject(second);
          first.x = firstPosition.x;
          first.y = firstPosition.y;
          second.x = secondPosition.x;
          second.y = secondPosition.y;
        }
      }
    }
  }

  function tick(now, paused = false) {
    if (paused || layer.classList.contains('is-disabled')) {
      lastPhysicsTime = now;
      return;
    }
    if (!lastPhysicsTime) {
      lastPhysicsTime = now;
      return;
    }

    const elapsed = Math.min((now - lastPhysicsTime) / 1000, 0.05);
    lastPhysicsTime = now;
    objects.forEach((object) => {
      if (gravityEnabled) object.vy = Math.min(object.vy + 1500 * elapsed, 1800);
      object.vx *= Math.pow(0.16, elapsed);
      let nextX = object.x + object.vx * elapsed;
      let nextY = object.y + object.vy * elapsed;
      const halfWidth = object.width / 2;
      const halfHeight = object.height / 2;

      if (nextY >= stage.clientHeight - halfHeight) {
        nextY = stage.clientHeight - halfHeight;
        object.vy = Math.abs(object.vy) > 90 ? -object.vy * 0.38 : 0;
      }
      if (nextX < halfWidth || nextX > stage.clientWidth - halfWidth) {
        nextX = Math.max(halfWidth, Math.min(stage.clientWidth - halfWidth, nextX));
        object.vx *= -0.35;
      }

      object.x = nextX;
      object.y = nextY;
    });
    resolveCollisions();
    objects.forEach(renderObject);
  }

  function setActive(active) {
    layer.classList.toggle('is-disabled', !active);
  }

  document.querySelectorAll('[data-add-shape]').forEach((button) => {
    button.addEventListener('click', () => add(button.dataset.addShape));
  });
  deleteButton.addEventListener('click', removeSelected);
  gravityButton.addEventListener('click', () => setGravity(true));
  nongravityButton.addEventListener('click', () => setGravity(false));
  collisionToggle.addEventListener('change', () => setCollisions(collisionToggle.checked));
  document.addEventListener('camera:started', () => setActive(true));
  document.addEventListener('camera:stopped', () => setActive(false));

  add('square', { x: stage.clientWidth / 2, y: stage.clientHeight / 2 });
  setActive(false);

  window.sceneObjects = {
    add,
    getSelected: () => selectedObject,
    getAll: () => objects,
    hitTest,
    moveTo,
    removeSelected,
    resize,
    select,
    selectPrevious,
    selectNext,
    launchSelected,
    setGravity,
    setCollisions,
    tick
  };
})();