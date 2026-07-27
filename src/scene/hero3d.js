import * as THREE from 'three';

/*
 * Hero scene —— "纸雕渡鸦 · 月夜"
 *
 * 品牌乌鸦(public/raven.svg)被重建为一座分层纸雕:logo 的每条路径
 * 都是一块extruded 墨色纸板,像影子戏箱一样叠出几毫米的层次。
 * 它悬在一轮撕纸月亮之下、层叠的撕边雾岸之上,刚被解密的 hex
 * 印在碎纸片上纷纷飘落。鼠标移动时,整个立体透视箱按深度视差位移。
 *
 * 自包含:无外部资源、无加载器——logo 路径是纯 M/L/Z 多边形,内联解析。
 */

// ---------------------------------------------------------------------------
// logo path data (viewBox 0 0 281 251, SVG y-down)
// ---------------------------------------------------------------------------
const VB_W = 281;
const VB_H = 251;

// [svg path, stack height (svg units), paper tone] —— 从背到前叠放
const RAVEN_PLATES = [
  {
    name: 'body',
    z: 0,
    color: 0x1a2030,
    d: 'M8,36L4,46L19,45L33,48L41,48L50,50L50,52L53,51L55,53L54,56L58,57L57,65L59,66L58,72L54,78L56,77L60,78L56,90L54,93L49,97L53,97L57,95L60,92L60,95L58,98L55,107L55,112L54,114L56,110L60,109L58,115L58,129L61,138L62,127L64,121L66,119L68,121L68,132L70,141L77,158L82,165L80,156L81,137L84,147L90,158L92,160L100,177L101,181L101,188L103,182L103,169L101,163L102,159L106,164L110,172L109,166L111,165L124,178L127,184L127,189L110,205L106,207L96,206L90,207L86,211L86,215L89,212L95,213L125,212L128,211L154,211L165,212L169,214L168,210L165,207L146,204L156,196L163,189L164,194L167,186L169,188L171,180L175,180L184,183L191,187L205,202L223,227L232,236L238,240L247,244L257,246L266,246L268,245L268,242L264,237L267,236L276,237L276,233L263,220L236,189L239,189L247,193L249,193L256,197L265,200L273,201L258,185L228,157L231,156L234,158L239,159L239,156L237,151L224,134L207,115L196,95L188,84L176,73L160,64L158,62L155,61L150,56L145,46L147,46L139,37L142,36L146,38L129,21L127,20L130,19L128,17L122,14L120,12L106,6L95,4L79,5L69,8L61,15L50,17L44,17L27,22L16,28Z',
  },
  {
    name: 'talons',
    z: 3,
    color: 0x1f2636,
    d: 'M151,180L153,184L153,189L138,204L135,206L123,207L118,205L125,198L131,194L140,186L143,179L147,176Z',
  },
  {
    name: 'crown',
    z: 4,
    color: 0x1e2535,
    d: 'M10,40L16,33L24,27L40,22L47,23L43,26L47,26L50,28L49,30L57,30L65,32L71,35L73,37L70,38L65,36L57,35L43,35L21,38L13,41Z',
  },
  {
    name: 'wing',
    z: 6,
    color: 0x262e40,
    d: 'M125,68L140,68L147,71L130,72L126,73L122,75L119,78L115,86L115,99L117,108L122,118L128,127L133,133L148,147L146,148L135,140L123,128L114,115L114,113L111,108L108,98L108,88L110,81L113,76L117,72Z',
  },
  {
    name: 'beak',
    z: 7,
    color: 0x252d3f,
    d: 'M28,38L34,38L42,36L59,36L66,37L69,41Z',
  },
  {
    name: 'coverts',
    z: 8,
    color: 0x2c3548,
    d: 'M97,114L104,135L98,129L96,125L95,116Z',
  },
  {
    name: 'hackles',
    z: 9,
    color: 0x293244,
    d: 'M88,53L100,60L104,66L103,70L99,64L101,77L99,80L97,76L97,72L95,68L95,79L90,94L89,101L87,98L87,83L82,93L81,98L82,113L81,116L76,107L75,102L76,86L70,96L69,92L71,88L71,84L68,85L68,83L73,79L74,73L76,69L78,72L78,78L80,71L79,67L80,64L84,70L84,77L84,64L83,59L86,62L89,68L89,71L89,67L87,62L89,59L92,62L87,55Z',
  },
  {
    name: 'eye',
    z: 12,
    color: 0xff2414,
    eye: true,
    d: 'M89,20L92,23L92,28L89,31L84,32L80,29L79,27L87,28L89,25L85,24L85,22L87,20Z',
  },
];

