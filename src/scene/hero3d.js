import * as THREE from 'three';
import { createHeroEnvironment } from './environment.js';
import { createRavenModel } from './raven-model.js';

function createRenderer(canvas) {
  try {
    return new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (error) {
    canvas.style.display = 'none';
    return null;
  }
}

function addSceneLights(scene) {
  const ambient = new THREE.AmbientLight(0x30384a, 0.6);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xe6ecff, 2.3);
  key.position.set(-5, 7, 6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x7d90c8, 1.7);
  rim.position.set(6, 3, -6);
  scene.add(rim);

  const moonGlow = new THREE.PointLight(0xffe2b0, 5, 11, 2);
  moonGlow.position.set(2.7, 1.7, -1.2);
  scene.add(moonGlow);
  return { ambient, key, rim, moonGlow };
}

export function initHero3D(canvas) {
  if (!canvas) return;

  const renderer = createRenderer(canvas);
  if (!renderer) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050506, 9.5, 19);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
  camera.position.set(0, 0, 9);

  const root = new THREE.Group();
  const farGroup = new THREE.Group();
  const midGroup = new THREE.Group();
  const nearGroup = new THREE.Group();
  root.add(farGroup, midGroup, nearGroup);
  scene.add(root);

  const lights = addSceneLights(scene);
  const raven = createRavenModel(midGroup);
  const environment = createHeroEnvironment({ farGroup, nearGroup });
  const hero = canvas.closest('.hero');
  const scanTriggers = hero?.querySelectorAll('.install-copy') || [];

  const pointerTarget = { x: 0, y: 0 };
  const pointer = { x: 0, y: 0 };
  const eyeTarget = { x: 0, y: 0 };
  const eyeLook = { x: 0, y: 0 };
  const transition = { scan: 0, scanTarget: 0, exit: 0, exitTarget: 0 };
  const gatherPoint = { x: 1.15, y: 0.8 };
  let scanTimer = null;

  function startScan() {
    if (reduceMotion) return;
    window.clearTimeout(scanTimer);
    transition.scanTarget = 1;
    hero?.classList.add('is-scanning');
    scanTimer = window.setTimeout(() => {
      transition.scanTarget = 0;
      hero?.classList.remove('is-scanning');
    }, 900);
  }

  scanTriggers.forEach((trigger) => {
    trigger.addEventListener('pointerenter', startScan);
    trigger.addEventListener('focus', startScan);
  });

  if (!reduceMotion) {
    window.addEventListener('pointermove', (event) => {
      pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerTarget.y = (event.clientY / window.innerHeight) * 2 - 1;
      if (event.pointerType !== 'touch') {
        eyeTarget.x = THREE.MathUtils.clamp(pointerTarget.x, -1, 1);
        eyeTarget.y = THREE.MathUtils.clamp(-pointerTarget.y, -1, 1);
      }
    }, { passive: true });
    window.addEventListener('pointerleave', () => {
      pointerTarget.x = 0;
      pointerTarget.y = 0;
      eyeTarget.x = 0;
      eyeTarget.y = 0;
    });
    const updateExitTarget = () => {
      const heroHeight = hero?.offsetHeight || window.innerHeight;
      const progress = window.scrollY / heroHeight;
      transition.exitTarget = THREE.MathUtils.smoothstep(progress, 0.18, 0.92);
    };
    window.addEventListener('scroll', updateExitTarget, { passive: true });
    updateExitTarget();
  }

  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    const wide = width > 860;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    raven.pivot.position.set(wide ? 1.95 : 0, wide ? 0.55 : 1.15, 0);
    raven.pivot.scale.setScalar(wide ? 1 : 0.78);
    environment.moonGroup.position.set(wide ? 2.7 : 0.5, wide ? 1.35 : 2.2, -2.6);
    lights.moonGlow.position.set(wide ? 2.7 : 0.5, 1.7, -1.2);
    gatherPoint.x = wide ? 1.15 : -0.55;
  }
  window.addEventListener('resize', resize);
  resize();

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const clock = new THREE.Clock();
  let animationFrame = null;
  let nextBlink = 2.2 + Math.random() * 3;
  let blinkTime = -1;

  function updateParallax() {
    pointer.x += (pointerTarget.x - pointer.x) * 0.045;
    pointer.y += (pointerTarget.y - pointer.y) * 0.045;
    eyeLook.x += (eyeTarget.x - eyeLook.x) * 0.11;
    eyeLook.y += (eyeTarget.y - eyeLook.y) * 0.11;

    root.rotation.y = pointer.x * 0.03;
    root.rotation.x = pointer.y * 0.02;
    farGroup.position.set(pointer.x * 0.035, -pointer.y * 0.028, 0);
    midGroup.position.set(pointer.x * 0.075, -pointer.y * 0.06, 0);
    nearGroup.position.set(pointer.x * 0.13, -pointer.y * 0.104, 0);
  }

  function updateRaven(time, delta) {
    raven.idle.position.y = Math.sin(time * 0.7) * 0.09;
    raven.idle.rotation.y = Math.sin(time * 0.24) * 0.065;
    raven.idle.rotation.z = Math.sin(time * 0.5) * 0.012;
    raven.idle.rotation.x = Math.sin(time * 0.33) * 0.018;
    raven.idle.scale.setScalar(1 - 0.07 * Math.exp(-time * 1.5));

    const breath = Math.sin(time * 0.82);
    raven.groups.head.rotation.y = eyeLook.x * 0.052;
    raven.groups.head.rotation.z = eyeLook.y * 0.024 + Math.sin(time * 0.38) * 0.008;
    raven.groups.neck.rotation.z = Math.sin(time * 0.66 + 0.8) * 0.012;
    raven.groups.wing.rotation.z = Math.sin(time * 0.57 + 1.4) * 0.01;
    raven.groups.chest.scale.set(1 + breath * 0.007, 1 + breath * 0.012, 1);
    raven.groups.tail.rotation.z = Math.sin(time * 0.43 + 2.1) * 0.009;

    if (!raven.eyeMesh) return;
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.1);
    raven.eyeMesh.material.emissiveIntensity = 0.9 + pulse * 0.25 + transition.scan * 1.15;
    if (raven.eyeGlow) raven.eyeGlow.material.opacity = 0.32 + pulse * 0.2 + transition.scan * 0.24;
    if (raven.eyeSpark) raven.eyeSpark.material.opacity = 0.5 + pulse * 0.28 + transition.scan * 0.18;
    if (raven.pupilMesh && raven.pupilOrigin) {
      raven.pupilMesh.position.x = raven.pupilOrigin.x + eyeLook.x * 0.52;
      raven.pupilMesh.position.y = raven.pupilOrigin.y + eyeLook.y * 0.4;
    }
    if (time > nextBlink) {
      blinkTime = 0;
      nextBlink = time + 4 + Math.random() * 4;
    }
    if (blinkTime >= 0) {
      blinkTime += delta;
      const progress = blinkTime / 0.24;
      const blinkScale = progress >= 1
        ? 1
        : Math.max(0.08, Math.abs(Math.cos(progress * Math.PI)));
      raven.eyeMesh.scale.y = blinkScale;
      if (raven.pupilMesh) raven.pupilMesh.scale.y = blinkScale;
    }
  }

  function updateEnvironment(time, delta) {
    for (const bank of environment.banks) {
      bank.position.x = bank.userData.baseX
        + Math.sin(time * 0.07 + bank.userData.phase)
          * bank.userData.drift * (1 - transition.exit * 0.7);
    }

    environment.moonGroup.scale.setScalar(1 - transition.exit * 0.08);
    environment.dustPoints.material.opacity = 0.38 * (1 - transition.exit * 0.75);
    raven.halo.material.opacity = 1 - transition.exit * 0.35;
    lights.ambient.intensity = 0.6 - transition.exit * 0.18;
    lights.key.intensity = 2.3 - transition.exit * 0.7 + transition.scan * 0.22;
    lights.rim.intensity = 1.7 + transition.scan * 0.5;
    lights.moonGlow.intensity = 5 - transition.exit * 2.5 + transition.scan * 1.2;

    const dustPositions = environment.dustGeometry.attributes.position.array;
    for (let index = 0; index < environment.dustCount; index++) {
      dustPositions[index * 3 + 1] += delta * 0.055;
      if (dustPositions[index * 3 + 1] > 4.3) dustPositions[index * 3 + 1] = -4.3;
    }
    environment.dustGeometry.attributes.position.needsUpdate = true;

    for (const scrap of environment.scraps) {
      const state = scrap.userData;
      state.y -= state.vy * delta;
      if (state.y < -3.9) state.y = 3.9;
      const driftingX = state.baseX + Math.sin(time * 0.4 + state.phase) * 0.35;
      scrap.position.x = THREE.MathUtils.lerp(
        driftingX,
        gatherPoint.x + state.gatherX,
        transition.exit
      );
      scrap.position.y = THREE.MathUtils.lerp(
        state.y,
        gatherPoint.y + state.gatherY,
        transition.exit
      );
      scrap.rotation.z += state.rz * delta;
      scrap.rotation.x = Math.sin(time * 0.7 + state.phase) * 0.38 * (1 - transition.scan * 0.7);
      scrap.material.opacity = state.baseOpacity
        * (1 + transition.scan * 0.28)
        * (1 - transition.exit * 0.88);
      scrap.scale.setScalar(1 - transition.exit * 0.55);
    }
  }

  function frame() {
    const delta = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    transition.scan += (transition.scanTarget - transition.scan) * 0.12;
    transition.exit += (transition.exitTarget - transition.exit) * 0.08;
    updateParallax();
    updateRaven(time, delta);
    updateEnvironment(time, delta);
    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(frame);
  }

  if (reduceMotion) {
    raven.idle.scale.setScalar(1);
    renderer.render(scene, camera);
  } else {
    frame();
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!animationFrame && !reduceMotion) frame();
      } else {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    });
  }, { threshold: 0.02 });
  observer.observe(canvas);
}
