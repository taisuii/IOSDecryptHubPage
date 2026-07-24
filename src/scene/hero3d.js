import * as THREE from 'three';

// A "decryption core": a glowing wireframe icosahedron wrapped in an
// orbiting particle field and a scanning ring. Mouse parallax, self-contained.
export function initHero3D(canvas) {
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.style.display = 'none';
    return;
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const root = new THREE.Group();
  scene.add(root);

  const MINT = new THREE.Color(0x40e0c4);
  const MINT_D = new THREE.Color(0x0b7f7a);
  const BLUE = new THREE.Color(0x4db7ff);
  const AMBER = new THREE.Color(0xffc66d);

  // --- core: icosahedron wireframe ---
  const coreGeo = new THREE.IcosahedronGeometry(2.15, 1);
  const edges = new THREE.EdgesGeometry(coreGeo);
  const core = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: MINT, transparent: true, opacity: 0.55 })
  );
  root.add(core);

  // inner solid faceted glow
  const innerMat = new THREE.MeshBasicMaterial({ color: MINT_D, transparent: true, opacity: 0.06, side: THREE.DoubleSide });
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 1), innerMat);
  root.add(inner);

  // vertex nodes
  const pos = coreGeo.attributes.position;
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', pos.clone());
  const nodes = new THREE.Points(nodeGeo, new THREE.PointsMaterial({ color: MINT, size: 0.09, transparent: true, opacity: 0.9 }));
  root.add(nodes);

  // --- orbiting particle field ---
  const COUNT = 620;
  const parr = new Float32Array(COUNT * 3);
  const carr = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = 3.1 + Math.random() * 3.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    parr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    parr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    parr[i * 3 + 2] = r * Math.cos(phi);
    seeds[i] = Math.random();
    const c = seeds[i] < 0.34 ? MINT : seeds[i] < 0.72 ? BLUE : AMBER;
    carr[i * 3] = c.r; carr[i * 3 + 1] = c.g; carr[i * 3 + 2] = c.b;
  }
  const fieldGeo = new THREE.BufferGeometry();
  fieldGeo.setAttribute('position', new THREE.BufferAttribute(parr, 3));
  fieldGeo.setAttribute('color', new THREE.BufferAttribute(carr, 3));
  const field = new THREE.Points(fieldGeo, new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false }));
  root.add(field);

  // --- scanning ring ---
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.7, 0.02, 8, 120),
    new THREE.MeshBasicMaterial({ color: MINT_D, transparent: true, opacity: 0.45 })
  );
  ring.rotation.x = Math.PI / 2.2;
  root.add(ring);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(3.3, 0.012, 8, 120),
    new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.22 })
  );
  ring2.rotation.x = Math.PI / 1.7;
  ring2.rotation.y = Math.PI / 5;
  root.add(ring2);

  root.rotation.x = 0.35;
  root.position.x = 1.2;

  // --- interaction ---
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  function onMove(e) {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    target.x = nx * 0.35;
    target.y = ny * 0.25;
  }
  window.addEventListener('pointermove', onMove, { passive: true });

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // shift core toward the right half on wide screens, center on narrow
    root.position.x = w > 860 ? 1.25 : 0;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  let raf;
  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    cur.x += (target.x - cur.x) * 0.05;
    cur.y += (target.y - cur.y) * 0.05;

    root.rotation.y = t * 0.12 + cur.x;
    root.rotation.x = 0.35 + cur.y;
    core.rotation.y = -t * 0.05;
    core.rotation.z = t * 0.03;
    nodes.rotation.copy(core.rotation);
    inner.rotation.copy(core.rotation);
    field.rotation.y = t * 0.04;
    field.rotation.x = t * 0.02;
    ring.rotation.z = t * 0.5;
    ring2.rotation.z = -t * 0.3;

    const pulse = 1 + Math.sin(t * 1.6) * 0.03;
    core.scale.setScalar(pulse);
    nodes.material.opacity = 0.6 + Math.sin(t * 2) * 0.3;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  if (reduce) {
    renderer.render(scene, camera);
  } else {
    frame();
  }

  // pause when hero off-screen
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { if (!raf && !reduce) frame(); }
      else { cancelAnimationFrame(raf); raf = null; }
    });
  }, { threshold: 0.02 });
  io.observe(canvas);
}