// ---------------------------------------------------------------------------
// tiny polygon parser —— logo paths only use M / L / Z
// ---------------------------------------------------------------------------
function shapesFromPath(d) {
  const shapes = [];
  let shape = null;
  const re = /([MLZ])([^MLZ]*)/g;
  let m;
  while ((m = re.exec(d))) {
    const raw = m[2].trim();
    if (m[1] === 'Z') {
      if (shape) shape.closePath();
      continue;
    }
    const [x, y] = raw.split(',').map(Number);
    // SVG y-down -> y-up, centered on the viewBox middle
    const px = x - VB_W / 2;
    const py = VB_H / 2 - y;
    if (m[1] === 'M') {
      shape = new THREE.Shape();
      shape.moveTo(px, py);
      shapes.push(shape);
    } else if (shape) {
      shape.lineTo(px, py);
    }
  }
  return shapes;
}

function plateGeometry(d, depth) {
  return new THREE.ExtrudeGeometry(shapesFromPath(d), {
    depth,
    bevelEnabled: true,
    bevelThickness: 1.1,
    bevelSize: 0.8,
    bevelSegments: 1,
    curveSegments: 1,
  });
}

// torn-paper edge helper: a circle / band with low-frequency ragged jitter
function tornDiscShape(radius, seed) {
  const shape = new THREE.Shape();
  const N = 46;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r =
      radius *
      (1 +
        0.034 * Math.sin(a * 3 + seed) +
        0.021 * Math.sin(a * 7 + seed * 2.1) +
        0.012 * Math.sin(a * 12 + seed * 3.7));
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
}

function fogBankShape(width, height, seed) {
  const shape = new THREE.Shape();
  const half = width / 2;
  const N = 26;
  shape.moveTo(-half, -0.4);
  for (let i = 0; i <= N; i++) {
    const x = -half + (width * i) / N;
    const n =
      0.55 * Math.sin(i * 0.9 + seed) +
      0.32 * Math.sin(i * 2.3 + seed * 1.7) +
      0.13 * Math.sin(i * 5.1 + seed * 2.9);
    shape.lineTo(x, height * (0.62 + 0.38 * (n * 0.5 + 0.5)));
  }
  shape.lineTo(half, -0.4);
  shape.closePath();
  return shape;
}

