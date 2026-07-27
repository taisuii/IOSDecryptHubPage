import * as THREE from 'three';
import {
  createDotGlowTexture,
  createRavenHaloTexture,
  createRingGlowTexture,
} from './textures.js';

const VB_W = 281;
const VB_H = 251;
const PLATE_DEPTH = 5;
const EYE_DEPTH = 1.2;
const PUPIL_DEPTH = 0.8;
const RAVEN_SCALE = 0.0195;

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
    color: 0xd90b16,
    eye: true,
    d: 'M89,25L88,23L86,22L84,23L83,25L84,27L86,28L88,27Z',
  },
  {
    name: 'pupil',
    z: 13,
    color: 0x050505,
    pupil: true,
    d: 'M87.5,25L86.75,23.7L85.25,23.7L84.5,25L85.25,26.3L86.75,26.3Z',
  },
];

function shapesFromPath(path) {
  const shapes = [];
  let shape = null;
  const commandPattern = /([MLZ])([^MLZ]*)/g;
  let command;
  while ((command = commandPattern.exec(path))) {
    const raw = command[2].trim();
    if (command[1] === 'Z') {
      if (shape) shape.closePath();
      continue;
    }
    const [x, y] = raw.split(',').map(Number);
    const px = x - VB_W / 2;
    const py = VB_H / 2 - y;
    if (command[1] === 'M') {
      shape = new THREE.Shape();
      shape.moveTo(px, py);
      shapes.push(shape);
    } else if (shape) {
      shape.lineTo(px, py);
    }
  }
  return shapes;
}

function plateGeometry(path, depth, bevelScale = 1) {
  return new THREE.ExtrudeGeometry(shapesFromPath(path), {
    depth,
    bevelEnabled: true,
    bevelThickness: 1.1 * bevelScale,
    bevelSize: 0.8 * bevelScale,
    bevelSegments: 1,
    curveSegments: 1,
  });
}

function createPlateMaterial(plate) {
  if (plate.eye) {
    return new THREE.MeshStandardMaterial({
      color: plate.color,
      emissive: 0xe80012,
      emissiveIntensity: 1,
      roughness: 0.28,
      metalness: 0,
      flatShading: true,
    });
  }
  if (plate.pupil) {
    return new THREE.MeshStandardMaterial({
      color: 0x050505,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 1,
      metalness: 0,
      flatShading: true,
    });
  }
  return new THREE.MeshStandardMaterial({
    color: plate.color,
    roughness: 0.92,
    metalness: 0.08,
    flatShading: true,
  });
}

export function createRavenModel(parent) {
  const pivot = new THREE.Group();
  const idle = new THREE.Group();
  const plates = new THREE.Group();
  const meshes = new Map();
  pivot.add(idle);
  idle.add(plates);
  parent.add(pivot);

  let eyeMesh = null;
  let pupilMesh = null;
  let pupilOrigin = null;
  let eyeGlow = null;
  let eyeSpark = null;

  for (const plate of RAVEN_PLATES) {
    const eyePart = plate.eye || plate.pupil;
    const depth = plate.pupil ? PUPIL_DEPTH : (plate.eye ? EYE_DEPTH : PLATE_DEPTH);
    const geometry = plateGeometry(plate.d, depth, eyePart ? 0.18 : 1);
    const mesh = new THREE.Mesh(geometry, createPlateMaterial(plate));

    if (eyePart) {
      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox.getCenter(center);
      geometry.translate(-center.x, -center.y, 0);
      mesh.position.set(center.x, center.y, plate.z);
      if (plate.pupil) {
        pupilMesh = mesh;
        pupilOrigin = mesh.position.clone();
      } else {
        eyeMesh = mesh;
        eyeGlow = new THREE.Sprite(new THREE.SpriteMaterial({
          map: createRingGlowTexture('rgba(255,10,24,0.9)', 'rgba(205,0,14,0.62)'),
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }));
        eyeGlow.scale.set(10, 10, 1);
        eyeGlow.position.set(0, 0, EYE_DEPTH + 0.4);
        eyeGlow.renderOrder = 2;
        mesh.add(eyeGlow);

        eyeSpark = new THREE.Sprite(new THREE.SpriteMaterial({
          map: createDotGlowTexture('rgba(255,255,255,0.98)', 'rgba(255,150,120,0.55)'),
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }));
        eyeSpark.scale.set(1.1, 1.1, 1);
        eyeSpark.position.set(-0.45, 0.55, EYE_DEPTH + 2);
        eyeSpark.renderOrder = 3;
        mesh.add(eyeSpark);
      }
    } else {
      mesh.position.z = plate.z;
    }
    meshes.set(plate.name, mesh);
    plates.add(mesh);
  }

  plates.scale.setScalar(RAVEN_SCALE);
  plates.rotation.y = 0.22;

  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 5.8),
    new THREE.MeshBasicMaterial({
      map: createRavenHaloTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  halo.position.set(0, 0, -0.5);
  idle.add(halo);

  return {
    pivot,
    idle,
    plates,
    meshes,
    halo,
    eyeMesh,
    pupilMesh,
    pupilOrigin,
    eyeGlow,
    eyeSpark,
  };
}