// paper scrap texture: warm paper, ragged clip, faint crypto hex print
function scrapTexture(lines) {
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 128;
  const g = c.getContext('2d');

  // ragged rectangle clip
  const j = () => (Math.random() - 0.5) * 12;
  g.beginPath();
  g.moveTo(8 + j(), 8 + j());
  g.lineTo(96 + j(), 6 + j());
  g.lineTo(184 + j(), 9 + j());
  g.lineTo(186 + j(), 64 + j());
  g.lineTo(183 + j(), 119 + j());
  g.lineTo(92 + j(), 122 + j());
  g.lineTo(7 + j(), 118 + j());
  g.lineTo(5 + j(), 62 + j());
  g.closePath();
  g.clip();

  g.fillStyle = '#e8e2d1';
  g.fillRect(0, 0, 192, 128);

  // tea-stain flecks
  g.fillStyle = 'rgba(122, 108, 82, 0.10)';
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    g.arc(Math.random() * 192, Math.random() * 128, 6 + Math.random() * 16, 0, Math.PI * 2);
    g.fill();
  }

  g.fillStyle = '#5d5647';
  g.font = '600 17px "JetBrains Mono", "SFMono-Regular", Consolas, monospace';
  lines.forEach((l, i) => g.fillText(l, 18, 48 + i * 32));

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// radial glow textures for the red eye -------------------------------------
// ring: transparent centre (keeps the pupil black) -> red halo -> fade out
function ringGlowTexture(inner, mid) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0.0, 'rgba(0,0,0,0)');
  grd.addColorStop(0.30, 'rgba(0,0,0,0)');
  grd.addColorStop(0.46, inner);
  grd.addColorStop(0.64, mid);
  grd.addColorStop(0.82, 'rgba(150,8,2,0.22)');
  grd.addColorStop(1.0, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// dot: bright centre -> fade out (the wet catch-light)
function dotGlowTexture(inner, mid) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0.0, inner);
  grd.addColorStop(0.45, mid);
  grd.addColorStop(1.0, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------------------------------------------------------------------------
// scene
// ---------------------------------------------------------------------------
export function initHero3D(canvas) {
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (e) {
    canvas.style.display = 'none';
    return;
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050506, 9.5, 19);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
  camera.position.set(0, 0, 9);

  const root = new THREE.Group();
  scene.add(root);

  // depth groups for parallax
  const gFar = new THREE.Group(); // moon, far bank, dust
  const gMid = new THREE.Group(); // raven
  const gNear = new THREE.Group(); // near banks, paper scraps
  root.add(gFar, gMid, gNear);

  // ---- lights: moonlit key + cool feather-sheen rim + faint moon bounce --
  scene.add(new THREE.AmbientLight(0x30384a, 0.6));
  const key = new THREE.DirectionalLight(0xe6ecff, 2.3);
  key.position.set(-5, 7, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7d90c8, 1.7);
  rim.position.set(6, 3, -6);
  scene.add(rim);
  const moonGlow = new THREE.PointLight(0xffe2b0, 5, 11, 2);
  moonGlow.position.set(2.7, 1.7, -1.2);
  scene.add(moonGlow);

  // ---- the paper-cut raven ------------------------------------------------
  const PLATE_DEPTH = 5; // svg units
  const RAVEN_SCALE = 0.0195; // 281 svg units -> ~4.6 world units

  const ravenPivot = new THREE.Group(); // positioned on resize
  const ravenIdle = new THREE.Group(); // idle animation lives here
  const raven = new THREE.Group(); // the plates
  ravenPivot.add(ravenIdle);
  ravenIdle.add(raven);
  gMid.add(ravenPivot);

  let eyeMesh = null;
  let eyeGlow = null;
  let eyeSpark = null;
  for (const p of RAVEN_PLATES) {
    const geo = plateGeometry(p.d, PLATE_DEPTH);
    let mat;
    if (p.eye) {
      mat = new THREE.MeshStandardMaterial({
        color: 0xff2414,
        emissive: 0xff1606,
        emissiveIntensity: 1.3,
        roughness: 0.28,
        metalness: 0.0,
        flatShading: true,
      });
    } else {
      mat = new THREE.MeshStandardMaterial({
        color: p.color,
        roughness: 0.92,
        metalness: 0.08,
        flatShading: true,
      });
    }
    const mesh = new THREE.Mesh(geo, mat);
    if (p.eye) {
      // center the eye geometry on itself so blinking scales around its own middle
      geo.computeBoundingBox();
      const c = new THREE.Vector3();
      geo.boundingBox.getCenter(c);
      geo.translate(-c.x, -c.y, 0);
      mesh.position.set(c.x, c.y, p.z);
      eyeMesh = mesh;
      // crimson iris glow (ring-shaped so the black pupil stays dark) +
      // a sharp white catch-light — the glossy-starling red eye look.
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: ringGlowTexture('rgba(255,46,22,0.95)', 'rgba(224,14,5,0.7)'),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      glow.scale.set(26, 26, 1);
      glow.position.set(0, 0, 2);
      glow.renderOrder = 2;
      mesh.add(glow);
      const spark = new THREE.Sprite(new THREE.SpriteMaterial({
        map: dotGlowTexture('rgba(255,255,255,0.98)', 'rgba(255,150,120,0.55)'),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      spark.scale.set(3.4, 3.4, 1);
      spark.position.set(-1.3, 1.7, 3);
      spark.renderOrder = 3;
      mesh.add(spark);
      eyeGlow = glow;
      eyeSpark = spark;
    } else {
      mesh.position.z = p.z;
    }
    raven.add(mesh);
  }
  raven.scale.setScalar(RAVEN_SCALE);
  raven.rotation.y = 0.22;


  // ---- raven halo: soft glow so the paper silhouette floats ----------------
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 256; haloCanvas.height = 256;
  const hg = haloCanvas.getContext('2d');
  const grad = hg.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(180, 195, 230, 0.22)');
  grad.addColorStop(0.5, 'rgba(140, 160, 210, 0.08)');
  grad.addColorStop(1, 'rgba(100, 120, 180, 0)');
  hg.fillStyle = grad; hg.fillRect(0, 0, 256, 256);
  const haloTex = new THREE.CanvasTexture(haloCanvas);
  haloTex.colorSpace = THREE.SRGBColorSpace;
  const ravenHalo = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 5.8),
    new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  ravenHalo.position.set(0, 0, -0.5);
  ravenIdle.add(ravenHalo);

  // ---- torn-paper moon ----------------------------------------------------
  const moonGroup = new THREE.Group();
  const moonMat = new THREE.MeshStandardMaterial({
    color: 0xe9e2cf,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.24,
    flatShading: true,
  });
  const moon = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tornDiscShape(2.85, 1.7), { depth: 0.14, bevelEnabled: false }),
    moonMat
  );
  const moonHalo = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tornDiscShape(3.5, 4.2), { depth: 0.1, bevelEnabled: false }),
    new THREE.MeshBasicMaterial({ color: 0xd9d8cf, transparent: true, opacity: 0.07 })
  );
  moonHalo.position.z = -0.35;
  moonHalo.rotation.z = 0.5;
  moonGroup.add(moonHalo, moon);
  moonGroup.position.set(2.7, 1.35, -2.6);
  gFar.add(moonGroup);

  // ---- torn fog banks -----------------------------------------------------
  const banks = [];
  const bankDefs = [
    { w: 32, h: 2.6, y: -4.05, z: -7, color: 0x171d2b, seed: 2.2, drift: 0.5 },
    { w: 32, h: 2.3, y: -3.8, z: -4, color: 0x10151f, seed: 5.8, drift: 0.34 },
    { w: 32, h: 2.0, y: -3.55, z: -2, color: 0x0a0d14, seed: 9.1, drift: 0.22 },
  ];
  for (const b of bankDefs) {
    const mesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(fogBankShape(b.w, b.h, b.seed), { depth: 0.4, bevelEnabled: false }),
      new THREE.MeshStandardMaterial({ color: b.color, roughness: 1, metalness: 0, flatShading: true })
    );
    mesh.position.set(0, b.y, b.z);
    mesh.userData = { baseX: 0, drift: b.drift, phase: b.seed };
    banks.push(mesh);
    gFar.add(mesh);
  }

  // ---- dust motes ----------------------------------------------------------
  const DUST = 130;
  const dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 15;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 8.4;
    dustPos[i * 3 + 2] = -3 + Math.random() * 5;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0xb9c2d6,
      size: 0.035,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  gFar.add(dust);

  // ---- paper scraps carrying decrypted hex ---------------------------------
  const scrapTexts = [
    ['AES-128-CBC', 'key 9F4A E307 55D1'],
    ['SHA-256', 'e3b0 c442 98fc 1c14'],
    ['PLAIN \u25b8', '64 65 63 72 79 70'], // "decryp"
    ['HMAC-SHA1', 'd0 e1 f2 03 8a 9b'],
    ['PBKDF2', 'iter 4096 \u00b7 ok'],
    ['IV', '0000 0000 0000 0000'],
  ];
  const scrapTextures = scrapTexts.map((l) => scrapTexture(l));
  const scrapGeo = new THREE.PlaneGeometry(0.42, 0.28);
  const scraps = [];
  const SCRAP_N = 26;
  for (let i = 0; i < SCRAP_N; i++) {
    const mat = new THREE.MeshBasicMaterial({
      map: scrapTextures[i % scrapTextures.length],
      transparent: true,
      opacity: 0.30 + Math.random() * 0.30,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(scrapGeo, mat);
    let x = (Math.random() - 0.5) * 11.5;
    if (x < -2.6 && Math.random() < 0.55) x += 4.5; // keep the copy side airy
    mesh.position.set(x, (Math.random() - 0.5) * 7.4, -1.2 + Math.random() * 2.8);
    mesh.rotation.set(Math.random() * 0.6, Math.random() * 0.6, Math.random() * Math.PI);
    mesh.userData = {
      baseX: x,
      y: mesh.position.y,
      vy: 0.1 + Math.random() * 0.17,
      phase: Math.random() * Math.PI * 2,
      rz: (Math.random() - 0.5) * 0.35,
    };
    scraps.push(mesh);
    gNear.add(mesh);
  }

  // ---- interaction: diorama parallax ---------------------------------------
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  if (!reduce) {
    window.addEventListener(
      'pointermove',
      (e) => {
        target.x = (e.clientX / window.innerWidth) * 2 - 1;
        target.y = (e.clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true }
    );
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const wide = w > 860;
    ravenPivot.position.set(wide ? 1.95 : 0, wide ? 0.55 : 1.15, 0);
    ravenPivot.scale.setScalar(wide ? 1 : 0.78);
    moonGroup.position.set(wide ? 2.7 : 0.5, wide ? 1.35 : 2.2, -2.6);
    moonGlow.position.set(wide ? 2.7 : 0.5, 1.7, -1.2);
  }
  window.addEventListener('resize', resize);
  resize();

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // ---- animation ------------------------------------------------------------
  let raf = null;
  const clock = new THREE.Clock();
  let nextBlink = 2.2 + Math.random() * 3;
  let blinkT = -1;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    cur.x += (target.x - cur.x) * 0.045;
    cur.y += (target.y - cur.y) * 0.045;

    // depth parallax —— far layers lag, near layers lead
    root.rotation.y = cur.x * 0.03;
    root.rotation.x = cur.y * 0.02;
    gFar.position.set(cur.x * 0.1 * 0.35, -cur.y * 0.08 * 0.35, 0);
    gMid.position.set(cur.x * 0.1 * 0.75, -cur.y * 0.08 * 0.75, 0);
    gNear.position.set(cur.x * 0.1 * 1.3, -cur.y * 0.08 * 1.3, 0);

    // raven idle: hover, bank, and turn just enough to show the paper layers
    ravenIdle.position.y = Math.sin(t * 0.7) * 0.09;
    ravenIdle.rotation.y = Math.sin(t * 0.24) * 0.16;
    ravenIdle.rotation.z = Math.sin(t * 0.5) * 0.022;
    ravenIdle.rotation.x = Math.sin(t * 0.33) * 0.035;
    ravenIdle.scale.setScalar(1 - 0.07 * Math.exp(-t * 1.5)); // settle in

    // amber eye: breathe + blink
    if (eyeMesh) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.1); // 0..1 breathing
      eyeMesh.material.emissiveIntensity = 1.15 + pulse * 0.5;
      if (eyeGlow) eyeGlow.material.opacity = 0.55 + pulse * 0.35;
      if (eyeSpark) eyeSpark.material.opacity = 0.55 + pulse * 0.45;
      if (t > nextBlink) {
        blinkT = 0;
        nextBlink = t + 4 + Math.random() * 4;
      }
      if (blinkT >= 0) {
        blinkT += dt;
        const p = blinkT / 0.24;
        eyeMesh.scale.y = p >= 1 ? 1 : Math.max(0.08, Math.abs(Math.cos(p * Math.PI)));
      }
    }

    // fog banks breathe sideways
    for (const b of banks) {
      b.position.x = b.userData.baseX + Math.sin(t * 0.07 + b.userData.phase) * b.userData.drift;
    }

    // dust drifts up
    const dp = dustGeo.attributes.position.array;
    for (let i = 0; i < DUST; i++) {
      dp[i * 3 + 1] += dt * 0.055;
      if (dp[i * 3 + 1] > 4.3) dp[i * 3 + 1] = -4.3;
    }
    dustGeo.attributes.position.needsUpdate = true;

    // paper scraps flutter down
    for (const s of scraps) {
      const u = s.userData;
      u.y -= u.vy * dt;
      if (u.y < -3.9) u.y = 3.9;
      s.position.y = u.y;
      s.position.x = u.baseX + Math.sin(t * 0.4 + u.phase) * 0.35;
      s.rotation.z += u.rz * dt;
      s.rotation.x = Math.sin(t * 0.7 + u.phase) * 0.38;
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  if (reduce) {
    ravenIdle.scale.setScalar(1);
    renderer.render(scene, camera);
  } else {
    frame();
  }

  // pause when hero is off-screen
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          if (!raf && !reduce) frame();
        } else {
          cancelAnimationFrame(raf);
          raf = null;
        }
      });
    },
    { threshold: 0.02 }
  );
  io.observe(canvas);
}
